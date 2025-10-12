// Delivery Worker API Routes
// Handles order management, location tracking, and delivery operations for delivery workers

import express from 'express';
import { attachUser, requireRole } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { audit } from '../utils/audit.js';
import { broadcast } from '../utils/realtimeHub.js';

const router = express.Router();

// Middleware to ensure user has delivery role
const requireDelivery = requireRole('delivery');

// GET /api/delivery/orders/assigned - Get orders assigned to the logged-in delivery worker
router.get('/orders/assigned', attachUser, requireDelivery, async (req, res) => {
  try {
    const workerId = req.user?.id;
    
    // Find delivery worker profile
    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker profile not found' });
    }

    // Get assigned deliveries
    const assignments = await prisma.deliveryAssignment.findMany({
      where: {
        workerId: worker.id,
        status: {
          in: ['pending', 'accepted', 'in_progress']
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    // Enrich with order details
    const ordersWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const order = await prisma.order.findUnique({
          where: { id: assignment.orderId },
          include: {
            items: {
              include: { Product: true }
            }
          }
        });

        return {
          assignment,
          order
        };
      })
    );

    res.json({ ok: true, data: ordersWithDetails });
  } catch (error) {
    console.error('[Delivery] Error fetching assigned orders:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch assigned orders' });
  }
});

// PATCH /api/delivery/orders/:id/status - Update delivery assignment status
router.patch('/orders/:id/status', attachUser, requireDelivery, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const workerId = req.user?.id;

    // Find delivery worker
    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    // Find assignment
    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    });

    if (!assignment || assignment.workerId !== worker.id) {
      return res.status(404).json({ ok: false, error: 'Assignment not found or not authorized' });
    }

    // Update status with appropriate timestamps
    const updateData = { status, updatedAt: new Date() };
    if (status === 'accepted') updateData.acceptedAt = new Date();
    if (status === 'in_progress') updateData.startedAt = new Date();
    if (status === 'delivered') {
      updateData.deliveredAt = new Date();
      // Calculate actual duration
      if (assignment.startedAt) {
        const duration = Math.floor((Date.now() - assignment.startedAt.getTime()) / 60000);
        updateData.actualDuration = duration;
      }
    }

    const updated = await prisma.deliveryAssignment.update({
      where: { id },
      data: updateData
    });

    // Update order status if delivered
    if (status === 'delivered') {
      await prisma.order.update({
        where: { id: assignment.orderId },
        data: { status: 'delivered' }
      });

      // Update worker stats
      await prisma.deliveryWorker.update({
        where: { id: worker.id },
        data: { totalDeliveries: { increment: 1 } }
      });
    }

    // Broadcast real-time update
    broadcast('delivery:status', {
      assignmentId: id,
      orderId: assignment.orderId,
      status,
      workerId: worker.id,
      timestamp: new Date().toISOString()
    });

    // Audit log
    await audit({
      action: 'delivery_status_update',
      entity: 'DeliveryAssignment',
      entityId: id,
      userId: workerId,
      meta: { status, orderId: assignment.orderId }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Delivery] Error updating status:', error);
    res.status(500).json({ ok: false, error: 'Failed to update status' });
  }
});

// POST /api/delivery/orders/:id/accept - Accept delivery assignment
router.post('/orders/:id/accept', attachUser, requireDelivery, async (req, res) => {
  try {
    const { id } = req.params;
    const workerId = req.user?.id;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    });

    if (!assignment || assignment.workerId !== worker.id) {
      return res.status(404).json({ ok: false, error: 'Assignment not found' });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({ ok: false, error: 'Assignment cannot be accepted in current status' });
    }

    const updated = await prisma.deliveryAssignment.update({
      where: { id },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    broadcast('delivery:accepted', {
      assignmentId: id,
      orderId: assignment.orderId,
      workerId: worker.id,
      timestamp: new Date().toISOString()
    });

    await audit({
      action: 'delivery_accepted',
      entity: 'DeliveryAssignment',
      entityId: id,
      userId: workerId,
      meta: { orderId: assignment.orderId }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Delivery] Error accepting order:', error);
    res.status(500).json({ ok: false, error: 'Failed to accept order' });
  }
});

// POST /api/delivery/orders/:id/reject - Reject delivery assignment
router.post('/orders/:id/reject', attachUser, requireDelivery, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const workerId = req.user?.id;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    });

    if (!assignment || assignment.workerId !== worker.id) {
      return res.status(404).json({ ok: false, error: 'Assignment not found' });
    }

    if (assignment.status !== 'pending') {
      return res.status(400).json({ ok: false, error: 'Only pending assignments can be rejected' });
    }

    const updated = await prisma.deliveryAssignment.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason || 'No reason provided'
      }
    });

    broadcast('delivery:rejected', {
      assignmentId: id,
      orderId: assignment.orderId,
      workerId: worker.id,
      reason: reason || 'No reason provided',
      timestamp: new Date().toISOString()
    });

    await audit({
      action: 'delivery_rejected',
      entity: 'DeliveryAssignment',
      entityId: id,
      userId: workerId,
      meta: { orderId: assignment.orderId, reason }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Delivery] Error rejecting order:', error);
    res.status(500).json({ ok: false, error: 'Failed to reject order' });
  }
});

// POST /api/delivery/location/update - Update current location
router.post('/location/update', attachUser, requireDelivery, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading } = req.body;
    const workerId = req.user?.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ ok: false, error: 'Latitude and longitude required' });
    }

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    const location = await prisma.deliveryLocation.create({
      data: {
        workerId: worker.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null
      }
    });

    // Broadcast location update to admin and customers with active deliveries
    broadcast('delivery:location', {
      workerId: worker.id,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    }, (client) => client.role === 'admin'); // Only admins see all locations

    res.json({ ok: true, data: location });
  } catch (error) {
    console.error('[Delivery] Error updating location:', error);
    res.status(500).json({ ok: false, error: 'Failed to update location' });
  }
});

// POST /api/delivery/orders/:id/proof - Upload delivery proof
router.post('/orders/:id/proof', attachUser, requireDelivery, async (req, res) => {
  try {
    const { id } = req.params;
    const { proofType, proofData } = req.body;
    const workerId = req.user?.id;

    if (!proofType || !proofData) {
      return res.status(400).json({ ok: false, error: 'Proof type and data required' });
    }

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    });

    if (!assignment || assignment.workerId !== worker.id) {
      return res.status(404).json({ ok: false, error: 'Assignment not found' });
    }

    const updated = await prisma.deliveryAssignment.update({
      where: { id },
      data: {
        proofType,
        proofData,
        status: 'delivered',
        deliveredAt: new Date()
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: 'delivered' }
    });

    // Update worker stats
    await prisma.deliveryWorker.update({
      where: { id: worker.id },
      data: { totalDeliveries: { increment: 1 } }
    });

    broadcast('delivery:completed', {
      assignmentId: id,
      orderId: assignment.orderId,
      workerId: worker.id,
      timestamp: new Date().toISOString()
    });

    await audit({
      action: 'delivery_completed',
      entity: 'DeliveryAssignment',
      entityId: id,
      userId: workerId,
      meta: { orderId: assignment.orderId, proofType }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Delivery] Error uploading proof:', error);
    res.status(500).json({ ok: false, error: 'Failed to upload proof' });
  }
});

// GET /api/delivery/history - Get delivery history
router.get('/history', attachUser, requireDelivery, async (req, res) => {
  try {
    const workerId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [assignments, total] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where: {
          workerId: worker.id,
          status: { in: ['delivered', 'failed', 'cancelled'] }
        },
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.deliveryAssignment.count({
        where: {
          workerId: worker.id,
          status: { in: ['delivered', 'failed', 'cancelled'] }
        }
      })
    ]);

    res.json({
      ok: true,
      data: assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Delivery] Error fetching history:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch history' });
  }
});

// GET /api/delivery/stats - Get delivery worker stats
router.get('/stats', attachUser, requireDelivery, async (req, res) => {
  try {
    const workerId = req.user?.id;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker not found' });
    }

    // Get stats
    const [completed, pending, totalDistance] = await Promise.all([
      prisma.deliveryAssignment.count({
        where: { workerId: worker.id, status: 'delivered' }
      }),
      prisma.deliveryAssignment.count({
        where: { workerId: worker.id, status: { in: ['pending', 'accepted', 'in_progress'] } }
      }),
      prisma.deliveryAssignment.aggregate({
        where: { workerId: worker.id, status: 'delivered' },
        _sum: { actualDistance: true }
      })
    ]);

    // Get recent ratings
    const ratingsData = await prisma.deliveryAssignment.findMany({
      where: {
        workerId: worker.id,
        customerRating: { not: null }
      },
      select: { customerRating: true },
      orderBy: { deliveredAt: 'desc' },
      take: 50
    });

    const avgRating = ratingsData.length > 0
      ? ratingsData.reduce((sum, r) => sum + (r.customerRating || 0), 0) / ratingsData.length
      : 0;

    res.json({
      ok: true,
      data: {
        totalDeliveries: worker.totalDeliveries,
        completedDeliveries: completed,
        pendingDeliveries: pending,
        rating: worker.rating || avgRating,
        totalDistance: totalDistance._sum.actualDistance || 0,
        status: worker.status
      }
    });
  } catch (error) {
    console.error('[Delivery] Error fetching stats:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch stats' });
  }
});

// GET /api/delivery/profile - Get delivery worker profile
router.get('/profile', attachUser, requireDelivery, async (req, res) => {
  try {
    const workerId = req.user?.id;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { userId: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Delivery worker profile not found' });
    }

    res.json({ ok: true, data: worker });
  } catch (error) {
    console.error('[Delivery] Error fetching profile:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch profile' });
  }
});

export default router;

// Admin Delivery Management Routes
// Handles delivery worker management, monitoring, and system administration

import express from 'express';
import { attachUser, requireAdmin } from '../middleware/auth.js';
import prisma from '../db/client.js';
import { audit } from '../utils/audit.js';

const router = express.Router();

// GET /api/admin/delivery/workers - List all delivery workers
router.get('/workers', attachUser, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [workers, total] = await Promise.all([
      prisma.deliveryWorker.findMany({
        where,
        include: {
          _count: {
            select: {
              assignments: true,
              locations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.deliveryWorker.count({ where })
    ]);

    // Enrich with user info
    const enriched = await Promise.all(
      workers.map(async (worker) => {
        const user = await prisma.user.findUnique({
          where: { id: worker.userId },
          select: { id: true, email: true, name: true, phone: true }
        });
        return { ...worker, user };
      })
    );

    res.json({
      ok: true,
      data: enriched,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching workers:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch workers' });
  }
});

// GET /api/admin/delivery/workers/:id - Get specific worker details
router.get('/workers/:id', attachUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true, locations: true }
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Worker not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: worker.userId },
      select: { id: true, email: true, name: true, phone: true, createdAt: true }
    });

    // Get recent assignments
    const recentAssignments = await prisma.deliveryAssignment.findMany({
      where: { workerId: id },
      orderBy: { assignedAt: 'desc' },
      take: 10
    });

    res.json({
      ok: true,
      data: {
        ...worker,
        user,
        recentAssignments
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching worker details:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch worker details' });
  }
});

// POST /api/admin/delivery/workers - Create new delivery worker
router.post('/workers', attachUser, requireAdmin, async (req, res) => {
  try {
    const { userId, vehicleType, vehicleNumber, licenseNumber, workStartTime, workEndTime, allowedZones } = req.body;

    if (!userId) {
      return res.status(400).json({ ok: false, error: 'User ID required' });
    }

    // Verify user exists and doesn't already have a delivery worker profile
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const existingWorker = await prisma.deliveryWorker.findUnique({
      where: { userId }
    });

    if (existingWorker) {
      return res.status(400).json({ ok: false, error: 'User already has a delivery worker profile' });
    }

    // Update user role to delivery
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'delivery' }
    });

    // Create delivery worker profile
    const worker = await prisma.deliveryWorker.create({
      data: {
        userId,
        vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null,
        licenseNumber: licenseNumber || null,
        workStartTime: workStartTime || null,
        workEndTime: workEndTime || null,
        allowedZones: allowedZones || null,
        status: 'active'
      }
    });

    await audit({
      action: 'delivery_worker_created',
      entity: 'DeliveryWorker',
      entityId: worker.id,
      userId: req.user.id,
      meta: { targetUserId: userId }
    });

    res.json({ ok: true, data: worker });
  } catch (error) {
    console.error('[Admin] Error creating worker:', error);
    res.status(500).json({ ok: false, error: 'Failed to create worker' });
  }
});

// PATCH /api/admin/delivery/workers/:id - Update delivery worker
router.patch('/workers/:id', attachUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, vehicleType, vehicleNumber, licenseNumber, workStartTime, workEndTime, allowedZones, rating } = req.body;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { id }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Worker not found' });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) updateData.vehicleNumber = vehicleNumber;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (workStartTime !== undefined) updateData.workStartTime = workStartTime;
    if (workEndTime !== undefined) updateData.workEndTime = workEndTime;
    if (allowedZones !== undefined) updateData.allowedZones = allowedZones;
    if (rating !== undefined) updateData.rating = parseFloat(rating);

    const updated = await prisma.deliveryWorker.update({
      where: { id },
      data: updateData
    });

    await audit({
      action: 'delivery_worker_updated',
      entity: 'DeliveryWorker',
      entityId: id,
      userId: req.user.id,
      meta: { changes: updateData }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Admin] Error updating worker:', error);
    res.status(500).json({ ok: false, error: 'Failed to update worker' });
  }
});

// DELETE /api/admin/delivery/workers/:id - Delete delivery worker
router.delete('/workers/:id', attachUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await prisma.deliveryWorker.findUnique({
      where: { id }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Worker not found' });
    }

    // Check for active assignments
    const activeAssignments = await prisma.deliveryAssignment.count({
      where: {
        workerId: id,
        status: { in: ['pending', 'accepted', 'in_progress'] }
      }
    });

    if (activeAssignments > 0) {
      return res.status(400).json({ ok: false, error: 'Cannot delete worker with active assignments' });
    }

    await prisma.deliveryWorker.delete({
      where: { id }
    });

    // Update user role back to user
    await prisma.user.update({
      where: { id: worker.userId },
      data: { role: 'user' }
    });

    await audit({
      action: 'delivery_worker_deleted',
      entity: 'DeliveryWorker',
      entityId: id,
      userId: req.user.id,
      meta: { targetUserId: worker.userId }
    });

    res.json({ ok: true, message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('[Admin] Error deleting worker:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete worker' });
  }
});

// GET /api/admin/delivery/locations - Get all current worker locations
router.get('/locations', attachUser, requireAdmin, async (req, res) => {
  try {
    // Get latest location for each active worker
    const workers = await prisma.deliveryWorker.findMany({
      where: { status: 'active' },
      include: {
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      }
    });

    const locationsData = workers
      .filter(w => w.locations.length > 0)
      .map(w => ({
        workerId: w.id,
        userId: w.userId,
        location: w.locations[0]
      }));

    res.json({ ok: true, data: locationsData });
  } catch (error) {
    console.error('[Admin] Error fetching locations:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch locations' });
  }
});

// GET /api/admin/delivery/locations/:workerId - Get location history for specific worker
router.get('/locations/:workerId', attachUser, requireAdmin, async (req, res) => {
  try {
    const { workerId } = req.params;
    const { from, to, limit = 100 } = req.query;

    const where = { workerId };
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const locations = await prisma.deliveryLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json({ ok: true, data: locations });
  } catch (error) {
    console.error('[Admin] Error fetching worker locations:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch worker locations' });
  }
});

// POST /api/admin/delivery/assignments - Create new delivery assignment
router.post('/assignments', attachUser, requireAdmin, async (req, res) => {
  try {
    const {
      orderId,
      workerId,
      pickupAddress,
      deliveryAddress,
      estimatedDistance,
      estimatedDuration,
      notes
    } = req.body;

    if (!orderId || !workerId) {
      return res.status(400).json({ ok: false, error: 'Order ID and Worker ID required' });
    }

    // Verify order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ ok: false, error: 'Order not found' });
    }

    // Verify worker exists
    const worker = await prisma.deliveryWorker.findUnique({
      where: { id: workerId }
    });

    if (!worker) {
      return res.status(404).json({ ok: false, error: 'Worker not found' });
    }

    // Check if order already has an active assignment
    const existingAssignment = await prisma.deliveryAssignment.findFirst({
      where: {
        orderId,
        status: { in: ['pending', 'accepted', 'in_progress'] }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ ok: false, error: 'Order already has an active delivery assignment' });
    }

    const assignment = await prisma.deliveryAssignment.create({
      data: {
        orderId,
        workerId,
        pickupAddress: pickupAddress || null,
        deliveryAddress: deliveryAddress || null,
        estimatedDistance: estimatedDistance ? parseFloat(estimatedDistance) : null,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        notes: notes || null,
        status: 'pending'
      }
    });

    await audit({
      action: 'delivery_assignment_created',
      entity: 'DeliveryAssignment',
      entityId: assignment.id,
      userId: req.user.id,
      meta: { orderId, workerId }
    });

    res.json({ ok: true, data: assignment });
  } catch (error) {
    console.error('[Admin] Error creating assignment:', error);
    res.status(500).json({ ok: false, error: 'Failed to create assignment' });
  }
});

// GET /api/admin/delivery/assignments - List all delivery assignments
router.get('/assignments', attachUser, requireAdmin, async (req, res) => {
  try {
    const { status, workerId, orderId, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (workerId) where.workerId = workerId;
    if (orderId) where.orderId = orderId;

    const [assignments, total] = await Promise.all([
      prisma.deliveryAssignment.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.deliveryAssignment.count({ where })
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
    console.error('[Admin] Error fetching assignments:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch assignments' });
  }
});

// PATCH /api/admin/delivery/assignments/:id - Update delivery assignment (admin override)
router.patch('/assignments/:id', attachUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, workerId, notes, customerRating, customerFeedback } = req.body;

    const assignment = await prisma.deliveryAssignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      return res.status(404).json({ ok: false, error: 'Assignment not found' });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (workerId !== undefined) updateData.workerId = workerId;
    if (notes !== undefined) updateData.notes = notes;
    if (customerRating !== undefined) updateData.customerRating = parseInt(customerRating);
    if (customerFeedback !== undefined) updateData.customerFeedback = customerFeedback;

    const updated = await prisma.deliveryAssignment.update({
      where: { id },
      data: updateData
    });

    await audit({
      action: 'delivery_assignment_updated',
      entity: 'DeliveryAssignment',
      entityId: id,
      userId: req.user.id,
      meta: { changes: updateData }
    });

    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error('[Admin] Error updating assignment:', error);
    res.status(500).json({ ok: false, error: 'Failed to update assignment' });
  }
});

// GET /api/admin/delivery/stats - Get system-wide delivery stats
router.get('/stats', attachUser, requireAdmin, async (req, res) => {
  try {
    const [
      totalWorkers,
      activeWorkers,
      totalAssignments,
      pendingAssignments,
      inProgressAssignments,
      completedAssignments,
      failedAssignments
    ] = await Promise.all([
      prisma.deliveryWorker.count(),
      prisma.deliveryWorker.count({ where: { status: 'active' } }),
      prisma.deliveryAssignment.count(),
      prisma.deliveryAssignment.count({ where: { status: 'pending' } }),
      prisma.deliveryAssignment.count({ where: { status: 'in_progress' } }),
      prisma.deliveryAssignment.count({ where: { status: 'delivered' } }),
      prisma.deliveryAssignment.count({ where: { status: 'failed' } })
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayDeliveries, todayRevenue] = await Promise.all([
      prisma.deliveryAssignment.count({
        where: {
          status: 'delivered',
          deliveredAt: { gte: today }
        }
      }),
      prisma.deliveryAssignment.aggregate({
        where: {
          status: 'delivered',
          deliveredAt: { gte: today }
        },
        _sum: { actualDistance: true }
      })
    ]);

    res.json({
      ok: true,
      data: {
        workers: {
          total: totalWorkers,
          active: activeWorkers
        },
        assignments: {
          total: totalAssignments,
          pending: pendingAssignments,
          inProgress: inProgressAssignments,
          completed: completedAssignments,
          failed: failedAssignments
        },
        today: {
          deliveries: todayDeliveries,
          distance: todayRevenue._sum.actualDistance || 0
        }
      }
    });
  } catch (error) {
    console.error('[Admin] Error fetching stats:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch stats' });
  }
});

export default router;

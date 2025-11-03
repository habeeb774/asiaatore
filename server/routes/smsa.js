import express from 'express';
import { createSmsaShipment, trackSmsaShipment, cancelSmsaShipment } from '../utils/smsa.js';
import { requireAdmin } from '../middleware/auth.js';
import prisma from '../db/client.js';

const router = express.Router();

// Create a new shipment
router.post('/create', requireAdmin, async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required.' });
  }

  try {
    let order = null;
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });
    } catch (e) {
      // DB may be unavailable; in sandbox we allow simulated response without DB writes
    }

    if (!order) {
      // If not found and not sandbox, return 404
      if (process.env.SMSA_SANDBOX === '1') {
        // Construct minimal order shape for sandbox
        order = { id: orderId, userId: 'sandbox-user', user: { name: 'Sandbox User', phone: '0500000000' }, deliveryLocation: { city: 'Riyadh' }, grandTotal: 100 };
      } else {
        return res.status(404).json({ error: 'Order not found.' });
      }
    }

    const shipmentDetails = await createSmsaShipment(order);

    // Persist to DB if available; otherwise return simulated result
    try {
      const createdShipment = await prisma.shipment.create({
        data: {
          orderId: order.id,
          provider: shipmentDetails.provider,
          trackingNumber: shipmentDetails.trackingNumber,
          status: shipmentDetails.status || 'created',
          meta: shipmentDetails || undefined,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'SHIPPED' },
      });

      return res.status(201).json({ ...shipmentDetails, id: createdShipment.id });
    } catch (e) {
      // If DB fails but we're in sandbox, still return shipment details
      if (process.env.SMSA_SANDBOX === '1') {
        return res.status(201).json(shipmentDetails);
      }
      throw e;
    }
  } catch (error) {
    console.error('Failed to create SMSA shipment:', error);
    res.status(500).json({ error: 'Failed to create shipment.', details: error.message });
  }
});

// Track a shipment
router.get('/track/:trackingNumber', async (req, res) => {
  const { trackingNumber } = req.params;

  if (!trackingNumber) {
    return res.status(400).json({ error: 'Tracking number is required.' });
  }

  try {
    const trackingInfo = await trackSmsaShipment(trackingNumber);
    res.json(trackingInfo);
  } catch (error) {
    console.error('Failed to track SMSA shipment:', error);
    res.status(500).json({ error: 'Failed to track shipment.', details: error.message });
  }
});

// Cancel a shipment
router.post('/cancel', requireAdmin, async (req, res) => {
  const { trackingNumber, reason } = req.body;

  if (!trackingNumber) {
    return res.status(400).json({ error: 'Tracking number is required.' });
  }

  try {
    const cancellationInfo = await cancelSmsaShipment(trackingNumber, reason);

    // Best-effort DB update
    try {
      const existing = await prisma.shipment.findUnique({ where: { trackingNumber } });
      if (existing) {
        await prisma.shipment.update({ where: { trackingNumber }, data: { status: 'cancelled' } });
        await prisma.order.update({ where: { id: existing.orderId }, data: { status: 'CANCELLED' } });
      }
    } catch {}

    res.json(cancellationInfo);
  } catch (error) {
    console.error('Failed to cancel SMSA shipment:', error);
    res.status(500).json({ error: 'Failed to cancel shipment.', details: error.message });
  }
});

export default router;

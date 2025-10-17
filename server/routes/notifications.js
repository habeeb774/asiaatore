import { Router } from 'express';
import { audit } from '../utils/audit.js';

const router = Router();

// Stub endpoint to receive order notifications and queue/send via WhatsApp provider.
// This is intentionally lightweight — it logs the event and returns 202 Accepted.
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body || {};
    // Basic validation
    if (!body.event || !body.orderId) return res.status(400).json({ error: 'INVALID_BODY', message: 'event and orderId required' });
    // In production you'd enqueue to a job queue or call a provider API (Twilio/360dialog)
    audit({ action: 'notify.whatsapp', entity: 'Order', entityId: body.orderId, userId: body.userId || null, meta: { event: body.event } });
    console.log('[NOTIFY] whatsapp', body.event, 'order', body.orderId);
    return res.status(202).json({ ok: true, queued: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;

import { Router } from 'express';
import { audit } from '../utils/audit.js';
import { broadcast } from '../utils/realtimeHub.js';

const router = Router();

// In-memory notifications store (per process). For production, persist via DB.
const notifications = [];

// Create a notification and broadcast to target user or all users
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const { title, message, userId = null, type = 'info', meta = {} } = body;
    if (!title || !message) return res.status(400).json({ error: 'INVALID_BODY', message: 'title and message required' });
    const note = { id: `n_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, title, message, userId, type, meta, read: false, createdAt: new Date().toISOString() };
    notifications.push(note);
    // Audit for traceability
    audit({ action: 'notification.create', entity: 'Notification', entityId: note.id, userId: req.user?.id || null, meta: { userId, type } });
    // Broadcast via realtime hub. If userId provided, predicate will target that user only.
    broadcast('notification', note, (client) => !userId || client.userId === String(userId));
    return res.status(201).json({ ok: true, notification: note });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// List recent notifications (optionally filter by userId)
router.get('/', async (req, res) => {
  try {
    const uid = req.query.userId || req.user?.id || null;
    const list = uid ? notifications.filter(n => String(n.userId) === String(uid)) : notifications.slice(-50).reverse();
    return res.json({ ok: true, notifications: list });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// WhatsApp stub preserved for backwards compatibility
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.event || !body.orderId) return res.status(400).json({ error: 'INVALID_BODY', message: 'event and orderId required' });
    audit({ action: 'notify.whatsapp', entity: 'Order', entityId: body.orderId, userId: body.userId || null, meta: { event: body.event } });
    console.log('[NOTIFY] whatsapp', body.event, 'order', body.orderId);
    return res.status(202).json({ ok: true, queued: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;

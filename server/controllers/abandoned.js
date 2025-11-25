import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { upsertCart, listAbandoned, markNotified, markRecoveredByOrder } from '../modules/abandoned/service.js';

const router = express.Router();

// Feature flag
const ENABLED = process.env.ABANDONED_CART_ENABLED === 'true';

router.use((req,res,next)=> {
  if (!ENABLED) return res.status(404).json({ error:'NOT_ENABLED', message:'Abandoned cart feature disabled' });
  next();
});

// Upsert snapshot (user or session). Auth optional to allow guest carts; if auth present, use userId.
router.post('/snapshot', async (req,res) => {
  try {
    const { items, sessionId } = req.body || {};
    const userId = req.user?.id || null; // attachUser may have run in global middleware
    if (!userId && !sessionId) return res.status(400).json({ error:'MISSING_ID', message:'Provide sessionId or be authenticated' });
    const row = await upsertCart({ userId, sessionId, items });
    res.json({ ok:true, cart: row });
  } catch (e) {
    res.status(500).json({ error:'UPsertFailed', message:e.message });
  }
});

// List abandoned carts (admin only)
router.get('/', requireAdmin, async (req,res) => {
  try {
    const olderThanMinutes = Number(req.query.olderThanMinutes)||30;
    const rows = await listAbandoned({ olderThanMinutes });
    res.json({ ok:true, carts: rows });
  } catch (e) {
    res.status(500).json({ error:'LIST_FAILED', message:e.message });
  }
});

// Mark notified
router.post('/:id/notify', requireAdmin, async (req,res) => {
  try {
    const row = await markNotified(Number(req.params.id));
    res.json({ ok:true, cart: row });
  } catch (e) {
    res.status(500).json({ error:'NOTIFY_FAILED', message:e.message });
  }
});

// Manual recovery marking (admin) - usually implicit via order
router.post('/:id/recover', requireAdmin, async (req,res) => {
  try {
    const row = await markRecoveredByOrder({ userId: req.body.userId, orderId: req.body.orderId });
    res.json({ ok:true, cart: row });
  } catch (e) {
    res.status(500).json({ error:'RECOVER_FAILED', message:e.message });
  }
});

export default router;
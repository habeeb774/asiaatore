import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBalance, getLedger, addPoints } from '../modules/loyalty/service.js';
import { addPointsSchema } from '../modules/loyalty/validation.js';

const router = Router();

router.get('/balance', requireAuth, async (req, res) => {
  const balance = await getBalance(req.user.id);
  res.json({ ok:true, balance });
});

router.get('/ledger', requireAuth, async (req, res) => {
  const page = parseInt(req.query.page || '1', 10); const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
  const data = await getLedger(req.user.id, { page, limit });
  res.json({ ok:true, ...data });
});

// Manual admin adjustment
router.post('/adjust', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'FORBIDDEN' });
  try {
    const parsed = addPointsSchema.parse(req.body || {});
    const result = await addPoints(parsed.userId, parsed.delta, { source: parsed.source || 'admin_adjust' });
    res.json({ ok:true, balance: result.balance, entry: result.ledgerEntry });
  } catch (e) {
    res.status(400).json({ error:'LOYALTY_ADJUST_FAILED', message: e.message });
  }
});

export default router;

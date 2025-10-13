import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();
router.use(attachUser);

// Require authenticated user
function requireUser(req, res, next) {
  if (!req.user || !req.user.id || req.user.id === 'guest') {
    return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
  }
  next();
}

// List wishlist items
router.get('/', requireUser, async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({ where: { userId: req.user.id } });
    return res.json({ ok: true, items });
  } catch (e) {
    // Degraded mode: when DB is unavailable in dev, return an empty list instead of 500
    if (process.env.ALLOW_INVALID_DB === 'true' || process.env.NODE_ENV !== 'production') {
      res.setHeader('x-fallback', 'no-db');
      return res.json({ ok: true, items: [] });
    }
    return res.status(503).json({ ok: false, error: 'DB_UNAVAILABLE', message: e.message });
  }
});

// Add
router.post('/', requireUser, async (req, res) => {
  try {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ ok: false, error: 'MISSING_PRODUCT' });
    await prisma.wishlistItem.upsert({ where: { userId_productId: { userId: req.user.id, productId } }, update: {}, create: { userId: req.user.id, productId } });
    res.status(201).json({ ok: true });
  } catch (e) {
    // Degraded mode: accept as no-op so UI can proceed without DB
    if (process.env.ALLOW_INVALID_DB === 'true' || process.env.NODE_ENV !== 'production') {
      res.setHeader('x-fallback', 'no-db');
      return res.status(202).json({ ok: true, note: 'ACCEPTED_NO_DB' });
    }
    res.status(500).json({ ok: false, error: 'FAILED_ADD', message: e.message });
  }
});

// Remove
router.delete('/:productId', requireUser, async (req, res) => {
  try {
    await prisma.wishlistItem.delete({ where: { userId_productId: { userId: req.user.id, productId: req.params.productId } } });
  } catch {}
  res.json({ ok: true });
});

export default router;

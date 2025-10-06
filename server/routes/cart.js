import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();
router.use(attachUser);

function requireUser(req, res, next) {
  if (!req.user || !req.user.id || req.user.id === 'guest') return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
  next();
}

// Get cart
router.get('/', requireUser, async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
    // Normalize shape for clients expecting productId/id
    res.json({ ok: true, items: items.map(i => ({ ...i, id: i.productId })) });
  } catch (e) {
    res.status(500).json({ ok:false, error:'LIST_FAILED', message: e.message });
  }
});

// Merge cart (client sends local items [{productId, quantity}])
router.post('/merge', requireUser, async (req, res) => {
  try {
    const localItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!localItems.length) {
      const items = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
      return res.json({ ok: true, items: items.map(i => ({ ...i, id: i.productId })) });
    }

    // 1) Normalize: sum quantities per productId and clamp per-item inputs to [1..99]
    const incomingMap = new Map();
    for (const it of localItems) {
      const pid = String(it?.productId || '').trim();
      if (!pid) continue;
      const qtyParsed = parseInt(it.quantity ?? 1, 10);
      const qty = Number.isFinite(qtyParsed) ? Math.max(1, Math.min(99, qtyParsed)) : 1;
      incomingMap.set(pid, (incomingMap.get(pid) || 0) + qty);
    }
    if (!incomingMap.size) {
      const items = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
      return res.json({ ok: true, items: items.map(i => ({ ...i, id: i.productId })) });
    }

    const productIds = Array.from(incomingMap.keys());

    // 2) Validate product ids exist to avoid FK errors (skip invalid)
    const validProducts = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } });
    const validSet = new Set(validProducts.map(p => p.id));
    for (const pid of productIds) {
      if (!validSet.has(pid)) incomingMap.delete(pid);
    }
    if (!incomingMap.size) {
      const items = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
      return res.json({ ok: true, items: items.map(i => ({ ...i, id: i.productId })) });
    }

    // 3) Load existing cart rows for the user for just these productIds
    const existing = await prisma.cartItem.findMany({ where: { userId: req.user.id, productId: { in: Array.from(incomingMap.keys()) } } });
    const existingMap = new Map(existing.map(i => [i.productId, i]));

    // 4) Compute final clamped quantities and upsert
    const ops = [];
    for (const [pid, addQty] of incomingMap.entries()) {
      const current = existingMap.get(pid)?.quantity || 0;
      const finalQty = Math.min(99, Math.max(1, current + addQty));
      ops.push(
        prisma.cartItem.upsert({
          where: { userId_productId: { userId: req.user.id, productId: pid } },
          update: { quantity: finalQty },
          create: { userId: req.user.id, productId: pid, quantity: finalQty }
        })
      );
    }
    if (ops.length) await prisma.$transaction(ops);

  const merged = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
  res.json({ ok: true, items: merged.map(i => ({ ...i, id: i.productId })) });
  } catch (e) {
    // Surface Prisma codes more readably
    if (e && e.code) {
      const code = String(e.code);
      if (code === 'P2003') return res.status(400).json({ ok: false, error: 'FK_CONSTRAINT', message: 'One or more products no longer exist.' });
      if (code === 'P2002') return res.status(409).json({ ok: false, error: 'DUPLICATE_ITEM', message: 'Duplicate cart item.' });
    }
    res.status(500).json({ ok: false, error: 'MERGE_FAILED', message: e.message });
  }
});

// Set single item quantity
router.post('/set', requireUser, async (req, res) => {
  try {
    const { productId, quantity } = req.body || {};
    if (!productId) return res.status(400).json({ ok:false, error:'MISSING_PRODUCT' });
    // verify product exists to avoid FK violation
    const exists = await prisma.product.findUnique({ where: { id: String(productId) } });
    if (!exists) return res.status(400).json({ ok:false, error:'PRODUCT_NOT_FOUND' });
    const qty = Math.min(99, Math.max(0, parseInt(quantity||0,10)));
    if (qty === 0) {
      try { await prisma.cartItem.delete({ where: { userId_productId: { userId: req.user.id, productId } } }); } catch {}
      return res.json({ ok: true, removed: true });
    }
    const updated = await prisma.cartItem.upsert({ where: { userId_productId: { userId: req.user.id, productId } }, update: { quantity: qty }, create: { userId: req.user.id, productId, quantity: qty } });
    res.json({ ok: true, item: updated });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'SET_FAILED', message: e.message });
  }
});

// Clear cart
router.delete('/', requireUser, async (req, res) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
  res.json({ ok: true });
});

export default router;

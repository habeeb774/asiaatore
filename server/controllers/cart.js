import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();
router.use(attachUser);

// In degraded mode (ALLOW_INVALID_DB=true), Prisma calls will throw; provide safe fallbacks
const ALLOW_DEGRADED = process.env.ALLOW_INVALID_DB === 'true';
const isDbDisabled = (e) => ALLOW_DEGRADED || (e && (e.code === 'DB_DISABLED' || /Degraded mode: DB disabled/i.test(e.message || '')));

// In development (or when ALLOW_DEV_HEADERS=true), if requests use dev headers with a user id
// that doesn't exist in DB yet, auto-provision a minimal user to avoid FK violations on CartItem
async function ensureDbUserIfDev(req) {
  try {
    if (!req.user?.id) return;
    const allowDevHeaders = process.env.ALLOW_DEV_HEADERS === 'true' || process.env.NODE_ENV !== 'production';
    if (!allowDevHeaders) return;
    const found = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (found) return;
    const email = req.user.email || `${req.user.id}@dev.local`;
    await prisma.user.create({
      data: {
        id: req.user.id,
        email,
        password: 'dev-autocreated',
        role: (req.user.role === 'admin' ? 'admin' : 'user'),
        name: req.user.email || 'Dev User'
      }
    });
  } catch (_) {
    // ignore – best-effort; if it still fails, handlers will return clear FK_CONSTRAINT
  }
}

// Ensure user exists (dev auto-provision) for all cart routes
router.use(async (req, _res, next) => { await ensureDbUserIfDev(req); next(); });

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
    if (isDbDisabled(e)) return res.json({ ok: true, items: [] });
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

    // 4) Load product stocks
    const products = await prisma.product.findMany({ where: { id: { in: Array.from(incomingMap.keys()) } }, select: { id: true, stock: true } });
    const stockMap = new Map(products.map(p => [p.id, Number(p.stock) || 0]));

    // 5) Compute final quantities with stock-aware clamping and prepare operations
    const upserts = [];
    const stockUpdates = [];
    const skipped = [];
    for (const [pid, addQty] of incomingMap.entries()) {
      const current = existingMap.get(pid)?.quantity || 0;
      const desired = Math.min(99, Math.max(1, current + addQty));
      const available = stockMap.get(pid) ?? 0;
      const deltaAdd = Math.max(0, desired - current);
      // Cap additions by available stock; if none, skip increasing
      const allowedAdd = Math.min(deltaAdd, Math.max(0, available));
      const finalQty = current + allowedAdd; // may equal current if no stock
      if (finalQty <= 0) {
        // couldn't add this product (likely out of stock)
        skipped.push({ productId: pid, reason: 'OUT_OF_STOCK' });
        continue;
      }
      upserts.push(
        prisma.cartItem.upsert({
          where: { userId_productId: { userId: req.user.id, productId: pid } },
          update: { quantity: finalQty },
          create: { userId: req.user.id, productId: pid, quantity: finalQty }
        })
      );
      if (allowedAdd > 0) {
        stockUpdates.push(prisma.product.update({ where: { id: pid }, data: { stock: { decrement: allowedAdd } } }));
        stockMap.set(pid, available - allowedAdd);
      }
    }
    if (upserts.length || stockUpdates.length) await prisma.$transaction([...upserts, ...stockUpdates]);

  const merged = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
  res.json({ ok: true, items: merged.map(i => ({ ...i, id: i.productId })), skipped });
  } catch (e) {
    // Surface Prisma codes more readably
    if (e && e.code) {
      const code = String(e.code);
      if (code === 'P2003') return res.status(400).json({ ok: false, error: 'FK_CONSTRAINT', message: 'One or more products no longer exist.' });
      if (code === 'P2002') return res.status(409).json({ ok: false, error: 'DUPLICATE_ITEM', message: 'Duplicate cart item.' });
    }
    if (isDbDisabled(e)) return res.json({ ok: true, items: [], skipped: [] });
    res.status(500).json({ ok: false, error: 'MERGE_FAILED', message: e.message });
  }
});

// Set single item quantity
router.post('/set', requireUser, async (req, res) => {
  try {
    const { productId, quantity } = req.body || {};
    if (!productId) return res.status(400).json({ ok:false, error:'MISSING_PRODUCT' });
    // verify product exists to avoid FK violation
    const product = await prisma.product.findUnique({ where: { id: String(productId) }, select: { id: true, stock: true } });
    if (!product) return res.status(400).json({ ok:false, error:'PRODUCT_NOT_FOUND' });
    const qty = Math.min(99, Math.max(0, parseInt(quantity||0,10)));

    const existing = await prisma.cartItem.findUnique({ where: { userId_productId: { userId: req.user.id, productId: String(productId) } } });
    const currentQty = existing?.quantity || 0;
    const delta = qty - currentQty;

    if (qty === 0) {
      // Remove item and restock by currentQty
      await prisma.$transaction([
        prisma.cartItem.delete({ where: { userId_productId: { userId: req.user.id, productId: String(productId) } } }).catch(() => null),
        currentQty > 0 ? prisma.product.update({ where: { id: String(productId) }, data: { stock: { increment: currentQty } } }) : null
      ].filter(Boolean));
      return res.json({ ok: true, removed: true });
    }

    if (delta > 0) {
      // Increasing quantity: require sufficient stock
      if ((product.stock || 0) < delta) return res.status(400).json({ ok:false, error:'INSUFFICIENT_STOCK', available: Number(product.stock) || 0 });
      const [updated] = await prisma.$transaction([
        prisma.cartItem.upsert({ where: { userId_productId: { userId: req.user.id, productId: String(productId) } }, update: { quantity: qty }, create: { userId: req.user.id, productId: String(productId), quantity: qty } }),
        prisma.product.update({ where: { id: String(productId) }, data: { stock: { decrement: delta } } })
      ]);
      return res.json({ ok: true, item: updated });
    } else if (delta < 0) {
      // Decreasing quantity: return stock
      const restore = Math.abs(delta);
      const [updated] = await prisma.$transaction([
        prisma.cartItem.update({ where: { userId_productId: { userId: req.user.id, productId: String(productId) } }, data: { quantity: qty } }),
        prisma.product.update({ where: { id: String(productId) }, data: { stock: { increment: restore } } })
      ]);
      return res.json({ ok: true, item: updated });
    } else {
      // No change
      return res.json({ ok: true, item: existing || { userId: req.user.id, productId: String(productId), quantity: qty } });
    }
  } catch (e) {
    if (isDbDisabled(e)) return res.status(503).json({ ok: false, error: 'DB_DISABLED', message: 'Cart is unavailable in degraded mode' });
    res.status(500).json({ ok: false, error: 'SET_FAILED', message: e.message });
  }
});

// Clear cart
router.delete('/', requireUser, async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({ where: { userId: req.user.id } });
    if (!items.length) return res.json({ ok: true });
    const ops = [];
    for (const it of items) {
      if (it.quantity > 0) {
        ops.push(prisma.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } }));
      }
    }
    ops.push(prisma.cartItem.deleteMany({ where: { userId: req.user.id } }));
    await prisma.$transaction(ops);
    res.json({ ok: true });
  } catch (e) {
    if (isDbDisabled(e)) return res.json({ ok: true });
    res.status(500).json({ ok:false, error:'CLEAR_FAILED', message:e.message });
  }
});

// Remove a single item from cart and restore its stock
router.delete('/item/:productId', requireUser, async (req, res) => {
  try {
    const productId = String(req.params.productId || '').trim();
    if (!productId) return res.status(400).json({ ok: false, error: 'MISSING_PRODUCT' });
    const item = await prisma.cartItem.findUnique({ where: { userId_productId: { userId: req.user.id, productId } } });
    if (!item) return res.status(404).json({ ok: false, error: 'NOT_IN_CART' });
    const qty = Number(item.quantity) || 0;
    await prisma.$transaction([
      prisma.cartItem.delete({ where: { userId_productId: { userId: req.user.id, productId } } }),
      qty > 0 ? prisma.product.update({ where: { id: productId }, data: { stock: { increment: qty } } }) : null
    ].filter(Boolean));
    res.json({ ok: true, removed: { productId, quantity: qty } });
  } catch (e) {
    if (isDbDisabled(e)) return res.json({ ok: true, removed: { productId: String(req.params.productId || ''), quantity: 0 } });
    res.status(500).json({ ok: false, error: 'REMOVE_ITEM_FAILED', message: e.message });
  }
});

export default router;

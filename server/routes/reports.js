import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/inventory-movement?start_date=&end_date=&product_id=
router.get('/inventory-movement', requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date, product_id } = req.query || {};
    const where = {};
    if (product_id) where.productId = String(product_id);
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) { const d = new Date(String(start_date)); if (!isNaN(d)) where.createdAt.gte = d; }
      if (end_date) { const d = new Date(String(end_date)); if (!isNaN(d)) { if (/^\d{4}-\d{2}-\d{2}$/.test(String(end_date))) d.setHours(23,59,59,999); where.createdAt.lte = d; } }
    }
    const list = await prisma.inventoryTransaction.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, items: list });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_REPORT', message: e.message });
  }
});

// GET /api/reports/top-selling?start_date=&end_date=&limit=
router.get('/top-selling', requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query || {};
    const where = {};
    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) { const d = new Date(String(start_date)); if (!isNaN(d)) where.createdAt.gte = d; }
      if (end_date) { const d = new Date(String(end_date)); if (!isNaN(d)) { if (/^\d{4}-\d{2}-\d{2}$/.test(String(end_date))) d.setHours(23,59,59,999); where.createdAt.lte = d; } }
    }
    const grouped = await prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, where });
    // fetch product names
    const ids = grouped.map(g => g.productId).filter(Boolean);
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map(p => [p.id, p]));
    const items = grouped
      .map(g => ({ productId: g.productId, quantity: g._sum.quantity || 0, nameAr: byId.get(g.productId)?.nameAr || null, nameEn: byId.get(g.productId)?.nameEn || null }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, Math.min(100, Number(req.query?.limit) || 20));
    res.json({ ok: true, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_REPORT', message: e.message });
  }
});

// GET /api/reports/stock-valuation
router.get('/stock-valuation', requireAdmin, async (_req, res) => {
  try {
    // Sum quantity per product across warehouses and multiply by costPrice or price
    const inv = await prisma.inventory.findMany({});
    const byProduct = new Map();
    for (const r of inv) {
      byProduct.set(r.productId, (byProduct.get(r.productId) || 0) + (r.quantity || 0));
    }
    const ids = Array.from(byProduct.keys());
    const prods = await prisma.product.findMany({ where: { id: { in: ids } } });
    let totalValuation = 0;
    const items = prods.map(p => {
      const qty = byProduct.get(p.id) || 0;
      const unitCost = (p.costPrice != null && !Number.isNaN(Number(p.costPrice))) ? Number(p.costPrice) : Number(p.price) || 0;
      const value = unitCost * qty;
      totalValuation += value;
      return { productId: p.id, nameAr: p.nameAr, nameEn: p.nameEn, qty, unitCost, value };
    });
    res.json({ ok: true, totalValuation, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_REPORT', message: e.message });
  }
});

export default router;

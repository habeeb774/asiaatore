import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ ok: true, usage: 'GET /api/sellers/:id/products?page=1&pageSize=20&q=term&category=cat' });
});

// GET /api/sellers/:id/products — list products for a seller (public), with pagination and basic filters
router.get('/:id/products', attachUser, async (req, res) => {
  try {
    const sellerId = req.params.id;
    const { q, category, page, pageSize } = req.query;
    const where = { sellerId };
    if (category) where.category = String(category);
    if (q) {
      const needle = String(q);
      where.OR = [
        { nameAr: { contains: needle, mode: 'insensitive' } },
        { nameEn: { contains: needle, mode: 'insensitive' } }
      ];
    }
    const pg = page ? Math.max(1, parseInt(page, 10)) : 1;
    const ps = pageSize ? Math.min(100, Math.max(1, parseInt(pageSize, 10))) : 20;
    const skip = (pg - 1) * ps;
    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: ps })
    ]);
    res.json({ items, page: pg, pageSize: ps, total, totalPages: Math.ceil(total / ps) });
  } catch (e) {
    // If schema isn't migrated (missing sellerId), guide the caller
    if (e?.code === 'P2021' || /Unknown column 'sellerId'|doesn't exist/i.test(e?.message || '')) {
      return res.status(501).json({ error: 'FEATURE_NOT_AVAILABLE', message: 'Seller products requires DB schema update. Run: npx prisma migrate dev' });
    }
    res.status(500).json({ error: 'FAILED_LIST', message: e.message });
  }
});

export default router;
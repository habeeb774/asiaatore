import { Router } from 'express';
import prisma from '../db/client.js';

const router = Router();

// Basic typeahead: ?q=term  (returns products + matching category suggestions + last queries stub)
router.get('/typeahead', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json({ ok:true, products: [], categories: [] });
  const products = await prisma.product.findMany({ where: { OR: [ { nameAr: { contains: q } }, { nameEn: { contains: q } } ] }, take: 8, orderBy: { createdAt: 'desc' } });
  const categories = await prisma.category.findMany({ where: { OR: [ { nameAr: { contains: q } }, { nameEn: { contains: q } } ] }, take: 5 });
  res.json({ ok:true, products: products.map(p => ({ id: p.id, slug: p.slug, nameAr: p.nameAr, nameEn: p.nameEn, price: p.price })), categories: categories.map(c => ({ slug: c.slug, nameAr: c.nameAr, nameEn: c.nameEn })) });
});

export default router;

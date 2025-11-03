import { Router } from 'express';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = Router();
router.use(attachUser);

function requireUser(req, res, next) {
  if (!req.user || !req.user.id || req.user.id === 'guest') return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
  next();
}

// List approved reviews for a product
router.get('/product/:productId', async (req, res) => {
  const list = await prisma.review.findMany({ where: { productId: req.params.productId, status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ ok: true, reviews: list });
});

// Submit review (initially pending)
router.post('/', requireUser, async (req, res) => {
  try {
    const { productId, rating, title, body } = req.body || {};
    if (!productId || !rating) return res.status(400).json({ ok:false, error:'MISSING_FIELDS' });
    const r = await prisma.review.create({ data: { productId, userId: req.user.id, rating: Math.min(5, Math.max(1, parseInt(rating,10))), title: title || null, body: body || null } });
    res.status(201).json({ ok: true, review: r });
  } catch (e) {
    res.status(500).json({ ok:false, error:'CREATE_FAILED', message: e.message });
  }
});

// Admin moderation list
router.get('/moderation', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  const list = await prisma.review.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 200 });
  res.json({ ok:true, reviews: list });
});

// Approve / reject
router.post('/:id/moderate', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  try {
    const { action } = req.body || {};
    if (!['approve','reject'].includes(action)) return res.status(400).json({ ok:false, error:'INVALID_ACTION' });
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
    res.json({ ok:true, review: updated });
  } catch (e) {
    res.status(500).json({ ok:false, error:'MODERATE_FAILED', message: e.message });
  }
});

// Batch moderate: { ids: string[], action: 'approve'|'reject' }
router.post('/moderate-batch', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ ok:false, error:'FORBIDDEN' });
  try {
    const { ids, action } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ ok:false, error:'INVALID_IDS' });
    if (!['approve','reject'].includes(action)) return res.status(400).json({ ok:false, error:'INVALID_ACTION' });
    const status = action === 'approve' ? 'approved' : 'rejected';
    await prisma.review.updateMany({ where: { id: { in: ids.map(String) } }, data: { status } });
    const updated = await prisma.review.findMany({ where: { id: { in: ids.map(String) } } });
    res.json({ ok:true, updated });
  } catch (e) {
    res.status(500).json({ ok:false, error:'MODERATE_BATCH_FAILED', message: e.message });
  }
});

export default router;

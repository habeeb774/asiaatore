import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import { createCoupon } from '../modules/coupons/service.js';
import { createCouponSchema, validateCouponSchema } from '../modules/coupons/validation.js';
import { validateCoupon } from '../modules/coupons/service.js';

const router = Router();

// Admin create coupon
router.post('/', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'FORBIDDEN' });
  try {
    const parsed = createCouponSchema.parse(req.body || {});
    const coupon = await createCoupon(parsed, req.user);
    res.status(201).json({ ok:true, coupon });
  } catch (e) {
    res.status(400).json({ error:'COUPON_CREATE_FAILED', message: e.message });
  }
});

// Validate coupon code against subtotal
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const parsed = validateCouponSchema.parse(req.body || {});
    const result = await validateCoupon({ code: parsed.code, userId: req.user.id, subtotal: parsed.subtotal });
    if (!result.ok) return res.status(400).json(result);
    res.json({ ok:true, discount: result.discount, code: result.code });
  } catch (e) {
    res.status(400).json({ error:'COUPON_VALIDATE_FAILED', message: e.message });
  }
});

// List coupons (admin)
router.get('/', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error:'FORBIDDEN' });
  const list = await prisma.coupon.findMany({ orderBy:{ createdAt:'desc' }, take:200 });
  res.json({ ok:true, coupons:list });
});

export default router;

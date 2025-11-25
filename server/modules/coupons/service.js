import prisma from '../../db/client.js';
import { audit } from '../../utils/audit.js';

export async function createCoupon(data, user) {
  const { code, type, value, maxUses, userLimit, minSubtotal, startsAt, endsAt, active } = data;
  const coupon = await prisma.coupon.create({ data: {
    code: code.trim().toUpperCase(), type, value: Number(value), maxUses: maxUses || null,
    userLimit: userLimit || null, minSubtotal: minSubtotal || null,
    startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null,
    active: active !== false
  }});
  await audit({ action:'coupon_created', entity:'coupon', entityId: coupon.id, userId: user?.id, meta:{ code: coupon.code } });
  return coupon;
}

export function evaluateCoupon(coupon, { subtotal, userUses }) {
  if (!coupon.active) return { ok:false, error:'COUPON_INACTIVE' };
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) return { ok:false, error:'COUPON_NOT_STARTED' };
  if (coupon.endsAt && now > coupon.endsAt) return { ok:false, error:'COUPON_EXPIRED' };
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { ok:false, error:'COUPON_MAXED' };
  if (coupon.userLimit && userUses >= coupon.userLimit) return { ok:false, error:'COUPON_USER_LIMIT' };
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return { ok:false, error:'COUPON_MIN_SUBTOTAL' };
  let discount = 0;
  if (coupon.type === 'percent') discount = subtotal * (coupon.value / 100);
  else discount = coupon.value;
  discount = Math.max(0, Math.min(discount, subtotal));
  return { ok:true, discount, code: coupon.code };
}

export async function validateCoupon({ code, userId, subtotal }) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon) return { ok:false, error:'COUPON_NOT_FOUND' };
  let userUses = 0;
  if (userId) {
    userUses = await prisma.order.count({ where: { userId, couponCode: coupon.code } });
  }
  const result = evaluateCoupon(coupon, { subtotal, userUses });
  if (result.ok) {
    try {
      await audit({ action:'coupon_validated', entity:'coupon', entityId: coupon.id, userId, meta:{ code: coupon.code, discount: result.discount, subtotal } });
    } catch {}
  }
  return result;
}

export async function incrementCouponUsage(code) {
  await prisma.coupon.update({ where: { code }, data: { usedCount: { increment: 1 } } });
}

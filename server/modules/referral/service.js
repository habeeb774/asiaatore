import prisma from '../../db/client.js';
import { audit } from '../../utils/audit.js';

function genCode() {
  return Math.random().toString(36).slice(2,8).toUpperCase();
}

export async function getOrCreateReferralCode(userId) {
  let existing = await prisma.referral.findFirst({ where: { referrerUserId: userId } });
  if (existing) return existing;
  const code = genCode();
  const ref = await prisma.referral.create({ data: { referrerUserId: userId, code } });
  await audit({ action:'referral_code_created', entity:'referral', entityId: ref.id, userId, meta:{ code } });
  return ref;
}

export async function claimReferral({ code, userId }) {
  const ref = await prisma.referral.findUnique({ where: { code: code.toUpperCase() } });
  if (!ref) return { ok:false, error:'REFERRAL_NOT_FOUND' };
  if (ref.referredUserId) return { ok:false, error:'REFERRAL_ALREADY_USED' };
  if (ref.referrerUserId === userId) return { ok:false, error:'CANNOT_SELF_REFER' };
  const updated = await prisma.referral.update({ where: { id: ref.id }, data: { referredUserId: userId } });
  await audit({ action:'referral_claimed', entity:'referral', entityId: ref.id, userId, meta:{ referrer: ref.referrerUserId } });
  return { ok:true, referral: updated };
}

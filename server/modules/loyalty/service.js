import prisma from '../../db/client.js';
import { audit } from '../../utils/audit.js';

export async function getBalance(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } });
  return u?.loyaltyPoints || 0;
}

export async function getLedger(userId, { page=1, limit=50 } = {}) {
  const skip = (page-1)*limit; const where = { userId };
  const [entries, total] = await Promise.all([
    prisma.loyaltyLedger.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.loyaltyLedger.count({ where })
  ]);
  return { entries, page, pages: Math.ceil(total/limit), total };
}

export async function addPoints(userId, delta, { source='order', orderId=null, meta } = {}) {
  if (!Number.isInteger(delta)) throw new Error('DELTA_NOT_INT');
  const current = await getBalance(userId);
  const next = current + delta;
  const [updatedUser, ledger] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { loyaltyPoints: next } }),
    prisma.loyaltyLedger.create({ data: { userId, delta, balanceAfter: next, source, orderId, meta: meta || null } })
  ]);
  await audit({ action:'loyalty_points_changed', entity:'user', entityId: userId, userId, meta:{ delta, balanceAfter: next, source } });
  return { balance: next, ledgerEntry: ledger };
}

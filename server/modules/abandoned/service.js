import prisma from '../../db/client.js';
import { audit } from '../../utils/audit.js';

function buildSnapshot(items) {
  const safeItems = (Array.isArray(items) ? items : []).map(i => ({
    productId: i.productId || i.id || 'unknown',
    quantity: Number(i.quantity) || 1,
    price: Number(i.price) || 0
  }));
  const subtotal = safeItems.reduce((s,i)=> s + (i.price * i.quantity), 0);
  return { items: safeItems, subtotal };
}

export async function upsertCart({ userId, sessionId, items }) {
  if (!userId && !sessionId) throw new Error('MISSING_ID');
  const snap = buildSnapshot(items);
  const where = userId ? { userId } : { sessionId };
  const existing = await prisma.abandonedCart.findFirst({ where: { ...where, recoveredAt: null } });
  let row;
  if (existing) {
    row = await prisma.abandonedCart.update({ where: { id: existing.id }, data: { snapshot: snap, lastSeenAt: new Date() } });
  } else {
    row = await prisma.abandonedCart.create({ data: { userId: userId || null, sessionId: sessionId || null, snapshot: snap, lastSeenAt: new Date() } });
  }
  try { await audit({ action:'abandoned_cart_upsert', entity:'AbandonedCart', entityId: row.id, userId: userId || null, meta:{ count: snap.items.length, subtotal: snap.subtotal } }); } catch {}
  return row;
}

export async function listAbandoned({ olderThanMinutes=30 } = {}) {
  const cutoff = new Date(Date.now() - olderThanMinutes*60*1000);
  return prisma.abandonedCart.findMany({ where: { recoveredAt: null, lastSeenAt: { lte: cutoff } }, orderBy: { lastSeenAt: 'desc' } });
}

export async function markNotified(id) {
  const row = await prisma.abandonedCart.update({ where: { id }, data: { notifiedAt: new Date() } });
  try { await audit({ action:'abandoned_cart_notified', entity:'AbandonedCart', entityId: id, userId: row.userId, meta:{} }); } catch {}
  return row;
}

export async function markRecoveredByOrder({ userId, orderId }) {
  if (!userId) return null;
  const cart = await prisma.abandonedCart.findFirst({ where: { userId, recoveredAt: null } });
  if (!cart) return null;
  const updated = await prisma.abandonedCart.update({ where: { id: cart.id }, data: { recoveredAt: new Date() } });
  try { await audit({ action:'abandoned_cart_recovered', entity:'AbandonedCart', entityId: cart.id, userId, meta:{ orderId } }); } catch {}
  return updated;
}

export default { upsertCart, listAbandoned, markNotified, markRecoveredByOrder };
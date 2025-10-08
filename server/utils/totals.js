// Utilities for computing financial totals of an order
import prisma from '../db/client.js';

export function computeTotals(rawItems, overrides = {}) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const discountAuto = items.reduce((s, i) => {
    const price = Number(i.price) || 0;
    const oldPrice = i.oldPrice != null ? Number(i.oldPrice) : null;
    if (oldPrice && oldPrice > price) {
      return s + (oldPrice - price) * (Number(i.quantity) || 1);
    }
    return s;
  }, 0);
  const discount = overrides.discount != null ? Number(overrides.discount) : discountAuto;
  const taxableBase = subtotal - discount;
  const tax = overrides.tax != null ? Number(overrides.tax) : +(taxableBase * 0.15).toFixed(2);
  const shipping = overrides.shipping != null ? Math.max(0, Number(overrides.shipping)) : 0;
  const grandTotal = +(subtotal - discount + tax + shipping).toFixed(2);
  return { subtotal, discount, tax, shipping, grandTotal };
}

export async function computeOrderTotals(order, sellerId) {
  const items = order.items || [];
  const total = items.reduce((sum, item) => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    return sum + itemTotal;
  }, 0);

  let commissionAmount = 0;
  if (sellerId) {
    const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
    if (seller) {
      commissionAmount = total * seller.commissionRate;
    }
  }

  return {
    ...computeTotals(items),
    commissionAmount,
    total,
  };
}

export default { computeTotals };

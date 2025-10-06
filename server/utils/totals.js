// Utilities for computing financial totals of an order

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

export default { computeTotals };

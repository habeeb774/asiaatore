// Simple in-memory orders store (replace with real DB in production)
// Shape: { id, userId, items, subtotal, discount, tax, grandTotal, total (alias), currency, status, payment, createdAt, updatedAt, meta }

const orders = new Map();

export function generateId(prefix = 'ord') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
}

function computeTotals(items, partial) {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((s,i)=> s + (i.price||0) * (i.quantity||1), 0);
  const discountAuto = safeItems.reduce((s,i)=> {
    if (i.oldPrice && i.oldPrice > i.price) return s + (i.oldPrice - i.price) * (i.quantity||1);
    return s;
  }, 0);
  const discount = partial.discount != null ? Number(partial.discount) : discountAuto;
  const taxableBase = subtotal - discount;
  const tax = partial.tax != null ? Number(partial.tax) : +(taxableBase * 0.15).toFixed(2);
  const grandTotal = +(subtotal - discount + tax).toFixed(2);
  return { subtotal, discount, tax, grandTotal, total: grandTotal };
}

export function createOrder(partial) {
  const id = partial.id || generateId();
  const items = Array.isArray(partial.items) ? partial.items : [];
  const totals = computeTotals(items, partial);
  const order = {
    id,
    userId: partial.userId || 'guest',
    items,
    ...totals,
    currency: partial.currency || 'SAR',
    status: partial.status || 'pending',
    payment: partial.payment || { method: partial.paymentMethod || 'unknown', status: 'initiated' },
    meta: partial.meta || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  orders.set(id, order);
  return order;
}

export function updateOrder(id, patch) {
  const existing = orders.get(id);
  if (!existing) return null;
  const items = patch.items ? patch.items : existing.items;
  const totals = computeTotals(items, patch.discount != null || patch.tax != null ? patch : existing);
  const updated = { ...existing, ...patch, items, ...totals, updatedAt: new Date().toISOString() };
  orders.set(id, updated);
  return updated;
}

export function getOrder(id) {
  return orders.get(id) || null;
}

export function listOrders() {
  return Array.from(orders.values()).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
}

export function ensureOrder(id, partial) {
  const existing = getOrder(id);
  return existing || createOrder({ id, ...partial });
}

export default { createOrder, updateOrder, getOrder, listOrders, ensureOrder };

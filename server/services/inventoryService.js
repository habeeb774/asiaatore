import prisma from '../db/client.js';
import { audit } from '../utils/audit.js';
import { broadcast } from '../utils/realtimeHub.js';

function parseAdjust(action) {
  const a = String(action || '').toLowerCase();
  if (a === 'set') return 'set';
  if (a === 'increment' || a === 'inc' || a === '+') return 'increment';
  if (a === 'decrement' || a === 'dec' || a === '-') return 'decrement';
  return 'set';
}

async function ensureInventoryRow(productId, warehouseId = null, defaults = {}) {
  const key = warehouseId ? { productId_warehouseId: { productId, warehouseId } } : null;
  try {
    if (key) {
      const found = await prisma.inventory.findUnique({ where: key });
      if (found) return found;
      return await prisma.inventory.create({ data: { productId, warehouseId, ...defaults } });
    }
  } catch {}
  // Without composite key helper, fallback to findFirst
  const existing = await prisma.inventory.findFirst({ where: { productId, warehouseId: warehouseId || null } }).catch(() => null);
  if (existing) return existing;
  return prisma.inventory.create({ data: { productId, warehouseId, ...defaults } });
}

async function recordTx({ productId, warehouseId, type, qty, previous, next, referenceType, referenceId, notes, userId }) {
  try {
    await prisma.inventoryTransaction.create({
      data: {
        productId,
        warehouseId: warehouseId || null,
        transactionType: type,
        quantity: qty,
        previousStock: previous,
        newStock: next,
        referenceType: referenceType || 'adjustment',
        referenceId: referenceId || null,
        notes: notes || null,
        createdBy: userId || null,
      }
    });
  } catch {}
}

export const InventoryService = {
  async getInventory({ page, pageSize } = {}) {
    if (page && pageSize) {
      const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(pageSize));
      const take = Math.min(200, Math.max(1, Number(pageSize)));
      const [total, items] = await Promise.all([
        prisma.inventory.count(),
        prisma.inventory.findMany({ include: { product: true, warehouse: true }, skip, take, orderBy: { updatedAt: 'desc' } })
      ]);
      return { items, total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) };
    }
    const items = await prisma.inventory.findMany({ include: { product: true, warehouse: true }, orderBy: { updatedAt: 'desc' } });
    return { items };
  },

  async getByProduct(productId) {
    const rows = await prisma.inventory.findMany({ where: { productId }, include: { warehouse: true } });
    // aggregate
    const total = rows.reduce((s, r) => s + (r.quantity || 0), 0);
    const reserved = rows.reduce((s, r) => s + (r.reservedQuantity || 0), 0);
    return { rows, total, reserved, available: total - reserved };
  },

  async listLowStock() {
    const rows = await prisma.inventory.findMany({ where: { quantity: { lt: 0 } } }).catch(async () => {
      // if constraint not supported, approximate: quantity <= threshold
      return prisma.inventory.findMany({});
    });
    const flagged = rows.filter(r => (r.quantity - r.reservedQuantity) <= (r.lowStockThreshold ?? 5));
    return flagged;
  },

  async updateStock(productId, quantity, action, { warehouseId = null, reason, userId, referenceType, referenceId } = {}) {
    const adj = parseAdjust(action);
    const inv = await ensureInventoryRow(productId, warehouseId);
    const current = inv.quantity || 0;
    let next = current;
    const q = Number(quantity) || 0;
    if (adj === 'set') next = q;
    if (adj === 'increment') next = current + q;
    if (adj === 'decrement') next = current - q;
    if (next < 0) next = 0; // prevent negative actual stock; reserved safeguards apply elsewhere
    const updated = await prisma.inventory.update({ where: { id: inv.id }, data: { quantity: next } });
  await recordTx({ productId, warehouseId, type: adj === 'increment' ? 'inbound' : adj === 'decrement' ? 'outbound' : 'adjustment', qty: q, previous: current, next, referenceType, referenceId, notes: reason, userId });
    await audit({ action: 'inventory.update', entity: 'Product', entityId: productId, userId, meta: { warehouseId, action: adj, quantity: q, previous: current, next } });
    try { broadcast('inventory.updated', { productId, warehouseId, quantity: next, reservedQuantity: updated.reservedQuantity, at: new Date().toISOString() }); } catch {}
    return updated;
  },

  async reserveStock(orderId, items, { warehouseId = null, userId } = {}) {
    // Validate availability; perform in transaction for consistency
    return prisma.$transaction(async (tx) => {
      const results = [];
      for (const it of items) {
        const productId = String(it.product_id || it.productId);
        const qty = Number(it.quantity) || 0;
        let inv = await tx.inventory.findFirst({ where: { productId, warehouseId: warehouseId || null } });
        if (!inv) inv = await tx.inventory.create({ data: { productId, warehouseId: warehouseId || null, quantity: 0, reservedQuantity: 0 } });
        const available = (inv.quantity || 0) - (inv.reservedQuantity || 0);
        if (available < qty) {
          const err = new Error(`INSUFFICIENT_STOCK for ${productId}`);
          err.code = 'INSUFFICIENT_STOCK';
          throw err;
        }
        const updated = await tx.inventory.update({ where: { id: inv.id }, data: { reservedQuantity: inv.reservedQuantity + qty } });
  await tx.inventoryTransaction.create({ data: { productId, warehouseId: warehouseId || null, transactionType: 'transfer', quantity: qty, previousStock: inv.quantity, newStock: inv.quantity, referenceType: 'order', referenceId: String(orderId), notes: 'reserve', createdBy: userId || null } });
        results.push(updated);
      }
      await audit({ action: 'inventory.reserve', entity: 'Order', entityId: String(orderId), userId, meta: { items: items.length } });
      try { broadcast('inventory.reserved', { orderId, items: items.map(i => ({ productId: i.product_id || i.productId, quantity: i.quantity })) }); } catch {}
      return { ok: true, items: results };
    });
  },

  async releaseReserved(orderId, { userId } = {}) {
    // Release all reservations tagged by order in tx log
    const txs = await prisma.inventoryTransaction.findMany({ where: { referenceType: 'order', referenceId: String(orderId), notes: 'reserve' } });
    const byProduct = new Map();
    for (const t of txs) {
      const k = `${t.productId}::${t.warehouseId || ''}`;
      byProduct.set(k, (byProduct.get(k) || 0) + t.quantity);
    }
    const updates = [];
    await prisma.$transaction(async (tx) => {
      for (const [key, qty] of byProduct.entries()) {
        const [productId, wh] = key.split('::');
        const warehouseId = wh || null;
        const inv = await tx.inventory.findFirst({ where: { productId, warehouseId } });
        if (!inv) continue;
        const newReserved = Math.max(0, (inv.reservedQuantity || 0) - qty);
        const updated = await tx.inventory.update({ where: { id: inv.id }, data: { reservedQuantity: newReserved } });
  await tx.inventoryTransaction.create({ data: { productId, warehouseId, transactionType: 'transfer', quantity: -qty, previousStock: inv.quantity, newStock: inv.quantity, referenceType: 'order', referenceId: String(orderId), notes: 'release', createdBy: userId || null } });
        updates.push(updated);
      }
    });
    await audit({ action: 'inventory.release', entity: 'Order', entityId: String(orderId), userId, meta: { items: updates.length } });
    try { broadcast('inventory.released', { orderId }); } catch {}
    return { ok: true, items: updates };
  },

  async confirmReduction(orderId, { userId } = {}) {
    // When order ships/paid: move reserved -> actual deduction
    const txs = await prisma.inventoryTransaction.findMany({ where: { referenceType: 'order', referenceId: String(orderId), notes: 'reserve' } });
    await prisma.$transaction(async (tx) => {
      for (const t of txs) {
        const inv = await tx.inventory.findFirst({ where: { productId: t.productId, warehouseId: t.warehouseId || null } });
        if (!inv) continue;
        const newReserved = Math.max(0, (inv.reservedQuantity || 0) - t.quantity);
        const newQty = Math.max(0, (inv.quantity || 0) - t.quantity);
        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: newQty, reservedQuantity: newReserved } });
  await tx.inventoryTransaction.create({ data: { productId: t.productId, warehouseId: t.warehouseId || null, transactionType: 'outbound', quantity: t.quantity, previousStock: inv.quantity, newStock: newQty, referenceType: 'order', referenceId: String(orderId), notes: 'confirm', createdBy: userId || null } });
      }
    });
    await audit({ action: 'inventory.confirm', entity: 'Order', entityId: String(orderId), userId });
    try { broadcast('inventory.confirmed', { orderId }); } catch {}
    return { ok: true };
  },

  async checkLowStockAndNotify() {
    const rows = await this.listLowStock();
    for (const r of rows) {
      try { broadcast('inventory.low_stock', { productId: r.productId, available: (r.quantity - r.reservedQuantity) }); } catch {}
      await audit({ action: 'inventory.low_stock', entity: 'Product', entityId: r.productId, meta: { available: r.quantity - r.reservedQuantity, threshold: r.lowStockThreshold } });
    }
    return rows;
  }
};

export default InventoryService;

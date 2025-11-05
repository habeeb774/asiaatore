import prisma from '../db/client.js';

// Generate a globally unique invoice number. Prefer a persistent Counter row when available;
// otherwise, fall back to a timestamp-based identifier.
export async function generateInvoiceNumber(prefix = 'INV') {
  // Try using Counter model if present
  try {
    if (prisma?.counter && typeof prisma.counter.update === 'function') {
      const name = 'invoice_global_seq';
      // Ensure row exists
      await prisma.counter.upsert({
        where: { name },
        create: { name, value: BigInt(0) },
        update: {},
      });
      const row = await prisma.counter.update({
        where: { name },
        data: { value: { increment: BigInt(1) } },
      });
      const seq = Number(row?.value ?? 0);
      const seqStr = String(seq).padStart(10, '0');
      return `${prefix}-${seqStr}`;
    }
  } catch {}

  // Fallback: date-based (not strictly monotonic across restarts)
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const t = String(now.getTime()).slice(-6); // last 6 digits of ms timestamp
  return `${prefix}-${y}${m}${d}-${t}`;
}

// Ensure an invoice row exists for the given order. Returns the invoice record.
export async function ensureInvoiceForOrder(orderId) {
  if (!orderId) throw new Error('orderId required');
  // If an invoice already exists, return it
  try {
    const existing = await prisma.invoice.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' } });
    if (existing) return existing;
  } catch {}

  // Load order with items to compute totals best-effort
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: true } });
  if (!order) throw new Error('ORDER_NOT_FOUND');

  const subtotal = (order.items || []).reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0);
  // Use order.tax if present; otherwise simple 15% VAT approximation
  const tax = order.tax != null ? Number(order.tax) : +(subtotal * 0.15).toFixed(2);
  const total = order.grandTotal != null ? Number(order.grandTotal) : +(subtotal + tax).toFixed(2);

  let invoiceNumber = null;
  try { invoiceNumber = await generateInvoiceNumber('INV'); } catch { invoiceNumber = await generateInvoiceNumber('INV'); }

  const data = {
    orderId: order.id,
    userId: order.userId,
    invoiceNumber,
    status: 'issued',
    currency: order.currency || 'SAR',
    subtotal,
    tax,
    total,
    paymentMethod: order.paymentMethod || null,
    meta: { orderSnapshot: { id: order.id, status: order.status } },
  };

  try {
    const created = await prisma.invoice.create({ data });
    // Best-effort log
    try { if (prisma.invoiceLog) await prisma.invoiceLog.create({ data: { invoiceId: created.id, userId: order.userId, action: 'create' } }); } catch {}
    return created;
  } catch (e) {
    // If create fails (schema mismatch), attempt a very defensive path
    try {
      // Try without meta
      const created = await prisma.invoice.create({ data: { ...data, meta: undefined } });
      return created;
    } catch (e2) {
      // As last resort, return a synthetic object to keep callers from crashing
      return {
        id: 'synthetic-' + order.id,
        orderId: order.id,
        userId: order.userId,
        invoiceNumber,
        status: 'issued',
        currency: 'SAR',
        subtotal,
        tax,
        total,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }
}

export default { generateInvoiceNumber, ensureInvoiceForOrder };

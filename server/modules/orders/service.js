import prisma from '../../db/client.js';
import { computeTotals } from '../../utils/totals.js';

export function mapOrder(o) {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status,
    currency: o.currency,
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    grandTotal: o.grandTotal,
    total: o.grandTotal,
    paymentMethod: o.paymentMethod,
    paymentMeta: o.paymentMeta,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: (o.items || []).map(i => ({
      id: i.id,
      productId: i.productId,
      name: { ar: i.nameAr, en: i.nameEn },
      price: i.price,
      oldPrice: i.oldPrice,
      quantity: i.quantity,
    })),
  };
}

async function ensureCustomProduct() {
  try {
    await prisma.product.upsert({
      where: { id: 'custom' },
      update: {},
      create: {
        id: 'custom', slug: 'custom-placeholder', nameAr: 'عنصر مخصص', nameEn: 'Custom Item', category: 'misc', price: 0, stock: 0,
      },
    });
  } catch (e) {
    try {
      await prisma.product.create({
        data: { id: 'custom', slug: 'custom-placeholder-2', nameAr: 'عنصر مخصص', nameEn: 'Custom Item', category: 'misc', price: 0, stock: 0 },
      });
    } catch {}
  }
}

function isLocalProductId(pid) {
  return typeof pid === 'string' && (pid === 'custom' || pid.startsWith('p_'));
}

async function normalizeItems(raw) {
  const out = [];
  for (const it of (Array.isArray(raw) ? raw : [])) {
    const pid = it.productId;
    const looksLocal = isLocalProductId(pid);
    if (pid && !looksLocal) {
      const product = await prisma.product.findUnique({ where: { id: pid } });
      if (product) {
        out.push({
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          price: product.price,
          oldPrice: product.oldPrice,
          quantity: Number(it.quantity) || 1,
        });
        continue;
      }
    }
    out.push({
      productId: looksLocal ? 'custom' : (pid || 'custom'),
      nameAr: it.name?.ar || 'صنف',
      nameEn: it.name?.en || 'Item',
      price: Number(it.price) || 0,
      oldPrice: it.oldPrice != null ? Number(it.oldPrice) : null,
      quantity: Number(it.quantity) || 1,
    });
  }
  if (out.some(i => i.productId === 'custom')) await ensureCustomProduct();
  return out;
}

export const OrdersService = {
  async list(params = {}) {
    const { where = {}, orderBy = { createdAt: 'desc' }, page, pageSize } = params;
    const pg = page ? Math.max(1, parseInt(page, 10)) : null;
    const ps = pageSize ? Math.min(500, Math.max(1, parseInt(pageSize, 10))) : 50;
    if (pg) {
      const skip = (pg - 1) * ps;
      const [total, list] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, orderBy, skip, take: ps, include: { items: true } }),
      ]);
      return { items: list, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) };
    }
    const list = await prisma.order.findMany({ where, orderBy, include: { items: true } });
    return { items: list };
  },

  async getById(id) {
    return prisma.order.findUnique({ where: { id }, include: { items: true } });
  },

  async create(input) {
    const userId = input.userId || 'guest';
    const currency = input.currency || 'SAR';
    const items = await normalizeItems(input.items || []);
    const shippingOverride = typeof input.paymentMeta?.shipping === 'number' ? input.paymentMeta.shipping : undefined;
    const totals = computeTotals(items, { shipping: shippingOverride });
    const created = await prisma.order.create({
      data: {
        userId,
        status: input.status || 'pending',
        currency,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
        paymentMethod: input.paymentMethod || null,
        paymentMeta: input.paymentMeta || null,
        items: {
          create: items.map(i => ({
            productId: i.productId,
            nameAr: i.nameAr,
            nameEn: i.nameEn,
            price: i.price,
            oldPrice: i.oldPrice,
            quantity: i.quantity,
          })),
        },
      },
      include: { items: true },
    });
    return created;
  },

  async update(id, body, opts = {}) {
    const isAdmin = !!opts.isAdmin;
    const requesterId = opts.userId || 'guest';
    const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existing) {
      const err = new Error('NOT_FOUND');
      err.statusCode = 404; throw err;
    }
    if (!isAdmin && existing.userId !== requesterId) {
      const err = new Error('FORBIDDEN');
      err.statusCode = 403; throw err;
    }

    let itemsData = existing.items.map(i => ({
      productId: i.productId,
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      price: i.price,
      oldPrice: i.oldPrice,
      quantity: i.quantity,
    }));

    if (Array.isArray(body.items)) {
      const canUserModify = !isAdmin && existing.status === 'pending' && existing.userId === requesterId;
      if (!isAdmin && !canUserModify) {
        const err = new Error('FORBIDDEN_ITEMS_MOD');
        err.statusCode = 403; throw err;
      }
      itemsData = await normalizeItems(body.items);
    }

    const shippingOverride = typeof body.paymentMeta?.shipping === 'number' ? body.paymentMeta.shipping : undefined;
    const totals = computeTotals(itemsData, { ...body, shipping: shippingOverride });

    const updateData = {
      status: body.status || existing.status,
      paymentMethod: body.paymentMethod != null ? body.paymentMethod : existing.paymentMethod,
      paymentMeta: body.paymentMeta != null ? (body.paymentMeta || null) : existing.paymentMeta,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      grandTotal: totals.grandTotal,
    };

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(body.items) && isAdmin) {
        await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
        for (const it of itemsData) {
          await tx.orderItem.create({ data: { ...it, orderId: existing.id } });
        }
      }
      return tx.order.update({ where: { id: existing.id }, data: updateData, include: { items: true } });
    });
    return updated;
  },
};

export default OrdersService;

import prisma from '../../db/client.js';
import bcrypt from 'bcryptjs';
import { computeTotals } from '../../utils/totals.js';
import { whereWithDeletedAt } from '../../utils/deletedAt.js';
import aramex from '../../services/shipping/adapters/aramex.js';
import smsa from '../../services/shipping/adapters/smsa.js';
import { emitOrderEvent } from '../../utils/realtimeHub.js';
import InventoryService from '../../services/inventoryService.js';
import { ensureInvoiceForOrder } from '../../utils/invoice.js';
import { sendInvoiceWhatsApp } from '../../services/whatsapp.js';

function providerTrackingUrl(provider, trackingNumber) {
  try {
    const p = String(provider || '').toLowerCase();
    const t = encodeURIComponent(String(trackingNumber || ''));
    if (!t) return null;
    if (p === 'smsa') return `https://track.smsaexpress.com/Shipment/Tracking?tracknumbers=${t}`;
    if (p === 'aramex') return `https://www.aramex.com/track/shipments?ShipmentNumber=${t}`;
    return null;
  } catch {
    return null;
  }
}

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
    shipments: (o.shipments || []).map(s => ({
      id: s.id,
      provider: s.provider,
      trackingNumber: s.trackingNumber,
      status: s.status,
      trackingUrl: providerTrackingUrl(s.provider, s.trackingNumber),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    trackingUrl: (o.shipments && o.shipments.length) ? providerTrackingUrl(o.shipments[0].provider, o.shipments[0].trackingNumber) : null,
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

// Helper: extract a numeric shipping override from input.paymentMeta or top-level input.shipping
function extractShippingOverride(input) {
  const metaShip = input?.paymentMeta?.shipping;
  if (typeof metaShip === 'number' && !Number.isNaN(metaShip)) return metaShip;
  const top = input?.shipping;
  if (top && typeof top === 'object') {
    const candidates = [top.amount, top.price, top.cost, top.value];
    for (const c of candidates) {
      if (typeof c === 'number' && !Number.isNaN(c)) return c;
      const n = c != null ? Number(c) : NaN;
      if (!Number.isNaN(n)) return n;
    }
  }
  return undefined;
}

export const OrdersService = {
  async list(params = {}) {
    try {
      const { where = {}, orderBy = { createdAt: 'desc' }, page, pageSize } = params;
      // Use helper to include deletedAt only when supported by DB schema.
      const whereNdCandidate = whereWithDeletedAt(where);
      const whereRaw = where; // fallback without deletedAt
    const pg = page ? Math.max(1, parseInt(page, 10)) : null;
    const ps = pageSize ? Math.min(500, Math.max(1, parseInt(pageSize, 10))) : 50;
    if (pg) {
      const skip = (pg - 1) * ps;
      // Try the query; if Prisma complains about unknown arg (deletedAt) retry without it.
      try {
        const [total, list] = await Promise.all([
          prisma.order.count({ where: whereNdCandidate }),
          prisma.order.findMany({ where: whereNdCandidate, orderBy, skip, take: ps, include: { items: true, shipments: true } }),
        ]);
        return { items: list, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) };
      } catch (e) {
        // Special-case: unknown arg `deletedAt` on Order model — retry without it
        const msg = e?.message || '';
        const isUnknownDeletedAt = /Unknown arg `deletedAt`|Unknown field `deletedAt`|Argument deletedAt/i.test(msg);
        if (isUnknownDeletedAt) {
          try {
            const [total, list] = await Promise.all([
              prisma.order.count({ where: whereRaw }),
              prisma.order.findMany({ where: whereRaw, orderBy, skip, take: ps, include: { items: true, shipments: true } }),
            ]);
            return { items: list, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) };
          } catch (e2) {
            if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] list retry (no deletedAt) failed', e2);
            if (process.env.ALLOW_INVALID_DB === 'true') return { items: [], degraded: true };
            throw e2;
          }
        }
        // If it fails for any other reason and we're in degraded mode, return empty list.
        if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] list failed (pg)', e);
        if (process.env.ALLOW_INVALID_DB === 'true') return { items: [], degraded: true };
        throw e;
      }
    }
    try {
      const list = await prisma.order.findMany({ where: whereNdCandidate, orderBy, include: { items: true, shipments: true } });
      return { items: list };
    } catch (e) {
      // Retry without deletedAt if unknown arg error
      const msg = e?.message || '';
      const isUnknownDeletedAt = /Unknown arg `deletedAt`|Unknown field `deletedAt`|Argument deletedAt/i.test(msg);
      if (isUnknownDeletedAt) {
        try {
          const list = await prisma.order.findMany({ where: whereRaw, orderBy, include: { items: true, shipments: true } });
          return { items: list };
        } catch (e2) {
          if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] list retry (no deletedAt) failed', e2);
          if (process.env.ALLOW_INVALID_DB === 'true') return { items: [], degraded: true };
          throw e2;
        }
      }
      if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] list failed', e);
      if (process.env.ALLOW_INVALID_DB === 'true') return { items: [], degraded: true };
      throw e;
    }
    } catch (outerErr) {
      if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] list outer failure', outerErr);
      if (process.env.ALLOW_INVALID_DB === 'true') return { items: [], degraded: true };
      throw outerErr;
    }
  },

  async getById(id) {
    // Some schemas don't have deletedAt; try with it first and fall back if unknown arg
        try {
          return await prisma.order.findFirst({ where: whereWithDeletedAt({ id }), include: { items: true, shipments: true } });
        } catch (e) {
          const msg = e?.message || '';
          const isUnknownDeletedAt = /Unknown arg `deletedAt`|Unknown field `deletedAt`|Argument deletedAt/i.test(msg);
          if (isUnknownDeletedAt) {
            try {
              return await prisma.order.findFirst({ where: { id }, include: { items: true, shipments: true } });
            } catch (e2) {
              if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] getById retry (no deletedAt) failed', e2);
              throw e2;
            }
          }
          if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS] getById failed', e);
          throw e;
        }
  },
  async create(input) {
    const userId = input.userId || 'guest';
    // Dev-only safety: ensure the referenced user exists to satisfy FK constraints
    // This helps local runs where auth may use dev tokens (e.g., 'dev-user') or 'guest'
    try {
      const isDevLike = process.env.NODE_ENV !== 'production' || process.env.ALLOW_INVALID_DB === 'true' || process.env.DEBUG_LOGIN === '1';
      if (isDevLike && userId) {
        await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: `${userId}@dev.local`,
            // Store a valid bcrypt hash to avoid runtime issues if ever used in login comparisons
            password: await bcrypt.hash('dev-placeholder', 10),
            role: 'user',
            name: userId === 'guest' ? 'Guest' : 'Dev Placeholder',
          },
        });
      }
    } catch (e) {
      // Non-fatal in dev; continue and let downstream surface errors if any
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[ORDERS] ensure user fallback failed:', e.message);
    }
    const currency = input.currency || 'SAR';
    const items = await normalizeItems(input.items || []);
    const shippingOverride = extractShippingOverride(input);
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
    // Best-effort: reserve inventory for items (skip 'custom')
    try {
      const toReserve = (items || [])
        .filter(i => i.productId && i.productId !== 'custom')
        .map(i => ({ product_id: i.productId, quantity: i.quantity }));
      if (toReserve.length) {
        await InventoryService.reserveStock(created.id, toReserve, { userId });
      }
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[ORDERS] reserveStock failed (non-fatal):', e?.message);
    }
    // Auto-create shipment if enabled. Do not block order creation on shipment errors.
    try {
      if (String(process.env.AUTO_CREATE_SHIPMENT || '').toLowerCase() === 'true') {
        // Determine provider preference
        const preferred = (input?.paymentMeta?.shippingProvider) || (input?.shipping?.provider) || process.env.DEFAULT_SHIPPING_PROVIDER || 'aramex';
        const provider = String(preferred || '').toLowerCase();
        const adapters = { aramex, smsa };
        const adapter = adapters[provider];
        if (adapter) {
          // fire-and-forget
          (async () => {
            try {
              const r = await adapter.createShipment(created);
              // ensure DB save if adapter didn't
              try {
                if (r && r.trackingId && prisma?.shipment) {
                  const exists = await prisma.shipment.findUnique({ where: { trackingNumber: r.trackingId } }).catch(() => null);
                  if (!exists) {
                    await prisma.shipment.create({ data: { orderId: created.id, provider, trackingNumber: r.trackingId, status: r.status || 'created', meta: r.raw ? (typeof r.raw === 'object' ? r.raw : String(r.raw)) : undefined } }).catch(() => null);
                  }
                }
              } catch (e) {
                // ignore persistence
              }
              try { emitOrderEvent('order.shipped', { id: created.id, provider, trackingId: r.trackingId || null, status: r.status || null }); } catch (e) {}
            } catch (e) {
              // swallow
              if (process.env.DEBUG_ERRORS === 'true') console.error('[AUTO_SHIP] adapter failed', e);
            }
          })();
        }
      }
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.error('[AUTO_SHIP] unexpected error', e);
    }

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

  const shippingOverride = extractShippingOverride(body);
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
    // Side-effects: inventory reservation lifecycle on status transitions
    try {
      if (existing.status !== updated.status) {
        const s = String(updated.status || '').toLowerCase();
        if (s === 'cancelled' || s === 'canceled') {
          await InventoryService.releaseReserved(updated.id, { userId: requesterId });
        } else if (s === 'shipped' || s === 'completed' || s === 'paid') {
          await InventoryService.confirmReduction(updated.id, { userId: requesterId });
        }
        // Auto-generate invoice and notify when transitioning to paid
        if (s === 'paid') {
          try { await ensureInvoiceForOrder(updated.id); } catch {}
          try { await sendInvoiceWhatsApp(updated.id).catch(() => null); } catch {}
        }
      }
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[ORDERS] inventory side-effect failed:', e?.message);
    }
    return updated;
  },
};

export default OrdersService;

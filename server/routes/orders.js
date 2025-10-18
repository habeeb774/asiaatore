import { Router } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import prisma from '../db/client.js';
import { OrdersService, mapOrder as mapOrderDto } from '../modules/orders/service.js';
import aramex from '../services/shipping/adapters/aramex.js';
import smsa from '../services/shipping/adapters/smsa.js';
import { audit } from '../utils/audit.js';
import { generateInvoiceQrPng } from '../utils/qr.js';
import { emitOrderEvent } from '../utils/realtimeHub.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const mapOrder = mapOrderDto;

// List orders (admin: all / user: own) with optional pagination
// List orders with advanced filters (admin only for cross-user queries)
// Query params: userId, status, paymentMethod, from, to, page, pageSize
const listSchema = z.object({
  userId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  paymentMethod: z.string().trim().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(200).optional()
});
router.get('/', async (req, res) => {
  try {
    const parsed = listSchema.safeParse(req.query || {});
    if (!parsed.success) {
      return res.status(400).json({ ok:false, error:'INVALID_QUERY', fields: parsed.error.flatten() });
    }
    const { userId, page, pageSize, status, paymentMethod, from, to } = parsed.data;
    const isAdmin = req.user?.role === 'admin';
    const where = {};
    if (!isAdmin) {
      where.userId = req.user?.id || 'guest';
    } else if (userId) {
      where.userId = String(userId);
    }
    if (status) where.status = String(status);
    if (paymentMethod) where.paymentMethod = String(paymentMethod);
    if (from || to) {
      const range = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) range.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) {
          if (to.match(/^\d{4}-\d{2}-\d{2}$/)) d.setHours(23,59,59,999);
          range.lte = d;
        }
      }
      if (Object.keys(range).length) where.createdAt = range;
    }
    let result;
    try {
      result = await OrdersService.list({ where, page, pageSize, orderBy: { createdAt: 'desc' } });
    } catch (e) {
      if (process.env.ALLOW_INVALID_DB === 'true') {
        if (process.env.DEBUG_ERRORS === 'true') console.error('[ORDERS_ROUTE] list failed, returning degraded empty list', e);
        return res.json({ ok: true, orders: [], degraded: true, note: 'DB query failed; returning empty orders list in dev.' });
      }
      throw e;
    }
    if ('total' in result) {
      return res.json({ ok: true, orders: result.items.map(mapOrder), page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages });
    }
    return res.json({ ok: true, orders: result.items.map(mapOrder) });
  } catch (e) {
    // If server allowed degraded startup and Prisma query failed (e.g., tables missing),
    // return an empty list instead of hard-failing to keep UI usable in dev.
    if (process.env.ALLOW_INVALID_DB === 'true') {
      return res.json({ ok: true, orders: [], degraded: true, note: 'DB query failed; returning empty orders list in dev.' });
    }
    res.status(500).json({ ok: false, error: 'FAILED_LIST', message: e.message });
  }
});

// Create order
// Accept extra fields in items (name, oldPrice, etc.) to be permissive for frontend payloads
const orderItemSchema = z.object({
  productId: z.union([z.string(), z.literal('custom')]),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().nonnegative().optional()
}).catchall(z.unknown());
const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1),
    paymentMethod: z.string().trim().optional(),
    // Zod v4: use unknown() instead of any()
    paymentMeta: z.record(z.unknown()).optional(),
    shippingAddress: z.record(z.unknown()).optional(),
    // Accept top-level shipping meta for compatibility with tests/clients
    shipping: z.record(z.unknown()).optional(),
    note: z.string().trim().max(500).optional(),
    userId: z.string().optional()
  })
  // Allow extra keys without failing validation to avoid internal _zod catchall issues
  .catchall(z.unknown());
router.post('/', async (req, res) => {
  try {
    let body;
    try {
      const parsed = createOrderSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ ok:false, error:'INVALID_INPUT', fields: parsed.error.flatten() });
      }
      body = parsed.data;
    } catch (zerr) {
      // Zod v4 internal error guard: fall back to permissive parsing
      if (process.env.DEBUG_ERRORS === 'true' || process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[ORDERS] Zod parsing failed; using permissive fallback:', zerr?.message);
        if (process.env.DEBUG_ERRORS === 'true') {
          try { console.debug('[ORDERS] Incoming body (raw):', JSON.stringify(req.body)); } catch (e) { console.debug('[ORDERS] Incoming body (raw) - cannot stringify', req.body); }
        }
      }
      // Additional debug: include request headers and content-length to help
      // identify scenarios where body parsing might be failing (e.g., wrong
      // content-type or a proxy trimming the body).
      if (process.env.DEBUG_ERRORS === 'true') {
        try {
          console.debug('[ORDERS] request headers:', { 'content-type': req.headers['content-type'], 'content-length': req.headers['content-length'] });
        } catch {}
      }
      let raw = req.body || {};
      // If body arrived as a raw JSON string for any reason, try to parse it so we can read items
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) {
          if (process.env.DEBUG_ERRORS === 'true') console.debug('[ORDERS] Raw body is string but failed JSON.parse', e.message, 'content-type=', req.headers['content-type']);
        }
      }
      const items = Array.isArray(raw.items) ? raw.items : [];
      if (!items.length) {
        const debugInfo = {
          contentType: req.headers['content-type'] || null,
          bodyType: typeof req.body,
          bodyKeys: req.body && typeof req.body === 'object' ? Object.keys(req.body) : null,
        };
        const payload = { ok: false, error: 'INVALID_INPUT', message: 'items required' };
        if (process.env.DEBUG_ERRORS === 'true') payload.debug = debugInfo;
        return res.status(400).json(payload);
      }
      body = {
        items,
        paymentMethod: typeof raw.paymentMethod === 'string' ? raw.paymentMethod : undefined,
        paymentMeta: raw.paymentMeta && typeof raw.paymentMeta === 'object' ? raw.paymentMeta : undefined,
        shippingAddress: raw.shippingAddress && typeof raw.shippingAddress === 'object' ? raw.shippingAddress : undefined,
        shipping: raw.shipping && typeof raw.shipping === 'object' ? raw.shipping : undefined,
        note: typeof raw.note === 'string' ? raw.note : undefined,
        userId: typeof raw.userId === 'string' ? raw.userId : undefined,
      };
    }
    const created = await OrdersService.create({ ...body, userId: req.user?.id || body.userId || 'guest' });
    audit({ action: 'order.create', entity: 'Order', entityId: created.id, userId: created.userId, meta: { items: created.items.length, total: created.grandTotal } });
    emitOrderEvent('order.created', created);
    res.status(201).json({ ok: true, order: mapOrder(created) });
  } catch (e) {
    const payload = { ok: false, error: 'FAILED_CREATE', message: e.message };
    if (e?.code && /^P20\d{2}$/.test(e.code)) payload.prisma = e.code;
    if (/foreign key/i.test(e.message)) payload.hint = 'تحقق من productId لكل عنصر؛ العناصر خارج الكتالوج يجب أن تُرسل بـ productId="custom"';
    res.status(400).json(payload);
  }
});

// Get order (ensure ownership if not admin)
router.get('/:id', async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  try {
    const order = await OrdersService.getById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (!isAdmin && order.userId !== (req.user?.id || 'guest')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    res.json({ ok: true, order: mapOrder(order) });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'FAILED_GET', message: e.message });
  }
});

// Update order (partial) - admin can update anything, user limited (e.g., cannot change userId or totals directly)
const updateOrderSchema = z.object({
  status: z.string().trim().optional(),
  items: z.array(orderItemSchema).optional(),
  // Zod v4: use unknown() instead of any()
  paymentMeta: z.record(z.unknown()).optional(),
});
router.patch('/:id', async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  try {
    const parsed = updateOrderSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ ok:false, error:'INVALID_INPUT', fields: parsed.error.flatten() });
    }
    const updated = await OrdersService.update(req.params.id, parsed.data, { isAdmin, userId: req.user?.id || 'guest' });
    audit({ action: 'order.update', entity: 'Order', entityId: updated.id, userId: req.user?.id, meta: { status: updated.status } });
    emitOrderEvent('order.updated', updated);
    res.json({ ok: true, order: mapOrder(updated) });
  } catch (e) {
    const status = e.statusCode || 400;
    res.status(status).json({ ok: false, error: status === 403 ? 'FORBIDDEN' : 'FAILED_UPDATE', message: e.message });
  }
});

// Order tracking endpoints
// POST /api/orders/:id/track  - receive tracking update (status/location/note) and broadcast via SSE
router.post('/:id/track', async (req, res) => {
  const { status, location, note } = req.body || {};
  try {
    const order = await OrdersService.getById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    // Only owner or admin can persist status change; others may still emit events in degraded mode
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.userId !== (req.user?.id || 'guest')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    let updated = null;
    try {
      // Only update status field to keep changes minimal
      if (typeof status === 'string' && status.trim()) {
        updated = await OrdersService.update(req.params.id, { status: String(status).trim() }, { isAdmin, userId: req.user?.id || order.userId });
      }
    } catch (e) {
      if (process.env.ALLOW_INVALID_DB === 'true') {
        // emit event even if DB update failed in degraded mode
        emitOrderEvent('order.tracking', { id: req.params.id, status, location, note });
        return res.json({ ok: true, degraded: true });
      }
      throw e;
    }
    // Broadcast tracking update to SSE/WebSocket clients
    emitOrderEvent('order.tracking', { id: (updated && updated.id) || req.params.id, status: (updated && updated.status) || status, location, note });
    return res.json({ ok: true, tracking: { id: (updated && updated.id) || req.params.id, status: (updated && updated.status) || status, location, note } });
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'FAILED_TRACK', message: e.message });
  }
});

router.get('/:id/track', async (req, res) => {
  try {
    const order = await OrdersService.getById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    return res.json({ ok: true, id: order.id, status: order.status, updatedAt: order.updatedAt });
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'FAILED_GET', message: e.message });
  }
});

// Create shipment for order via adapter (choose provider via body.provider or default)
// POST /api/orders/:id/ship  { provider?: 'aramex'|'smsa' }
router.post('/:id/ship', async (req, res) => {
  try {
    const order = await OrdersService.getById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    // only admin or owner may create shipments
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.userId !== (req.user?.id || 'guest')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const provider = String(req.body?.provider || '').toLowerCase() || (process.env.DEFAULT_SHIPPING_PROVIDER || 'aramex');
    const adapters = { aramex, smsa };
    const adapter = adapters[provider];
    if (!adapter) return res.status(400).json({ ok: false, error: 'UNKNOWN_PROVIDER' });
    // Call adapter; adapters are responsible for persisting Shipment record if model exists
    const result = await adapter.createShipment(order);
    // If adapter didn't persist, attempt to save minimal shipment record
    try {
      if (result && result.trackingId && prisma?.shipment) {
        const exists = await prisma.shipment.findUnique({ where: { trackingNumber: result.trackingId } }).catch(() => null);
        if (!exists) {
          await prisma.shipment.create({ data: { orderId: order.id, provider: provider, trackingNumber: result.trackingId, status: result.status || 'created', meta: result.raw ? (typeof result.raw === 'object' ? result.raw : String(result.raw)) : undefined } }).catch(() => null);
        }
      }
    } catch (e) { /* ignore persistence errors */ }
    try { emitOrderEvent('order.shipped', { id: order.id, provider, trackingId: result.trackingId || null, status: result.status || null }); } catch (e) {}
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'FAILED_SHIP', message: e.message });
  }
});

// Get shipments for order. Optional ?refresh=1 to call provider track endpoints for each
router.get('/:id/ship', async (req, res) => {
  try {
    const order = await OrdersService.getById(req.params.id);
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.userId !== (req.user?.id || 'guest')) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    let list = [];
    try {
      list = await prisma.shipment.findMany({ where: { orderId: order.id } });
    } catch (e) {
      if (process.env.ALLOW_INVALID_DB === 'true') list = [];
      else throw e;
    }
    const refresh = String(req.query?.refresh || '') === '1' || String(req.query?.refresh || '').toLowerCase() === 'true';
    if (refresh) {
      const adapters = { aramex, smsa };
      const updated = [];
      for (const s of list) {
        const adapter = adapters[(s.provider || '').toLowerCase()];
        if (!adapter) {
          updated.push({ ...s, probe: 'no-adapter' });
          continue;
        }
        try {
          const t = await adapter.track(s.trackingNumber);
          // persist status
          if (prisma?.shipment && t && t.status) {
            await prisma.shipment.updateMany({ where: { trackingNumber: s.trackingNumber }, data: { status: t.status, meta: t.raw ? (typeof t.raw === 'object' ? t.raw : String(t.raw)) : undefined } }).catch(() => null);
          }
          updated.push({ ...s, probe: t });
        } catch (e) {
          updated.push({ ...s, probe: { ok: false, error: e.message } });
        }
      }
      return res.json({ ok: true, shipments: updated });
    }
    return res.json({ ok: true, shipments: list });
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'FAILED_GET', message: e.message });
  }
});

function renderInvoiceHtml(order, opts = {}) {
  const storeName = opts.storeName || 'شركة منفذ اسيا التجارية';
  const logoUrl = opts.logoUrl || null;
  const currency = order.currency || 'SAR';
  const fmt = (v) => typeof v === 'number' ? v.toFixed(2) : v;
  const fmtMoney = (v) => `${fmt(v)} ${currency}`;
  const accent = opts.theme?.accent || '#0ea5e9';
  const line = opts.theme?.line || '#e2e8f0';
  const soft = opts.theme?.soft || '#f8fafc';
  const paper = opts.paper || 'a4';
  const rows = (order.items || []).map((i, idx) => `
        <tr class="row ${idx % 2 ? 'alt' : ''}">
          <td class="item">${i.nameAr || ''}${i.nameEn ? ` <span class="muted">/ ${i.nameEn}</span>` : ''}</td>
          <td class="qty num" dir="ltr">${i.quantity}</td>
          <td class="price num" dir="ltr">${fmt(i.price)}</td>
          <td class="total num" dir="ltr">${fmt(i.price * i.quantity)}</td>
        </tr>
  `).join('');

  return `<!doctype html>
  <html lang="ar">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>فاتورة #${order.id} | ${storeName}</title>
    <style>
      :root{
        --bg:#ffffff; --text:#0f172a; --muted:#64748b; --line:${line}; --soft:${soft}; --accent:${accent};
      }
      *{box-sizing:border-box}
      html,body{margin:0;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;direction:rtl}
      .container{max-width:${paper==='thermal80' ? '78mm' : '900px'};margin:0 auto;padding:${paper==='thermal80' ? '8px' : '28px'};}
      .screen-only{display:block}
      .no-print{display:block}
      header{
        display:flex;gap:${paper==='thermal80' ? '8px' : '16px'};align-items:center;justify-content:space-between;margin-bottom:${paper==='thermal80' ? '8px' : '18px'}
      }
      .brand{display:flex;gap:12px;align-items:center}
      .brand .logo{width:${paper==='thermal80' ? '0' : '64px'};height:${paper==='thermal80' ? '0' : '64px'};object-fit:contain;border-radius:12px;border:1px solid var(--line);background:#fff;display:${paper==='thermal80' ? 'none' : 'block'};}
      .brand .name{font-size:${paper==='thermal80' ? '16px' : '20px'};font-weight:700}
      .meta{display:grid;gap:6px;font-size:${paper==='thermal80' ? '11px' : '13px'};color:var(--muted);text-align:left}
  .badge{display:inline-block;background:var(--accent);color:#fff;padding:4px 10px;border-radius:999px;font-size:12px}
      .title{display:flex;align-items:baseline;gap:${paper==='thermal80' ? '6px' : '10px'};margin:10px 0 0}
      .title .big{font-size:${paper==='thermal80' ? '18px' : '28px'};font-weight:800}
      .title .id{font-size:${paper==='thermal80' ? '12px' : '18px'};color:var(--muted);font-weight:600}
      .summary{
        display:grid;gap:${paper==='thermal80' ? '8px' : '12px'};grid-template-columns:1fr; margin:${paper==='thermal80' ? '8px 0 10px' : '16px 0 22px'}
      }
      .card{border:1px solid var(--line);background:${paper==='thermal80' ? '#fff' : 'var(--soft)'};border-radius:${paper==='thermal80' ? '8px' : '12px'};padding:${paper==='thermal80' ? '10px' : '14px'};}
      .card .title{font-weight:600;margin:0 0 ${paper==='thermal80' ? '6px' : '8px'};font-size:${paper==='thermal80' ? '12px' : 'inherit'};}
      table.items{width:100%;border-collapse:separate;border-spacing:0;margin:${paper==='thermal80' ? '4px 0 8px' : '8px 0 16px'};border:1px solid var(--line);border-radius:${paper==='thermal80' ? '8px' : '12px'};overflow:hidden}
      .items thead th{background:var(--soft);font-weight:600;color:var(--muted);font-size:${paper==='thermal80' ? '11px' : '13px'};padding:${paper==='thermal80' ? '6px 8px' : '10px 12px'};border-bottom:1px solid var(--line);text-align:right}
      .items td{padding:${paper==='thermal80' ? '6px 8px' : '12px'};border-bottom:1px solid var(--line);vertical-align:top;font-size:${paper==='thermal80' ? '12px' : 'inherit'};}
      .items tr.alt td{background:#fcfdff}
      .items td.qty,.items td.price,.items td.total{white-space:nowrap;text-align:left}
      .num{font-variant-numeric:tabular-nums;}
      .items tfoot td{padding:10px 12px}
      .muted{color:var(--muted)}
      .totals{width:100%;max-width:${paper==='thermal80' ? '100%' : '360px'};margin-inline-start:auto}
      .totals .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)}
      .totals .row:last-child{border-bottom:0}
      .totals .label{color:var(--muted)}
      .totals .grand{font-weight:800;font-size:${paper==='thermal80' ? '14px' : '18px'}}
  footer{margin-top:${paper==='thermal80' ? '10px' : '28px'};color:var(--muted);font-size:${paper==='thermal80' ? '11px' : '12px'};display:flex;justify-content:space-between;gap:12px;align-items:center}
  .qr{display:flex;align-items:center;gap:10px}
  .qr img{width:${paper==='thermal80' ? '72px' : '96px'};height:${paper==='thermal80' ? '72px' : '96px'};object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#fff}
  .qr .caption{font-size:${paper==='thermal80' ? '10px' : '12px'}}
  .print-btn{border:1px solid var(--line);background:#fff;color:var(--text);padding:${paper==='thermal80' ? '6px 10px' : '8px 12px'};border-radius:10px;cursor:pointer}
  .print-btn:hover{box-shadow:0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)}
      .actions{display:flex;gap:8px}
      /* Page size overrides for thermal 80mm */
      ${paper==='thermal80' ? `@page { size: 80mm auto; margin: 5mm; }` : ''}
      @media (min-width:720px){ .summary{grid-template-columns:1fr 1fr}}
      @media print{
        .container{padding:${paper==='thermal80' ? '0' : '16mm'}}
        .no-print{display:none !important}
        header{margin-bottom:8px}
        .card{background:transparent}
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <div class="brand">
          ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"/>` : ''}
          <div class="name">${storeName}</div>
        </div>
        <div class="meta">
          <div><strong>فاتورة #</strong>${order.id}</div>
          <div><strong>التاريخ:</strong> ${new Date(order.createdAt).toLocaleString('ar')}</div>
          <div><span class="badge">${order.status}</span></div>
        </div>
      </header>
      <div class="title">
        <div class="big">فاتورة</div>
        <div class="id">#${order.id}</div>
      </div>

      <div class="summary">
        <div class="card">
          <p class="title">معلومات العميل</p>
          <div class="muted">المعرف: ${order.userId}</div>
        </div>
        <div class="card">
          <p class="title">معلومات الفاتورة</p>
          <div><strong>العملة:</strong> ${currency}</div>
          <div><strong>عدد العناصر:</strong> ${(order.items || []).length}</div>
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>السعر (${currency})</th>
            <th>الإجمالي (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="totals card" style="background:#fff">
        <div class="row"><div class="label">الإجمالي الفرعي</div><div>${fmtMoney(order.subtotal)}</div></div>
        <div class="row"><div class="label">الخصم</div><div>${fmtMoney(order.discount)}</div></div>
        <div class="row"><div class="label">الضريبة</div><div>${fmtMoney(order.tax)}</div></div>
        <div class="row grand"><div>الإجمالي النهائي</div><div>${fmtMoney(order.grandTotal)}</div></div>
      </div>

      <footer>
        <div style="display:flex;gap:12px;align-items:center">
          ${opts.qrDataUrl ? `<div class="qr"><img src="${opts.qrDataUrl}" alt="QR"/><div class="caption">تحقق من الفاتورة عبر رمز QR</div></div>` : ''}
          <div>شكرًا لتسوقك معنا. هذه الفاتورة صالحة بدون توقيع.</div>
        </div>
        <div class="actions no-print">
          ${opts.pdfUrlA4 ? `<a class="print-btn" href="${opts.pdfUrlA4}" target="_blank" rel="noopener">تحميل PDF A4</a>` : ''}
          ${opts.pdfUrlThermal ? `<a class="print-btn" href="${opts.pdfUrlThermal}" target="_blank" rel="noopener">PDF حراري 80mm</a>` : ''}
          <button class="print-btn" onclick="window.print()">طباعة</button>
        </div>
      </footer>
    </div>
  ${opts.autoPrint ? '<script>document.addEventListener("DOMContentLoaded",()=>{ try{ window.print(); }catch(e){} });</script>' : ''}
  </body>
  </html>`;
}

// Invoice (HTML)
router.get('/:id/invoice', async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).send('<h1>Invoice Not Found</h1>');
    if (!isAdmin && order.userId !== (req.user?.id || 'guest')) {
      return res.status(403).send('<h1>Forbidden</h1>');
    }
    // Load store settings for branding
    let setting = null; try { setting = await prisma.storeSetting.findUnique({ where: { id: 'singleton' } }); } catch {}
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية';
  // Build theme from settings or logo
  const theme = { accent: setting?.colorAccent || setting?.colorPrimary || null, line: '#e2e8f0', soft: '#f8fafc' };
    let logoSrc = null;
    if (setting?.logo) {
      // Try inline base64 if file exists locally
      try {
        const rel = setting.logo.startsWith('/') ? setting.logo.slice(1) : setting.logo;
        const abs = path.join(process.cwd(), rel);
        if (fs.existsSync(abs)) {
          const buf = fs.readFileSync(abs);
          const ext = path.extname(abs).toLowerCase();
          const mime = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
          logoSrc = `data:${mime};base64,${buf.toString('base64')}`;
        } else {
          logoSrc = setting.logo.startsWith('http') ? setting.logo : `${req.protocol}://${req.headers.host}${setting.logo}`;
        }
      } catch {
        logoSrc = setting.logo.startsWith('http') ? setting.logo : `${req.protocol}://${req.headers.host}${setting.logo}`;
      }
    }
    // If no explicit accent color, try to derive a dominant color from logo
    if (!theme.accent && logoSrc?.startsWith('data:')) {
      try {
        const base64 = logoSrc.split(',')[1];
        const buf = Buffer.from(base64, 'base64');
        const stats = await sharp(buf).resize(64,64,{ fit:'cover' }).stats();
        // Pick channel medians as a simple dominant color heuristic
        if (stats && stats.channels?.length >= 3) {
          const r = Math.round(stats.channels[0].median);
          const g = Math.round(stats.channels[1].median);
          const b = Math.round(stats.channels[2].median);
          theme.accent = `rgb(${r}, ${g}, ${b})`;
          // Derive soft/line lightly
          theme.soft = '#fdfefe';
          theme.line = '#e5e9f2';
        }
      } catch {}
    }

  const token = typeof req.query?.token === 'string' ? req.query.token : null;
    const paper = String(req.query?.paper || '').toLowerCase();
    const autoPrint = String(req.query?.auto || '') === '1' || String(req.query?.auto || '').toLowerCase() === 'true';
    const pdfParamsA4 = new URLSearchParams();
    const pdfParamsThermal = new URLSearchParams();
    if (token) { pdfParamsA4.set('token', token); pdfParamsThermal.set('token', token); }
    // A4 link
    const pdfUrlA4 = `${req.protocol}://${req.headers.host}/api/orders/${order.id}/invoice.pdf${pdfParamsA4.toString() ? `?${pdfParamsA4}` : ''}`;
    // Thermal 80mm link
    pdfParamsThermal.set('paper', 'thermal80');
    const pdfUrlThermal = `${req.protocol}://${req.headers.host}/api/orders/${order.id}/invoice.pdf?${pdfParamsThermal}`;
    // Generate QR (prefer official invoice entity if exists)
    let qrDataUrl = null;
    try {
      const baseUrl = `${req.protocol}://${req.headers.host}`;
      const inv = await prisma.invoice.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } }).catch(() => null);
      const verifyUrl = inv ? `${baseUrl}/api/invoices/${inv.id}` : `${baseUrl}/api/orders/${order.id}/invoice`;
      const qrPng = await generateInvoiceQrPng(verifyUrl);
      qrDataUrl = `data:image/png;base64,${qrPng.toString('base64')}`;
    } catch {}
    res.type('html').send(renderInvoiceHtml(order, { storeName: siteName, logoUrl: logoSrc, pdfUrlA4, pdfUrlThermal, theme, paper, autoPrint, qrDataUrl }));
  } catch (e) {
    res.status(500).send('<h1>Error generating invoice</h1>');
  }
});

// Invoice (PDF)
router.get('/:id/invoice.pdf', async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (!isAdmin && order.userId !== (req.user?.id || 'guest')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
  // Load store settings for branding
  let setting = null; try { setting = await prisma.storeSetting.findUnique({ where: { id: 'singleton' } }); } catch {}
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية';
  const theme = { accent: setting?.colorAccent || setting?.colorPrimary || null, line: '#e2e8f0', soft: '#f8fafc' };
  let logoSrc = null;
  if (setting?.logo) {
    try {
      const rel = setting.logo.startsWith('/') ? setting.logo.slice(1) : setting.logo;
      const abs = path.join(process.cwd(), rel);
      if (fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        const ext = path.extname(abs).toLowerCase();
        const mime = ext === '.webp' ? 'image/webp' : ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';
        logoSrc = `data:${mime};base64,${buf.toString('base64')}`;
      } else {
        logoSrc = setting.logo.startsWith('http') ? setting.logo : `${req.protocol}://${req.headers.host}${setting.logo}`;
      }
    } catch {
      logoSrc = setting.logo.startsWith('http') ? setting.logo : `${req.protocol}://${req.headers.host}${setting.logo}`;
    }
  }
  // Try derive accent from inlined logo if not explicitly set
  if (!theme.accent && logoSrc?.startsWith('data:')) {
    try {
      const base64 = logoSrc.split(',')[1];
      const buf = Buffer.from(base64, 'base64');
      const stats = await sharp(buf).resize(64,64,{ fit:'cover' }).stats();
      if (stats && stats.channels?.length >= 3) {
        const r = Math.round(stats.channels[0].median);
        const g = Math.round(stats.channels[1].median);
        const b = Math.round(stats.channels[2].median);
        theme.accent = `rgb(${r}, ${g}, ${b})`;
        theme.soft = '#fdfefe';
        theme.line = '#e5e9f2';
      }
    } catch {}
  }
  const paper = String(req.query?.paper || '').toLowerCase();
  // QR for PDF
  let qrDataUrl = null;
  try {
    const baseUrl = `${req.protocol}://${req.headers.host}`;
    const inv = await prisma.invoice.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } }).catch(() => null);
    const verifyUrl = inv ? `${baseUrl}/api/invoices/${inv.id}` : `${baseUrl}/api/orders/${order.id}/invoice`;
    const qrPng = await generateInvoiceQrPng(verifyUrl);
    qrDataUrl = `data:image/png;base64,${qrPng.toString('base64')}`;
  } catch {}
  const html = renderInvoiceHtml(order, { storeName: siteName, logoUrl: logoSrc, theme, paper, qrDataUrl });
    // Lazy import puppeteer; in serverless (e.g., Vercel) we may skip the Chromium download at build time
    // via PUPPETEER_SKIP_DOWNLOAD=1. If not present at runtime, return a 501 gracefully.
    let puppeteer;
    try {
      puppeteer = (await import('puppeteer')).default;
    } catch (e) {
      return res.status(501).json({ ok: false, error: 'PDF_NOT_AVAILABLE', message: 'Puppeteer/Chromium not available in this environment.' });
    }
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('screen');
      // Allow customizing paper via query params
      const q = req.query || {};
      const sizeRaw = String(q.size || 'A4').toUpperCase();
      const allowedSizes = new Set(['A3','A4','A5','LETTER','LEGAL','TABLOID']);
      const landscape = String(q.orientation || 'portrait').toLowerCase() === 'landscape';
      // Margins (mm) optional
      const mm = (v, d) => (v != null && v !== '' && !Number.isNaN(Number(v))) ? `${Number(v)}mm` : d;
      const margin = {
        top: mm(q.mt, paper==='thermal80' ? '5mm' : '16mm'),
        right: mm(q.mr, paper==='thermal80' ? '5mm' : '12mm'),
        bottom: mm(q.mb, paper==='thermal80' ? '5mm' : '16mm'),
        left: mm(q.ml, paper==='thermal80' ? '5mm' : '12mm')
      };
      let pdf;
      if (paper === 'thermal80') {
        // Let CSS @page define size to allow dynamic height; narrow width to ~80mm
        pdf = await page.pdf({ printBackground: true, margin, preferCSSPageSize: true });
      } else {
        const format = allowedSizes.has(sizeRaw) ? sizeRaw : 'A4';
        pdf = await page.pdf({ format, landscape, printBackground: true, margin });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice-${order.id}.pdf"`);
      return res.end(pdf);
    } finally {
      await browser.close();
    }
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_PDF', message: e.message });
  }
});

// Convenience route for thermal 80mm PDF
router.get('/:id/invoice.thermal.pdf', async (req, res) => {
  const q = new URLSearchParams(req.query || {});
  q.set('paper', 'thermal80');
  return res.redirect(302, `/api/orders/${req.params.id}/invoice.pdf?${q.toString()}`);
});

export default router;


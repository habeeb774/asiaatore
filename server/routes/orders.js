import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import prisma from '../db/client.js';
import { computeTotals } from '../utils/totals.js';
import { audit } from '../utils/audit.js';
import { emitOrderEvent } from '../utils/realtimeHub.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function mapOrder(o) {
  return {
    id: o.id,
    userId: o.userId,
    status: o.status,
    currency: o.currency,
    subtotal: o.subtotal,
    discount: o.discount,
    tax: o.tax,
    grandTotal: o.grandTotal,
    // Provide legacy alias used by some older frontend code paths
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
      quantity: i.quantity
    }))
  };
}

// List orders (admin: all / user: own) with optional pagination
// List orders with advanced filters (admin only for cross-user queries)
// Query params: userId, status, paymentMethod, from, to, page, pageSize
router.get('/', async (req, res) => {
  try {
    const { userId, page, pageSize, status, paymentMethod, from, to } = req.query;
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
          // include full day if date only
          if (to.match(/^\d{4}-\d{2}-\d{2}$/)) d.setHours(23,59,59,999);
          range.lte = d;
        }
      }
      if (Object.keys(range).length) where.createdAt = range;
    }
    const pg = page ? Math.max(1, parseInt(page, 10)) : null;
    const ps = pageSize ? Math.min(500, Math.max(1, parseInt(pageSize, 10))) : 50;
    if (pg) {
      const skip = (pg - 1) * ps;
      const [total, list] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: ps, include: { items: true } })
      ]);
      return res.json({
        ok: true,
        orders: list.map(mapOrder),
        page: pg,
        pageSize: ps,
        total,
        totalPages: Math.ceil(total / ps)
      });
    }
    const list = await prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, include: { items: true } });
    res.json({ ok: true, orders: list.map(mapOrder) });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_LIST', message: e.message });
  }
});

// Create order
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const userId = req.user?.id || body.userId || 'guest';
    const currency = body.currency || 'SAR';
    const rawItems = Array.isArray(body.items) ? body.items : [];

    // Normalize items: ensure product-based fields from DB if productId provided
    const normalizedItems = [];
    for (const it of rawItems) {
      const pid = it.productId;
      const looksLocal = typeof pid === 'string' && (pid === 'custom' || pid.startsWith('p_'));
      if (pid && !looksLocal) {
        const product = await prisma.product.findUnique({ where: { id: pid } });
        if (product) {
          normalizedItems.push({
            productId: product.id,
            nameAr: product.nameAr,
            nameEn: product.nameEn,
            price: product.price,
            oldPrice: product.oldPrice,
            quantity: Number(it.quantity) || 1
          });
          continue;
        }
        // fallback inline if not found
      }
      normalizedItems.push({
        productId: looksLocal ? 'custom' : (pid || 'custom'),
        nameAr: it.name?.ar || 'صنف',
        nameEn: it.name?.en || 'Item',
        price: Number(it.price) || 0,
        oldPrice: it.oldPrice != null ? Number(it.oldPrice) : null,
        quantity: Number(it.quantity) || 1
      });
    }

  const shippingOverride = typeof body.paymentMeta?.shipping === 'number' ? body.paymentMeta.shipping : undefined;
    // Ensure placeholder product exists if any item is 'custom' (for non-catalog items)
    if (normalizedItems.some(i => i.productId === 'custom')) {
      try {
        await prisma.product.upsert({
          where: { id: 'custom' },
          update: {},
          create: {
            id: 'custom',
            slug: 'custom-placeholder',
            nameAr: 'عنصر مخصص',
            nameEn: 'Custom Item',
            category: 'misc',
            price: 0,
            stock: 0
          }
        });
      } catch (e) {
        // if slug collision, try alternative slug
        try {
          await prisma.product.create({
            data: {
              id: 'custom',
              slug: 'custom-placeholder-2',
              nameAr: 'عنصر مخصص',
              nameEn: 'Custom Item',
              category: 'misc',
              price: 0,
              stock: 0
            }
          });
        } catch {}
      }
    }

    const totals = computeTotals(normalizedItems, { shipping: shippingOverride });

    const created = await prisma.order.create({
      data: {
        userId,
        status: body.status || 'pending',
        currency,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
    grandTotal: totals.grandTotal,
        paymentMethod: body.paymentMethod || null,
  paymentMeta: body.paymentMeta || null,
        items: {
          create: normalizedItems.map(i => ({
            productId: i.productId,
            nameAr: i.nameAr,
            nameEn: i.nameEn,
            price: i.price,
            oldPrice: i.oldPrice,
            quantity: i.quantity
          }))
        }
      },
      include: { items: true }
    });
  audit({ action: 'order.create', entity: 'Order', entityId: created.id, userId, meta: { items: created.items.length, total: created.grandTotal } });
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
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
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
router.patch('/:id', async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  try {
    const existing = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!existing) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (!isAdmin && existing.userId !== (req.user?.id || 'guest')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const body = req.body || {};

    let itemsData = existing.items.map(i => ({
      productId: i.productId,
      nameAr: i.nameAr,
      nameEn: i.nameEn,
      price: i.price,
      oldPrice: i.oldPrice,
      quantity: i.quantity
    }));

    if (Array.isArray(body.items)) {
      const canUserModify = !isAdmin && existing.status === 'pending' && existing.userId === (req.user?.id || 'guest');
      if (!isAdmin && !canUserModify) {
        return res.status(403).json({ ok: false, error: 'FORBIDDEN_ITEMS_MOD' });
      }
      itemsData = [];
      for (const it of body.items) {
        const looksLocal = typeof it.productId === 'string' && (it.productId === 'custom' || it.productId.startsWith('p_'));
        if (it.productId && !looksLocal) {
          const product = await prisma.product.findUnique({ where: { id: it.productId } });
          if (!product) return res.status(400).json({ ok: false, error: 'PRODUCT_NOT_FOUND', productId: it.productId });
          itemsData.push({
            productId: product.id,
            nameAr: product.nameAr,
            nameEn: product.nameEn,
            price: product.price,
            oldPrice: product.oldPrice,
            quantity: Number(it.quantity) || 1
          });
        } else {
          itemsData.push({
            productId: looksLocal ? 'custom' : (it.productId || 'custom'),
            nameAr: it.name?.ar || 'صنف',
            nameEn: it.name?.en || 'Item',
            price: Number(it.price) || 0,
            oldPrice: it.oldPrice != null ? Number(it.oldPrice) : null,
            quantity: Number(it.quantity) || 1
          });
        }
      }
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
      grandTotal: totals.grandTotal
    };

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(body.items) && isAdmin) {
        // Remove existing items then re-create
        await tx.orderItem.deleteMany({ where: { orderId: existing.id } });
        for (const it of itemsData) {
          await tx.orderItem.create({ data: { ...it, orderId: existing.id } });
        }
      }
      return tx.order.update({ where: { id: existing.id }, data: updateData, include: { items: true } });
    });

  audit({ action: 'order.update', entity: 'Order', entityId: updated.id, userId: req.user?.id, meta: { status: updated.status } });
  emitOrderEvent('order.updated', updated);
    res.json({ ok: true, order: mapOrder(updated) });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'FAILED_UPDATE', message: e.message });
  }
});

function renderInvoiceHtml(order, opts = {}) {
  const storeName = opts.storeName || 'متجري';
  const logoUrl = opts.logoUrl || null;
  const currency = order.currency || 'SAR';
  const fmt = (v) => typeof v === 'number' ? v.toFixed(2) : v;
  const fmtMoney = (v) => `${fmt(v)} ${currency}`;
  const accent = opts.theme?.accent || '#0ea5e9';
  const line = opts.theme?.line || '#e2e8f0';
  const soft = opts.theme?.soft || '#f8fafc';
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
      .container{max-width:900px;margin:0 auto;padding:28px}
      .screen-only{display:block}
      .no-print{display:block}
      header{
        display:flex;gap:16px;align-items:center;justify-content:space-between;margin-bottom:18px
      }
      .brand{display:flex;gap:12px;align-items:center}
      .brand .logo{width:64px;height:64px;object-fit:contain;border-radius:12px;border:1px solid var(--line);background:#fff}
      .brand .name{font-size:20px;font-weight:700}
      .meta{display:grid;gap:6px;font-size:13px;color:var(--muted);text-align:left}
  .badge{display:inline-block;background:var(--accent);color:#fff;padding:4px 10px;border-radius:999px;font-size:12px}
      .title{display:flex;align-items:baseline;gap:10px;margin:10px 0 0}
      .title .big{font-size:28px;font-weight:800}
      .title .id{font-size:18px;color:var(--muted);font-weight:600}
      .summary{
        display:grid;gap:12px;grid-template-columns:1fr; margin:16px 0 22px
      }
      .card{border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:14px}
      .card .title{font-weight:600;margin:0 0 8px}
      table.items{width:100%;border-collapse:separate;border-spacing:0;margin:8px 0 16px;border:1px solid var(--line);border-radius:12px;overflow:hidden}
      .items thead th{background:var(--soft);font-weight:600;color:var(--muted);font-size:13px;padding:10px 12px;border-bottom:1px solid var(--line);text-align:right}
      .items td{padding:12px;border-bottom:1px solid var(--line);vertical-align:top}
      .items tr.alt td{background:#fcfdff}
      .items td.qty,.items td.price,.items td.total{white-space:nowrap;text-align:left}
      .num{font-variant-numeric:tabular-nums;}
      .items tfoot td{padding:10px 12px}
      .muted{color:var(--muted)}
      .totals{width:100%;max-width:360px;margin-inline-start:auto}
      .totals .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line)}
      .totals .row:last-child{border-bottom:0}
      .totals .label{color:var(--muted)}
      .totals .grand{font-weight:800;font-size:18px}
      footer{margin-top:28px;color:var(--muted);font-size:12px;display:flex;justify-content:space-between;gap:12px;align-items:center}
  .print-btn{border:1px solid var(--line);background:#fff;color:var(--text);padding:8px 12px;border-radius:10px;cursor:pointer}
  .print-btn:hover{box-shadow:0 0 0 3px color-mix(in oklab, var(--accent) 20%, transparent)}
      .actions{display:flex;gap:8px}
      @media (min-width:720px){ .summary{grid-template-columns:1fr 1fr}}
      @media print{
        .container{padding:16mm}
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
          ${logoUrl ? `<img class=\"logo\" src=\"${logoUrl}\" alt=\"Logo\" onerror=\"this.style.display='none'\"/>` : ''}
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
        <div>شكرًا لتسوقك معنا. هذه الفاتورة صالحة بدون توقيع.</div>
        <div class="actions no-print">
          ${opts.pdfUrl ? `<a class=\"print-btn\" href=\"${opts.pdfUrl}\" target=\"_blank\" rel=\"noopener\">تحميل PDF</a>` : ''}
          <button class="print-btn" onclick="window.print()">طباعة</button>
        </div>
      </footer>
    </div>
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
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'متجري';
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
    const pdfParams = new URLSearchParams();
    if (token) pdfParams.set('token', token);
    const pdfUrl = `${req.protocol}://${req.headers.host}/api/orders/${order.id}/invoice.pdf${pdfParams.toString() ? `?${pdfParams}` : ''}`;
  res.type('html').send(renderInvoiceHtml(order, { storeName: siteName, logoUrl: logoSrc, pdfUrl, theme }));
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
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'متجري';
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
  const html = renderInvoiceHtml(order, { storeName: siteName, logoUrl: logoSrc, theme });
    let puppeteer;
    try {
      puppeteer = (await import('puppeteer')).default;
    } catch (e) {
      return res.status(501).json({ ok: false, error: 'PDF_NOT_AVAILABLE', message: 'Requires puppeteer to be installed on the server.' });
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
      const format = allowedSizes.has(sizeRaw) ? sizeRaw : 'A4';
      const landscape = String(q.orientation || 'portrait').toLowerCase() === 'landscape';
      // Margins (mm) optional
      const mm = (v, d) => (v != null && v !== '' && !Number.isNaN(Number(v))) ? `${Number(v)}mm` : d;
      const margin = {
        top: mm(q.mt, '16mm'),
        right: mm(q.mr, '12mm'),
        bottom: mm(q.mb, '16mm'),
        left: mm(q.ml, '12mm')
      };
      const pdf = await page.pdf({ format, landscape, printBackground: true, margin });
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

export default router;

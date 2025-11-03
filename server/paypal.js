import express from 'express';
import dotenv from 'dotenv';
import prisma from './db/client.js';
import { computeTotals } from './utils/totals.js';
import { audit } from './utils/audit.js';
import crypto from 'crypto';
import { ensureInvoiceForOrder } from './utils/invoice.js';
import { sendInvoiceWhatsApp } from './services/whatsapp.js';

dotenv.config();

const router = express.Router();
// Enforce enablement via settings (best-effort; if DB unavailable, allow in dev)
router.use(async (req, res, next) => {
  try {
    if (req.path === '/_config') return next();
    const setting = await prisma.storeSetting?.findUnique?.({ where: { id: 'singleton' } }).catch(() => null);
    if (setting && setting.payPaypalEnabled === 0) {
      return res.status(403).json({ ok: false, error: 'PAYMENT_DISABLED', method: 'paypal' });
    }
    if (setting && setting.payPaypalEnabled === false) {
      return res.status(403).json({ ok: false, error: 'PAYMENT_DISABLED', method: 'paypal' });
    }
  } catch {/* ignore and allow */}
  next();
});
const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.sandbox.paypal.com';
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || null; // Provided by PayPal developer dashboard

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

function isPlaceholder(v) {
  if (!v) return true;
  const low = v.toLowerCase();
  return low === 'your_paypal_sandbox_client_id' || low === 'your_paypal_sandbox_secret';
}

// Simple in-memory token cache
let paypalTokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  const client = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!client || !secret) throw new Error('Missing PayPal credentials in env');
  if (isPlaceholder(client) || isPlaceholder(secret)) {
    throw new Error('PayPal credentials are placeholders. Set PAYPAL_CLIENT_ID / PAYPAL_SECRET in .env');
  }
  const now = Date.now();
  if (paypalTokenCache.token && paypalTokenCache.expiresAt > now + 30_000) {
    return paypalTokenCache.token;
  }
  const tokenUrl = `${PAYPAL_API}/v1/oauth2/token`;
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${client}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  const ttl = (data.expires_in || 300) * 1000; // default 5m if missing
  paypalTokenCache = { token: data.access_token, expiresAt: Date.now() + ttl };
  return data.access_token;
}

// Diagnostic route (masked) – DO NOT expose in production (could add auth check if needed)
router.get('/_config', (req, res) => {
  const client = process.env.PAYPAL_CLIENT_ID || '';
  const secret = process.env.PAYPAL_SECRET || '';
  res.json({
    ok: true,
    clientConfigured: !!client && !isPlaceholder(client),
    secretConfigured: !!secret && !isPlaceholder(secret),
    clientPreview: client ? `${client.slice(0,6)}...${client.slice(-4)}` : null,
    hasReturn: !!process.env.PAYPAL_RETURN_URL,
    hasCancel: !!process.env.PAYPAL_CANCEL_URL,
    api: PAYPAL_API,
    webhookIdConfigured: !!PAYPAL_WEBHOOK_ID
  });
});

// Utility: verify PayPal webhook signature (best-effort if webhook ID configured)
async function verifyWebhook(rawBodyString, headers) {
  if (!PAYPAL_WEBHOOK_ID) return { verified: false, reason: 'NO_WEBHOOK_ID' };
  try {
    const accessToken = await getAccessToken();
    const verifyRes = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBodyString)
      })
    });
    const data = await verifyRes.json();
    return { verified: data.verification_status === 'SUCCESS', data };
  } catch (e) {
    return { verified: false, error: e.message };
  }
}

// IMPORTANT: we need raw body for signature. If express.json consumed it, fallback to reconstructed JSON string.
// Add lightweight middleware capturing raw body if not already present.
router.use((req, _res, next) => {
  if (req.rawBodyCaptured) return next();
  if (req.readableEnded || req.body) { // already parsed by parent
    try { req.rawBody = JSON.stringify(req.body); } catch { req.rawBody = '{}'; }
    return next();
  }
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks).toString('utf8');
    req.rawBodyCaptured = true;
    next();
  });
});

// Create local order in DB + PayPal order
router.post('/create-order', async (req, res) => {
  try {
    const payload = req.body || {};
    const raw = payload.order || payload; // flexible payload
    const currency = raw.currency || 'SAR';
    const itemsInput = Array.isArray(raw.items) ? raw.items : [];
    const userId = req.user?.id || raw.userId || 'guest';

    // Normalize items similar to orders route (light version)
    const normalized = [];
    for (const it of itemsInput) {
      const pid = it.productId;
      const looksLocal = typeof pid === 'string' && (pid === 'custom' || pid?.startsWith('p_'));
      if (pid && !looksLocal) {
        const product = await prisma.product.findUnique({ where: { id: pid } });
        if (product) {
          normalized.push({
            productId: product.id,
            nameAr: product.nameAr,
            nameEn: product.nameEn,
            price: product.price,
            oldPrice: product.oldPrice,
            quantity: Number(it.quantity) || 1
          });
          continue;
        }
        // If not found fall through to inline
      }
      normalized.push({
        productId: pid || 'custom',
        nameAr: it.name?.ar || 'صنف',
        nameEn: it.name?.en || 'Item',
        price: Number(it.price) || 0,
        oldPrice: it.oldPrice != null ? Number(it.oldPrice) : null,
        quantity: Number(it.quantity) || 1
      });
    }

    if (!normalized.length) return res.status(400).json({ ok: false, error: 'NO_ITEMS' });

    const totals = computeTotals(normalized);
    if (totals.grandTotal <= 0) return res.status(400).json({ ok: false, error: 'INVALID_TOTAL' });

    // Create order in DB first (status created)
    const order = await prisma.order.create({
      data: {
        userId,
        status: 'created',
        currency,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
        paymentMethod: 'paypal',
  paymentMeta: { stage: 'init' },
        items: { create: normalized }
      },
      include: { items: true }
    });

    // Request PayPal order using grandTotal
  const accessToken = await getAccessToken();
    const returnUrlBase = process.env.PAYPAL_RETURN_URL || 'http://localhost:5173/checkout/success';
    const cancelUrlBase = process.env.PAYPAL_CANCEL_URL || 'http://localhost:5173/checkout/cancel';
    const returnUrl = `${returnUrlBase}${returnUrlBase.includes('?') ? '&' : '?'}localOrderId=${encodeURIComponent(order.id)}`;
    const cancelUrl = `${cancelUrlBase}${cancelUrlBase.includes('?') ? '&' : '?'}localOrderId=${encodeURIComponent(order.id)}`;

    // Build PayPal order body with full breakdown (items, discount, tax)
    const buildOrderBody = (ccy, orderTotals, lineItems) => {
      const { discount, tax, grandTotal } = orderTotals;
      const paypalItemsRaw = lineItems.slice(0, 100).map(it => ({
        name: (it.nameEn || it.nameAr || 'Item').slice(0, 120) || 'Item',
        quantity: String(it.quantity || 1),
        unit_amount: { currency_code: ccy, value: (Number(it.price) || 0).toFixed(2) }
      }));
      const paypalItems = paypalItemsRaw.filter(i => Number(i.unit_amount.value) > 0);
      const itemsTotal = paypalItems.reduce((s, i) => s + Number(i.unit_amount.value) * Number(i.quantity), 0);
      const effectiveSubtotal = +itemsTotal.toFixed(2);
      const safeDiscount = Math.min(discount || 0, effectiveSubtotal);
      const tentativeGrand = +(effectiveSubtotal - safeDiscount + (tax || 0)).toFixed(2);
      const finalTax = Math.abs(tentativeGrand - grandTotal) > 0.02 ? 0 : (tax || 0);
      const finalGrand = +(effectiveSubtotal - safeDiscount + finalTax).toFixed(2);
      const breakdown = { item_total: { currency_code: ccy, value: effectiveSubtotal.toFixed(2) } };
      if (safeDiscount > 0) breakdown.discount = { currency_code: ccy, value: safeDiscount.toFixed(2) };
      if (finalTax > 0) breakdown.tax_total = { currency_code: ccy, value: finalTax.toFixed(2) };
      return {
        intent: 'CAPTURE',
        purchase_units: [ {
          amount: { currency_code: ccy, value: finalGrand.toFixed(2), breakdown },
          items: paypalItems
        } ],
        application_context: { return_url: returnUrl, cancel_url: cancelUrl }
      };
    };

    let workingCurrency = currency;
    const orderTotals = { subtotal: order.subtotal, discount: order.discount, tax: order.tax, grandTotal: order.grandTotal };
    const lineItems = order.items.map(i => ({ nameEn: i.nameEn, nameAr: i.nameAr, price: i.price, quantity: i.quantity }));
    let orderBody = buildOrderBody(workingCurrency, orderTotals, lineItems);

    const idempotencyKey = String(req.headers['x-idempotency-key'] || `create-${order.id}`).slice(0,64);
    let createRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': idempotencyKey },
      body: JSON.stringify(orderBody)
    });
    let createData = await createRes.json();
    // Optional fallback if currency not supported
    if (!createRes.ok && workingCurrency === 'SAR' && process.env.PAYPAL_FALLBACK_USD !== 'false') {
      const errName = createData?.name || createData?.error || '';
      if (/UNSUPPORTED|CURRENCY|INVALID_AMOUNT/i.test(errName)) {
        // Convert SAR -> USD approximate (1 USD ≈ 3.75 SAR)
        workingCurrency = 'USD';
        const factor = 1/3.75;
        const usdTotals = {
          subtotal: +(orderTotals.subtotal * factor).toFixed(2),
          discount: +(orderTotals.discount * factor).toFixed(2),
          tax: +(orderTotals.tax * factor).toFixed(2),
          grandTotal: +(orderTotals.grandTotal * factor).toFixed(2)
        };
        const usdLineItems = lineItems.map(li => ({ ...li, price: +(li.price * factor).toFixed(2) }));
        orderBody = buildOrderBody(workingCurrency, usdTotals, usdLineItems);
        createRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': idempotencyKey },
          body: JSON.stringify(orderBody)
        });
        createData = await createRes.json();
      }
    }
    if (!createRes.ok) {
      return res.status(502).json({
        ok: false,
        error: 'PAYPAL_CREATE_FAILED',
        message: createData?.message || createData?.error_description || createData?.name || 'PayPal create order failed',
        detail: createData,
        attemptedCurrency: workingCurrency
      });
    }
    const approval = (createData.links || []).find(l => l.rel === 'approve');

    // Update order with PayPal info
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMeta: { stage: 'created', paypal: { create: createData, paypalOrderId: createData.id, currency: workingCurrency } },
        status: 'pending'
      }
    });

    audit({ action: 'order.paypal.create', entity: 'Order', entityId: order.id, userId, meta: { paypalOrderId: createData.id, amount: order.grandTotal } });

  return res.json({ ok: true, localOrderId: order.id, paypalOrderId: createData.id, approvalUrl: approval ? approval.href : null, currency: workingCurrency });
  } catch (err) {
    console.error('create-order error', err);  
    return res.status(500).json({ ok: false, error: 'INTERNAL', message: err.message });
  }
});

// Capture (requires localOrderId for reliable mapping)
router.post('/capture', async (req, res) => {
  try {
    const body = req.body || {};
    const { paypalOrderId, localOrderId } = body;
    if (!localOrderId) return res.status(400).json({ ok: false, error: 'MISSING_LOCAL_ORDER_ID' });
    if (!paypalOrderId) return res.status(400).json({ ok: false, error: 'MISSING_PAYPAL_ORDER_ID' });

    const order = await prisma.order.findUnique({ where: { id: localOrderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

    const accessToken = await getAccessToken();
  const idem = String(req.headers['x-idempotency-key'] || `capture-${localOrderId}`).slice(0,64);
  const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': idem } });
    const captureData = await captureRes.json();
    if (!captureRes.ok) {
      return res.status(502).json({ ok: false, error: 'PAYPAL_CAPTURE_FAILED', detail: captureData });
    }

  const paid = captureData.status === 'COMPLETED' || captureData.status === 'APPROVED';
    const newStatus = paid ? 'paid' : 'processing';
  let existingMeta = order.paymentMeta || {};
  const updatedMeta = { ...existingMeta, paypal: { ...(existingMeta.paypal||{}), capture: captureData, paypalOrderId } };
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        paymentMeta: updatedMeta
      }
    });
  audit({ action: 'order.paypal.capture', entity: 'Order', entityId: order.id, userId: order.userId, meta: { status: newStatus, paypalOrderId } });
  if (paid) { try { await ensureInvoiceForOrder(order.id); } catch {} try { await sendInvoiceWhatsApp(order.id).catch(() => null); } catch {} }

    return res.json({ ok: true, status: newStatus, capture: captureData, orderId: order.id });
  } catch (err) {
    console.error('capture error', err);  
    return res.status(500).json({ ok: false, error: 'INTERNAL', message: err.message });
  }
});

// Refund captured payment for a local order
// Body: { localOrderId, amount?: number, currency?: string }
router.post('/refund', async (req, res) => {
  try {
    const { localOrderId, amount, currency } = req.body || {};
    if (!localOrderId) return res.status(400).json({ ok: false, error: 'MISSING_LOCAL_ORDER_ID' });
    const order = await prisma.order.findUnique({ where: { id: localOrderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    const cap = order?.paymentMeta?.paypal?.capture;
    const captures = cap?.purchase_units?.[0]?.payments?.captures || cap?.captures || [];
    const captureId = Array.isArray(captures) && captures.length ? captures[0].id : null;
    if (!captureId) return res.status(400).json({ ok: false, error: 'NO_CAPTURE_ID' });
    const accessToken = await getAccessToken();
    const idem = String(req.headers['x-idempotency-key'] || `refund-${localOrderId}`).slice(0,64);
    const body = amount ? { amount: { value: Number(amount).toFixed(2), currency_code: (currency || order.currency || 'SAR') } } : {};
    const r = await fetch(`${PAYPAL_API}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': idem },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ ok: false, error: 'PAYPAL_REFUND_FAILED', detail: data });
    // Update order status
    const newStatus = amount && Number(amount) < Number(order.grandTotal) ? 'partially_refunded' : 'refunded';
    const existingMeta = order.paymentMeta || {};
    const updatedMeta = { ...existingMeta, paypal: { ...(existingMeta.paypal||{}), refund: data } };
    await prisma.order.update({ where: { id: order.id }, data: { status: newStatus, paymentMeta: updatedMeta } });
    audit({ action: 'order.paypal.refund', entity: 'Order', entityId: order.id, userId: order.userId, meta: { newStatus, captureId } });
    return res.json({ ok: true, status: newStatus, refund: data });
  } catch (e) {
    console.error('refund error', e);
    return res.status(500).json({ ok: false, error: 'INTERNAL', message: e.message });
  }
});

// Webhook endpoint - PayPal will POST events (ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, etc.)
router.post('/webhook', async (req, res) => {
  try {
    const raw = req.rawBody || JSON.stringify(req.body || {});
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k,v]) => [k.toLowerCase(), v]));
    const verifyResult = await verifyWebhook(raw, headers);
    const event = req.body || {};
    const eventType = event.event_type;
    const paypalOrderId = event.resource?.id || event.resource?.supplementary_data?.related_ids?.order_id || null;
    let linkedOrder = null;
    if (paypalOrderId) {
      // Find local order referencing this PayPal order
      linkedOrder = await prisma.order.findFirst({ where: { paymentMeta: { path: ['paypal','paypalOrderId'], equals: paypalOrderId } } });
      if (!linkedOrder) {
        // fallback search by JSON contains (less efficient)
        linkedOrder = await prisma.order.findFirst({ where: { paymentMeta: { contains: paypalOrderId } } });
      }
    }
    let updates = null;
    if (linkedOrder && eventType) {
      const existingMeta = linkedOrder.paymentMeta || {};
      const paypalMeta = { ...(existingMeta.paypal||{}), webhook: event };
      let newStatus = linkedOrder.status;
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
        newStatus = 'paid';
      } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED' || eventType === 'PAYMENT.CAPTURE.REVERSED') {
        newStatus = 'refunded';
      }
  updates = await prisma.order.update({ where: { id: linkedOrder.id }, data: { status: newStatus, paymentMeta: { ...existingMeta, paypal: paypalMeta } } });
      audit({ action: 'order.paypal.webhook', entity: 'Order', entityId: linkedOrder.id, userId: linkedOrder.userId, meta: { eventType, paypalOrderId, verified: verifyResult.verified } });
  if (newStatus === 'paid') { try { await ensureInvoiceForOrder(linkedOrder.id); } catch {} try { await sendInvoiceWhatsApp(linkedOrder.id).catch(() => null); } catch {} }
    }
    res.json({ ok: true, received: true, eventType, verified: verifyResult.verified, orderUpdated: !!updates });
  } catch (e) {
    console.error('[PayPal webhook] error', e);
    res.status(500).json({ ok: false, error: 'WEBHOOK_ERROR', message: e.message });
  }
});

// Fetch local order (with items) for debugging
router.get('/local/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_FETCH', message: e.message });
  }
});

export default router;

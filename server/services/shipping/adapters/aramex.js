import prisma from '../../../db/client.js';
import crypto from 'crypto';

const provider = 'aramex';

function resolveConfig(cfg = {}) {
  return {
    API_URL: cfg?.aramexApiUrl || process.env.ARAMEX_API_URL || process.env.ARAMEX_API_BASE || null,
    API_KEY: cfg?.aramexApiKey || process.env.ARAMEX_API_KEY || null,
    API_USER: cfg?.aramexApiUser || process.env.ARAMEX_API_USER || null,
    API_PASS: cfg?.aramexApiPass || process.env.ARAMEX_API_PASS || null,
    WEBHOOK_SECRET: cfg?.aramexWebhookSecret || process.env.ARAMEX_WEBHOOK_SECRET || null,
  };
}

async function requestJson(url, opts = {}, cfg = {}) {
  const headers = Object.assign({}, opts.headers || {});
  const C = resolveConfig(cfg);
  if (C.API_KEY) headers['x-api-key'] = C.API_KEY;
  if (C.API_USER && C.API_PASS) headers['authorization'] = 'Basic ' + Buffer.from(`${C.API_USER}:${C.API_PASS}`).toString('base64');
  headers['accept'] = 'application/json';
  const final = Object.assign({}, opts, { headers });
  const res = await fetch(url, final);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, body: text }; }
}

async function createShipment(order, cfg) {
  // If API_URL is configured, call the remote carrier; otherwise fallback to stub.
  const C = resolveConfig(cfg);
  if (C.API_URL) {
    try {
      const url = new URL('/shipments', C.API_URL).toString();
      const payload = {
        orderId: order.id,
        recipient: order.shippingAddress || {},
        parcels: (order.items || []).map(i => ({ qty: i.quantity || 1, description: i.name || i.productId, weightKg: i.weight || 0 })),
        metadata: { createdBy: 'my-store' }
      };
      const r = await requestJson(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } }, C);
      const trackingId = r.body && (r.body.trackingNumber || r.body.waybill || r.body.id) ? (r.body.trackingNumber || r.body.waybill || r.body.id) : `ARX-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      try { if (prisma?.shipment) await prisma.shipment.create({ data: { orderId: order.id, provider, trackingNumber: trackingId, status: 'created', meta: typeof r.body === 'object' ? JSON.stringify(r.body) : String(r.body) } }).catch(() => null); } catch {}
      return { ok: r.ok, provider, trackingId, statusCode: r.status, raw: r.body };
    } catch (e) {
      return { ok: false, provider, error: e.message };
    }
  }
  // Fallback stub
  const trackingId = `ARX-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  try { if (prisma?.shipment) await prisma.shipment.create({ data: { orderId: order.id, provider, trackingNumber: trackingId, status: 'created' } }).catch(() => null); } catch {}
  return { ok: true, provider, trackingId };
}

async function track(trackingId, cfg) {
  const C = resolveConfig(cfg);
  if (C.API_URL) {
    try {
      const url = new URL(`/shipments/${encodeURIComponent(trackingId)}`, C.API_URL).toString();
      const r = await requestJson(url, { method: 'GET' }, C);
      const data = r.body || {};
      return { ok: r.ok, provider, trackingId, status: data.status || data.state || 'unknown', raw: data };
    } catch (e) { return { ok: false, provider, error: e.message }; }
  }
  return { ok: true, provider, trackingId, status: 'in_transit', lastUpdate: new Date().toISOString() };
}

function verifySignature(rawBody, headers, cfg) {
  const C = resolveConfig(cfg);
  if (!C.WEBHOOK_SECRET) return { ok: true, reason: 'no-secret' };
  try {
    const sigHeader = (headers['x-signature'] || headers['x-hub-signature'] || headers['x-aramex-signature'] || headers['signature'] || '').toString();
    if (!sigHeader) return { ok: false, reason: 'missing-signature' };
    // Assume hex HMAC-SHA256
    const h = crypto.createHmac('sha256', C.WEBHOOK_SECRET).update(rawBody).digest('hex');
    const ok = crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sigHeader));
    return { ok, computed: h, provided: sigHeader };
  } catch (e) { return { ok: false, reason: e.message }; }
}

async function handleWebhook(body, headers, rawBody, cfg) {
  // rawBody may be Buffer|string - adapters expect raw for signature verification
  try {
    const verification = verifySignature(rawBody || JSON.stringify(body || {}), headers || {}, cfg);
    if (!verification.ok) return { ok: false, provider, error: 'SIGNATURE_FAILED', detail: verification };
    const payload = body || {};
    const trackingNumber = payload?.trackingNumber || payload?.shipmentId || payload?.waybill || payload?.awb || null;
    const status = payload?.status || payload?.state || payload?.statusCode || 'unknown';
    try {
      if (prisma?.shipment && trackingNumber) {
        await prisma.shipment.updateMany({ where: { trackingNumber }, data: { status, meta: typeof payload === 'object' ? JSON.stringify(payload) : String(payload), updatedAt: new Date() } }).catch(() => null);
      }
    } catch {}
    return { ok: true, provider, trackingNumber, status, verification };
  } catch (e) {
    return { ok: false, provider, error: e.message };
  }
}

export default { provider, createShipment, track, handleWebhook };

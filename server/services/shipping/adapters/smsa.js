import prisma from '../../../db/client.js';
import crypto from 'crypto';

const provider = 'smsa';

function resolveConfig(cfg = {}) {
  return {
    API_URL: cfg?.smsaApiUrl || process.env.SMSA_API_URL || process.env.SMSA_API_BASE || null,
    API_KEY: cfg?.smsaApiKey || process.env.SMSA_API_KEY || null,
    WEBHOOK_SECRET: cfg?.smsaWebhookSecret || process.env.SMSA_WEBHOOK_SECRET || null,
  };
}

async function requestJson(url, opts = {}, cfg = {}) {
  const headers = Object.assign({}, opts.headers || {});
  const C = resolveConfig(cfg);
  if (C.API_KEY) headers['x-api-key'] = C.API_KEY;
  headers['accept'] = 'application/json';
  const final = Object.assign({}, opts, { headers });
  const res = await fetch(url, final);
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, body: JSON.parse(text) }; } catch { return { ok: res.ok, status: res.status, body: text }; }
}

async function createShipment(order, cfg) {
  const C = resolveConfig(cfg);
  if (C.API_URL) {
    try {
      const url = new URL('/createAwb', C.API_URL).toString();
      const payload = { orderId: order.id, recipient: order.shippingAddress || {}, items: order.items || [] };
      const r = await requestJson(url, { method: 'POST', body: JSON.stringify(payload), headers: { 'content-type': 'application/json' } }, C);
      const trackingId = r.body && (r.body.awb || r.body.trackingNumber || r.body.id) ? (r.body.awb || r.body.trackingNumber || r.body.id) : `SMSA-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      try { if (prisma?.shipment) await prisma.shipment.create({ data: { orderId: order.id, provider, trackingNumber: trackingId, status: 'created', meta: typeof r.body === 'object' ? JSON.stringify(r.body) : String(r.body) } }).catch(() => null); } catch {}
      return { ok: r.ok, provider, trackingId, statusCode: r.status, raw: r.body };
    } catch (e) { return { ok: false, provider, error: e.message }; }
  }
  const trackingId = `SMSA-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  try { if (prisma?.shipment) await prisma.shipment.create({ data: { orderId: order.id, provider, trackingNumber: trackingId, status: 'created' } }).catch(() => null); } catch {}
  return { ok: true, provider, trackingId };
}

async function track(trackingId, cfg) {
  const C = resolveConfig(cfg);
  if (C.API_URL) {
    try { const url = new URL(`/track/${encodeURIComponent(trackingId)}`, C.API_URL).toString(); const r = await requestJson(url, { method: 'GET' }, C); return { ok: r.ok, provider, trackingId, status: r.body?.status || 'unknown', raw: r.body }; } catch (e) { return { ok: false, provider, error: e.message }; }
  }
  return { ok: true, provider, trackingId, status: 'unknown', lastUpdate: new Date().toISOString() };
}

function verifySignature(rawBody, headers, cfg) {
  const C = resolveConfig(cfg);
  if (!C.WEBHOOK_SECRET) return { ok: true, reason: 'no-secret' };
  try {
    const sig = (headers['x-signature'] || headers['x-hub-signature'] || headers['signature'] || '').toString();
    if (!sig) return { ok: false, reason: 'missing-signature' };
    const h = crypto.createHmac('sha256', C.WEBHOOK_SECRET).update(rawBody).digest('hex');
    const ok = crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig));
    return { ok, computed: h, provided: sig };
  } catch (e) { return { ok: false, reason: e.message }; }
}

async function handleWebhook(body, headers, rawBody, cfg) {
  try {
    const verification = verifySignature(rawBody || JSON.stringify(body || {}), headers || {}, cfg);
    if (!verification.ok) return { ok: false, provider, error: 'SIGNATURE_FAILED', detail: verification };
    const payload = body || {};
    const trackingNumber = payload?.awb || payload?.tracking || payload?.waybill || null;
    const status = payload?.status || payload?.state || 'unknown';
    try { if (prisma?.shipment && trackingNumber) await prisma.shipment.updateMany({ where: { trackingNumber }, data: { status, meta: typeof payload === 'object' ? JSON.stringify(payload) : String(payload), updatedAt: new Date() } }).catch(() => null); } catch {}
    return { ok: true, provider, trackingNumber, status, verification };
  } catch (e) { return { ok: false, provider, error: e.message }; }
}

export default { provider, createShipment, track, handleWebhook };

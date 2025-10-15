import express from 'express';
import crypto from 'crypto';
import prisma from './db/client.js';
import { audit } from './utils/audit.js';

const router = express.Router();

// Helper to random session id
function makeSession() {
  return 'stc_' + crypto.randomBytes(8).toString('hex');
}

// ENV configuration (sandbox creds)
const STC_BASE = process.env.STC_API_BASE || 'https://sandbox-api.stcpay.com.sa'; // hypothetical base
const STC_MERCHANT_ID = process.env.STC_MERCHANT_ID || '';
const STC_API_KEY = process.env.STC_API_KEY || '';
const STC_API_SECRET = process.env.STC_API_SECRET || '';

function credsConfigured() {
  return STC_MERCHANT_ID && STC_API_KEY && STC_API_SECRET;
}

// Acquire token (simple cache)
let stcTokenCache = { token: null, expiresAt: 0 };
async function getStcToken() {
  if (!credsConfigured()) throw new Error('Missing STC credentials');
  const now = Date.now();
  if (stcTokenCache.token && stcTokenCache.expiresAt > now + 30_000) return stcTokenCache.token;
  // NOTE: The real STC Pay API auth spec may differ; this is a scaffold.
  const resp = await fetch(`${STC_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      merchantId: STC_MERCHANT_ID,
      apiKey: STC_API_KEY,
      apiSecret: STC_API_SECRET
    })
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error('STC auth failed: ' + t);
  }
  const data = await resp.json();
  const ttl = (data.expires_in || 300) * 1000;
  stcTokenCache = { token: data.access_token, expiresAt: Date.now() + ttl };
  return data.access_token;
}

// Diagnostic config route
router.get('/_config', (req, res) => {
  res.json({
    ok: true,
    configured: credsConfigured(),
    merchantIdPreview: STC_MERCHANT_ID ? STC_MERCHANT_ID.slice(0,4) + '...' : null,
    base: STC_BASE
  });
});

// Create STC Pay session (sandbox integration scaffold)
router.post('/create', async (req, res) => {
  try {
    const body = req.body || {};
    const { orderId } = body;
    // Ensure order
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

    let sessionId = makeSession(); // fallback local id
    let stcCreateResponse = null;
    let externalReference = null;
    if (credsConfigured()) {
      try {
        const token = await getStcToken();
        // Real API call placeholder (adjust to real spec)
        const payResp = await fetch(`${STC_BASE}/payments/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            merchantId: STC_MERCHANT_ID,
            amount: order.grandTotal,
            currency: order.currency,
            orderId: order.id,
            callbackUrl: process.env.STC_CALLBACK_URL || 'https://asiaatore-production.up.railway.app/api/pay/stc/webhook'
          })
        });
        stcCreateResponse = await payResp.json();
        if (payResp.ok) {
          sessionId = stcCreateResponse.sessionId || sessionId;
          externalReference = stcCreateResponse.reference || null;
        }
      } catch (ee) {
        // Fallback to local session only
        console.warn('[STC] sandbox create failed, falling back to local simulation:', ee.message);
      }
    }
    const existingMeta = order.paymentMeta || {};
    const meta = { ...existingMeta, stage: 'stc:init', stc: { ...(existingMeta.stc||{}), sessionId, externalReference, create: stcCreateResponse } };
    await prisma.order.update({ where: { id: orderId }, data: { paymentMethod: 'stc', paymentMeta: meta, status: 'pending' } });
    audit({ action: 'order.stc.create', entity: 'Order', entityId: orderId, userId: order.userId, meta: { sessionId, externalReference } });
    res.json({ ok: true, sessionId, externalReference, simulated: !credsConfigured() });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'STC_INIT_FAILED', message: e.message });
  }
});

// Confirm / simulate STC Pay result
router.post('/confirm', async (req, res) => {
  try {
    const body = req.body || {};
    const { orderId, sessionId, success = true } = body;
    if (!orderId || !sessionId) return res.status(400).json({ ok: false, error: 'MISSING_PARAMS' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    const existingMeta = order.paymentMeta || {};
    const storedSession = existingMeta?.stc?.sessionId;
    if (storedSession && storedSession !== sessionId) {
      return res.status(400).json({ ok: false, error: 'SESSION_MISMATCH' });
    }
    const newStatus = success ? 'paid' : 'cancelled';
    const updatedMeta = { ...existingMeta, stage: success ? 'stc:paid' : 'stc:failed', stc: { ...(existingMeta.stc||{}), sessionId, success } };
    await prisma.order.update({ where: { id: orderId }, data: { status: newStatus, paymentMeta: updatedMeta } });
    audit({ action: 'order.stc.confirm', entity: 'Order', entityId: orderId, userId: order.userId, meta: { success, sessionId } });
    res.json({ ok: true, orderId, status: newStatus, sessionId, success });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'STC_CONFIRM_FAILED', message: e.message });
  }
});

// Webhook (sandbox) - receives asynchronous payment status updates
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body || {};
    const sessionId = event.sessionId || event.referenceSession || null;
    const status = event.status || event.paymentStatus || null;
    if (!sessionId) return res.status(400).json({ ok: false, error: 'MISSING_SESSION_ID' });
    // Find order by scanning paymentMeta.stc.sessionId
    const order = await prisma.order.findFirst({ where: { paymentMeta: { contains: sessionId } } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    const existingMeta = order.paymentMeta || {};
    const stcMeta = { ...(existingMeta.stc||{}), webhook: event };
    let newStatus = order.status;
    if (/paid|success|completed/i.test(status || '')) newStatus = 'paid';
    else if (/fail|cancel/i.test(status || '')) newStatus = 'cancelled';
    await prisma.order.update({ where: { id: order.id }, data: { status: newStatus, paymentMeta: { ...existingMeta, stc: stcMeta } } });
    audit({ action: 'order.stc.webhook', entity: 'Order', entityId: order.id, userId: order.userId, meta: { status, sessionId } });
    res.json({ ok: true, status: newStatus });
  } catch (e) {
    console.error('[STC webhook] error', e);
    res.status(500).json({ ok: false, error: 'WEBHOOK_ERROR', message: e.message });
  }
});

export default router;

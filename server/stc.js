import express from 'express';
import crypto from 'crypto';
import prisma from './db/client.js';
import { audit } from './utils/audit.js';
import { ensureInvoiceForOrder } from './utils/invoice.js';
import { deserializePaymentMeta, serializePaymentMeta } from './utils/paymentMeta.js';

const router = express.Router();
// Enforce enablement via settings (best-effort; if DB unavailable, allow in dev)
router.use(async (req, res, next) => {
  try {
    if (req.path === '/_config') return next();
    const setting = await prisma.storeSetting?.findUnique?.({ where: { id: 'singleton' } }).catch(() => null);
    if (setting && (setting.payStcEnabled === 0 || setting.payStcEnabled === false)) {
      return res.status(403).json({ ok: false, error: 'PAYMENT_DISABLED', method: 'stc' });
    }
  } catch {/* ignore and allow */}
  next();
});

// ENV configuration (production creds)
const STC_BASE = process.env.STC_API_BASE || 'https://api.stcpay.com.sa'; // production base
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

  // STC Pay API typically uses API key authentication
  // This is a scaffold - adjust based on real STC Pay API documentation
  const resp = await fetch(`${STC_BASE}/api/v1/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Merchant-ID': STC_MERCHANT_ID,
      'X-API-Key': STC_API_KEY
    },
    body: JSON.stringify({
      secret: STC_API_SECRET
    })
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error('STC auth failed: ' + t);
  }
  const data = await resp.json();
  const ttl = (data.expires_in || 3600) * 1000; // Default 1 hour
  stcTokenCache = { token: data.access_token || data.token, expiresAt: Date.now() + ttl };
  return stcTokenCache.token;
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

// Capture raw body for webhook signature verification
router.use((req, _res, next) => {
  if (req.path !== '/webhook') return next();
  if (req.rawBodyCaptured) return next();
  if (req.readableEnded || req.body) {
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

// Create STC Pay session (sandbox integration scaffold)
router.post('/create', async (req, res) => {
  try {
    const body = req.body || {};
    const { orderId } = body;
    // Ensure order
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, status: true, currency: true, grandTotal: true, shippingAddress: true, paymentMeta: true } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

    const requesterId = req.user?.id || 'guest';
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && order.userId && order.userId !== requesterId) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'Order does not belong to requester' });
    }

    if (!credsConfigured()) {
      return res.status(503).json({ ok: false, error: 'STC_NOT_CONFIGURED', message: 'STC Pay credentials are missing' });
    }

  // Basic idempotency: if the same idem key was used before, return the same session
  const idemKey = String(req.headers?.['x-idempotency-key'] || '').slice(0,64) || null;
    const existingMeta = deserializePaymentMeta(order.paymentMeta) || {};
    const storedAccessKey = existingMeta?.stc?.accessKey || null;
    if ((idemKey && existingMeta?.stc?.idemCreate === idemKey && existingMeta?.stc?.sessionId) || existingMeta?.stc?.sessionId) {
      return res.json({
        ok: true,
        sessionId: existingMeta.stc.sessionId,
        externalReference: existingMeta.stc.externalReference ?? null,
        accessKey: storedAccessKey,
        idempotent: true
      });
    }

    const token = await getStcToken();
    const payResp = await fetch(`${STC_BASE}/api/v1/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Merchant-ID': STC_MERCHANT_ID
      },
      body: JSON.stringify({
        amount: order.grandTotal,
        currency: order.currency || 'SAR',
        orderId: order.id,
        customerMobile: order.shippingAddress?.phone || '',
        callbackUrl: process.env.STC_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:8829'}/api/pay/stc/webhook`,
        successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order.id}/success`,
        failureUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order.id}/failed`
      })
    });

    const stcCreateResponse = await payResp.json().catch(() => ({}));
    if (!payResp.ok || !stcCreateResponse || stcCreateResponse.success === false) {
      const message = stcCreateResponse?.message || stcCreateResponse?.error || 'STC API error';
      return res.status(502).json({ ok: false, error: 'STC_API_ERROR', message, detail: stcCreateResponse });
    }

    const sessionId = stcCreateResponse.data?.sessionId || stcCreateResponse.sessionId;
    const externalReference = stcCreateResponse.data?.reference || stcCreateResponse.reference || null;
    if (!sessionId) {
      return res.status(502).json({ ok: false, error: 'STC_SESSION_MISSING', message: 'STC response did not include a sessionId', detail: stcCreateResponse });
    }
    const accessKey = storedAccessKey || crypto.randomBytes(16).toString('hex');
    const meta = { ...existingMeta, stage: 'stc:init', stc: { ...(existingMeta.stc||{}), sessionId, externalReference, create: stcCreateResponse, accessKey, idemCreate: idemKey || undefined } };
    await prisma.order.update({ where: { id: orderId }, data: { paymentMethod: 'stc', paymentMeta: serializePaymentMeta(meta), status: 'pending' } });
    audit({ action: 'order.stc.create', entity: 'Order', entityId: orderId, userId: order.userId, meta: { sessionId, externalReference } });
    res.json({ ok: true, sessionId, externalReference, accessKey });
  } catch (e) {
    console.error('[STC] create error', e);
    res.status(500).json({ ok: false, error: 'STC_INIT_FAILED', message: e.message });
  }
});

// Confirm / check STC Pay result
router.post('/confirm', async (req, res) => {
  try {
    const body = req.body || {};
    const { orderId, sessionId, accessKey } = body;
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, status: true, paymentMeta: true } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

    if (!credsConfigured()) {
      return res.status(503).json({ ok: false, error: 'STC_NOT_CONFIGURED', message: 'STC Pay credentials are missing' });
    }

    const requesterId = req.user?.id || 'guest';
    const existingMeta = deserializePaymentMeta(order.paymentMeta) || {};
    const storedSession = existingMeta?.stc?.sessionId;
    const storedAccessKey = existingMeta?.stc?.accessKey;
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && order.userId && order.userId !== requesterId) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'Order does not belong to requester' });
    }

    if (!isAdmin) {
      if (!storedAccessKey) {
        return res.status(409).json({ ok: false, error: 'STC_ACCESSKEY_MISSING', message: 'Order missing STC access key; please re-initiate payment' });
      }

      if (!accessKey || accessKey !== storedAccessKey) {
        return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'STC access key mismatch' });
      }
    }

    if (sessionId && storedSession && storedSession !== sessionId) {
      return res.status(400).json({ ok: false, error: 'SESSION_MISMATCH' });
    }

    const idemKey = String(req.headers?.['x-idempotency-key'] || '').slice(0,64) || null;

    // If already finalized, return current status
    if (order.status === 'paid' || order.status === 'cancelled' || order.status === 'failed') {
      return res.json({
        ok: true,
        orderId,
        status: order.status,
        sessionId: storedSession || sessionId,
        idempotent: true
      });
    }

    if (!storedSession && !sessionId) {
      return res.status(400).json({ ok: false, error: 'MISSING_SESSION_ID' });
    }

    const token = await getStcToken();
    const statusResp = await fetch(`${STC_BASE}/api/v1/payments/status/${storedSession || sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Merchant-ID': STC_MERCHANT_ID
      }
    });

    if (!statusResp.ok) {
      const txt = await statusResp.text().catch(() => '');
      return res.status(502).json({ ok: false, error: 'STC_STATUS_FAILED', message: txt || 'Unable to retrieve STC payment status' });
    }

    const statusData = await statusResp.json().catch(() => ({}));
    const apiStatus = statusData.data?.status || statusData.status || statusData.paymentStatus || null;

    let normalized = 'unknown';
    const raw = (apiStatus || '').toString().toLowerCase();
    if (/paid|success|completed|approved|captured/.test(raw)) normalized = 'paid';
    else if (/fail|cancel|cancelled|rejected|declined/.test(raw)) normalized = 'cancelled';
    else if (/pending|processing|created|initiated|waiting/.test(raw)) normalized = 'processing';

    let newStatus = order.status;
    let stage = existingMeta?.stage || 'stc:status';
    let shouldCreateInvoice = false;

    if (normalized === 'paid') {
      newStatus = 'paid';
      stage = 'stc:paid';
      shouldCreateInvoice = true;
    } else if (normalized === 'cancelled') {
      newStatus = 'cancelled';
      stage = 'stc:failed';
    } else if (normalized === 'processing') {
      newStatus = order.status === 'paid' ? order.status : 'processing';
      stage = 'stc:processing';
    } else {
      stage = 'stc:unknown';
    }

    const updatedMeta = {
      ...existingMeta,
      stage,
      stc: {
        ...(existingMeta.stc || {}),
        sessionId: storedSession || sessionId,
        apiStatus,
        statusPayload: statusData,
        confirmedAt: new Date().toISOString(),
        idemConfirm: idemKey || undefined,
        lastStatusCheckAt: new Date().toISOString()
      }
    };

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus, paymentMeta: serializePaymentMeta(updatedMeta) }
    });

    audit({
      action: 'order.stc.confirm',
      entity: 'Order',
      entityId: orderId,
      userId: order.userId,
      meta: { sessionId: storedSession || sessionId, apiStatus, normalized }
    });

    if (shouldCreateInvoice) {
      try {
        await ensureInvoiceForOrder(orderId);
      } catch (e) {
        console.warn('[STC] Failed to create invoice:', e.message);
      }
    }

    res.json({
      ok: true,
      orderId,
      status: newStatus,
      sessionId: storedSession || sessionId,
      apiStatus,
      normalized
    });
  } catch (e) {
    console.error('[STC] confirm error', e);
    res.status(500).json({ ok: false, error: 'STC_CONFIRM_FAILED', message: e.message });
  }
});

// Webhook (production) - receives asynchronous payment status updates
router.post('/webhook', async (req, res) => {
  try {
    const raw = req.rawBody || JSON.stringify(req.body || {});
    const event = req.body || {};

    // Verify signature using HMAC-SHA256 with STC_API_SECRET
    const providedSig = String(req.headers?.['x-stc-signature'] || req.headers?.['signature'] || '').trim();
    let verified = false;
    if (providedSig && STC_API_SECRET) {
      try {
        const hmac = crypto.createHmac('sha256', STC_API_SECRET);
        hmac.update(raw, 'utf8');
        const digest = hmac.digest('hex');
        verified = crypto.timingSafeEqual(Buffer.from(providedSig, 'hex'), Buffer.from(digest, 'hex'));
      } catch (e) {
        console.warn('[STC] Signature verification failed:', e.message);
      }
    }

    const sessionId = event.sessionId || event.data?.sessionId || event.reference || null;
    const status = event.status || event.data?.status || event.paymentStatus || null;
    const reference = event.reference || event.data?.reference || null;
    const amount = event.amount || event.data?.amount || null;

    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'MISSING_SESSION_ID' });
    }

    // Find order by sessionId in paymentMeta
    let order = await prisma.order.findFirst({
      where: {
        OR: [
          { paymentMeta: { path: ['index', 'stc', 'sessionId'], equals: sessionId } },
          { paymentMeta: { path: ['index', 'stc', 'externalReference'], equals: reference } },
          { paymentMeta: { path: ['stc', 'sessionId'], equals: sessionId } },
          { paymentMeta: { path: ['stc', 'externalReference'], equals: reference } }
        ]
      }
    });

    if (!order && (sessionId || reference)) {
      const candidates = await prisma.order.findMany({
        where: { paymentMethod: 'stc' },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: { id: true, userId: true, status: true, paymentMeta: true }
      }).catch(() => []);
      for (const candidate of candidates) {
        const meta = deserializePaymentMeta(candidate.paymentMeta);
        if (!meta) continue;
        const matchesSession = sessionId && meta?.stc?.sessionId === sessionId;
        const matchesReference = reference && meta?.stc?.externalReference === reference;
        if (matchesSession || matchesReference) {
          order = candidate;
          break;
        }
      }
    }

    if (!order) {
      return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    }

    const existingMeta = deserializePaymentMeta(order.paymentMeta) || {};
    const stcMeta = {
      ...(existingMeta.stc || {}),
      webhook: event,
      webhookVerified: verified,
      webhookReceivedAt: new Date().toISOString()
    };

    let newStatus = order.status;
    let shouldCreateInvoice = false;

    if (/paid|success|completed|approved/i.test(status || '')) {
      newStatus = 'paid';
      shouldCreateInvoice = true;
    } else if (/fail|cancel|cancelled|rejected/i.test(status || '')) {
      newStatus = 'cancelled';
    } else if (/pending|processing/i.test(status || '')) {
      newStatus = 'processing';
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        paymentMeta: serializePaymentMeta({ ...existingMeta, stc: stcMeta })
      }
    });

    audit({
      action: 'order.stc.webhook',
      entity: 'Order',
      entityId: order.id,
      userId: order.userId,
      meta: { status, sessionId, reference, amount, verified }
    });

    if (shouldCreateInvoice) {
      try {
        await ensureInvoiceForOrder(order.id);
      } catch (e) {
        console.warn('[STC] Failed to create invoice:', e.message);
      }
    }

    res.json({ ok: true, status: newStatus, verified, orderId: order.id });
  } catch (e) {
    console.error('[STC webhook] error', e);
    res.status(500).json({ ok: false, error: 'WEBHOOK_ERROR', message: e.message });
  }
});

export default router;

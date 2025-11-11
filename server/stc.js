import express from 'express';
import crypto from 'crypto';
import prisma from './db/client.js';
import { audit } from './utils/audit.js';
import { ensureInvoiceForOrder } from './utils/invoice.js';

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

// Helper to random session id
function makeSession() {
  return 'stc_' + crypto.randomBytes(8).toString('hex');
}

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
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

  // Basic idempotency: if the same idem key was used before, return the same session
  const idemKey = String(req.headers['x-idempotency-key'] || '').slice(0,64) || null;
  let sessionId = makeSession(); // fallback local id
    let stcCreateResponse = null;
    let externalReference = null;
    if (credsConfigured()) {
      try {
        const token = await getStcToken();
        // Real STC Pay API call - adjust based on actual API documentation
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
            callbackUrl: process.env.STC_CALLBACK_URL || `${process.env.BASE_URL || 'http://localhost:4000'}/api/pay/stc/webhook`,
            successUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order.id}/success`,
            failureUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order.id}/failed`
          })
        });
        stcCreateResponse = await payResp.json();
        if (payResp.ok && stcCreateResponse.success) {
          sessionId = stcCreateResponse.data?.sessionId || stcCreateResponse.sessionId || sessionId;
          externalReference = stcCreateResponse.data?.reference || stcCreateResponse.reference || null;
        } else {
          throw new Error(stcCreateResponse.message || 'STC API error');
        }
      } catch (ee) {
        // Fallback to local session only
        console.warn('[STC] Production API failed, falling back to local simulation:', ee.message);
      }
    }
    const existingMeta = order.paymentMeta || {};
    // Idempotent replay check
    if (idemKey && existingMeta?.stc?.idemCreate === idemKey && existingMeta?.stc?.sessionId) {
      return res.json({ ok: true, sessionId: existingMeta.stc.sessionId, externalReference: existingMeta.stc.externalReference ?? null, idempotent: true, simulated: !credsConfigured() });
    }
    const meta = { ...existingMeta, stage: 'stc:init', stc: { ...(existingMeta.stc||{}), sessionId, externalReference, create: stcCreateResponse, idemCreate: idemKey || undefined } };
    await prisma.order.update({ where: { id: orderId }, data: { paymentMethod: 'stc', paymentMeta: meta, status: 'pending' } });
    audit({ action: 'order.stc.create', entity: 'Order', entityId: orderId, userId: order.userId, meta: { sessionId, externalReference } });
    res.json({ ok: true, sessionId, externalReference, simulated: !credsConfigured() });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'STC_INIT_FAILED', message: e.message });
  }
});

// Confirm / check STC Pay result
router.post('/confirm', async (req, res) => {
  try {
    const body = req.body || {};
    const { orderId, sessionId, success = true } = body;
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

    const existingMeta = order.paymentMeta || {};
    const storedSession = existingMeta?.stc?.sessionId;

    if (sessionId && storedSession && storedSession !== sessionId) {
      return res.status(400).json({ ok: false, error: 'SESSION_MISMATCH' });
    }

    const idemKey = String(req.headers['x-idempotency-key'] || '').slice(0,64) || null;

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

    // Try to check status from STC API if configured
    let apiStatus = null;
    if (credsConfigured() && storedSession) {
      try {
        const token = await getStcToken();
        const statusResp = await fetch(`${STC_BASE}/api/v1/payments/status/${storedSession}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Merchant-ID': STC_MERCHANT_ID
          }
        });

        if (statusResp.ok) {
          const statusData = await statusResp.json();
          apiStatus = statusData.data?.status || statusData.status;
        }
      } catch (e) {
        console.warn('[STC] Status check failed:', e.message);
      }
    }

    // Determine final status
    let newStatus = order.status;
    let shouldCreateInvoice = false;

    if (apiStatus) {
      // Use API status if available
      if (/paid|success|completed|approved/i.test(apiStatus)) {
        newStatus = 'paid';
        shouldCreateInvoice = true;
      } else if (/fail|cancel|cancelled|rejected/i.test(apiStatus)) {
        newStatus = 'cancelled';
      } else if (/pending|processing/i.test(apiStatus)) {
        newStatus = 'processing';
      }
    } else {
      // Fallback to provided success parameter (for testing/manual confirmation)
      newStatus = success ? 'paid' : 'cancelled';
      if (success) shouldCreateInvoice = true;
    }

    const updatedMeta = {
      ...existingMeta,
      stage: success ? 'stc:paid' : 'stc:failed',
      stc: {
        ...(existingMeta.stc || {}),
        sessionId: storedSession || sessionId,
        success,
        apiStatus,
        confirmedAt: new Date().toISOString(),
        idemConfirm: idemKey || undefined
      }
    };

    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus, paymentMeta: updatedMeta }
    });

    audit({
      action: 'order.stc.confirm',
      entity: 'Order',
      entityId: orderId,
      userId: order.userId,
      meta: { success, sessionId, apiStatus }
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
      success
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'STC_CONFIRM_FAILED', message: e.message });
  }
});

// Webhook (production) - receives asynchronous payment status updates
router.post('/webhook', async (req, res) => {
  try {
    const raw = req.rawBody || JSON.stringify(req.body || {});
    const event = req.body || {};

    // Verify signature using HMAC-SHA256 with STC_API_SECRET
    const providedSig = String(req.headers['x-stc-signature'] || req.headers['signature'] || '').trim();
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
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { paymentMeta: { path: ['stc', 'sessionId'], equals: sessionId } },
          { paymentMeta: { path: ['stc', 'externalReference'], equals: reference } }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    }

    const existingMeta = order.paymentMeta || {};
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
        paymentMeta: { ...existingMeta, stc: stcMeta }
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

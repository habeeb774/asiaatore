import express from 'express';
import prisma from '../db/client.js';
import aramex from '../services/shipping/adapters/aramex.js';
import smsa from '../services/shipping/adapters/smsa.js';
import { broadcast } from '../utils/realtimeHub.js';

const router = express.Router();

const ADAPTERS = { aramex, smsa };

// Raw body capture middleware for webhooks (buffers body for signature verification)
const rawBodyParser = (req, res, next) => {
  let data = [];
  req.on('data', (chunk) => { data.push(chunk); });
  req.on('end', () => {
    const buf = Buffer.concat(data || []);
    req.rawBody = buf;
    // try parse JSON if content-type indicates JSON
    try {
      const ct = (req.headers['content-type'] || '').toLowerCase();
      if (ct.includes('application/json')) {
        try { req.body = buf.length ? JSON.parse(buf.toString('utf8')) : {}; } catch { req.body = {}; }
      } else if (ct.includes('application/x-www-form-urlencoded')) {
        // Simple urlencoded parse
        const str = buf.toString('utf8');
        req.body = Object.fromEntries(new URLSearchParams(str));
      } else {
        req.body = buf.toString('utf8');
      }
    } catch (e) { req.body = {}; }
    next();
  });
  req.on('error', next);
};

function buildProviderCfg(setting, provider) {
  if (!setting) return {};
  if (provider === 'aramex') {
    return {
      aramexApiUrl: setting.aramexApiUrl,
      aramexApiKey: setting.aramexApiKey,
      aramexApiUser: setting.aramexApiUser,
      aramexApiPass: setting.aramexApiPass,
      aramexWebhookSecret: setting.aramexWebhookSecret,
    };
  }
  if (provider === 'smsa') {
    return {
      smsaApiUrl: setting.smsaApiUrl,
      smsaApiKey: setting.smsaApiKey,
      smsaWebhookSecret: setting.smsaWebhookSecret,
    };
  }
  return {};
}

// Generic webhook endpoint for shipping provider callbacks
// POST /api/shipping/webhook/:provider
router.post('/webhook/:provider', rawBodyParser, async (req, res) => {
  try {
    const provider = String(req.params.provider || '').toLowerCase();
    const adapter = ADAPTERS[provider];
    if (!adapter) return res.status(404).json({ ok: false, error: 'UNKNOWN_PROVIDER' });
    // Load settings (best-effort) and pass cfg into adapter verification
    let setting = null;
    try {
      if (process.env.ALLOW_INVALID_DB !== 'true') {
        const rows = await prisma.$queryRaw`SELECT * FROM StoreSetting WHERE id = 'singleton' LIMIT 1`;
        setting = Array.isArray(rows) && rows.length ? rows[0] : null;
      }
    } catch {}
    const cfg = buildProviderCfg(setting, provider);
    // Pass rawBody (Buffer) to adapter for signature verification
    const result = await adapter.handleWebhook(req.body || {}, req.headers || {}, req.rawBody, cfg);
    try { broadcast('shipping.update', { provider, ...result }); } catch (e) {}
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'WEBHOOK_FAILED', message: e.message });
  }
});

// Simple health/ping for webhook receiver
router.get('/webhook/:provider/ping', (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  if (!ADAPTERS[provider]) return res.status(404).json({ ok: false, error: 'UNKNOWN_PROVIDER' });
  res.json({ ok: true, provider, ready: true });
});

export default router;

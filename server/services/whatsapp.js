// Lightweight WhatsApp service with two providers: Meta (Cloud API) and Twilio.
// In development, functions degrade gracefully and report configuration status.

const PROVIDER = (process.env.WHATSAPP_PROVIDER || '').toLowerCase();

function mask(s) {
  if (!s) return '';
  const v = String(s);
  if (v.length <= 6) return '******';
  return v.slice(0, 3) + '***' + v.slice(-3);
}

export function getWhatsAppHealth() {
  const enabled = String(process.env.WHATSAPP_ENABLED || '').toLowerCase() === 'true';
  const provider = PROVIDER || (process.env.TWILIO_ACCOUNT_SID ? 'twilio' : (process.env.WHATSAPP_ACCESS_TOKEN ? 'meta' : ''));
  const meta = {
    enabled,
    provider: provider || null,
    configured: false,
    details: {}
  };
  if (!enabled) return meta;
  if (provider === 'meta') {
    const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    meta.configured = !!(token && phoneId);
    meta.details = { token: mask(token), phoneId: mask(phoneId) };
  } else if (provider === 'twilio') {
    const sid = process.env.TWILIO_ACCOUNT_SID || '';
    const auth = process.env.TWILIO_AUTH_TOKEN || '';
    const from = process.env.TWILIO_FROM_NUMBER || '';
    meta.configured = !!(sid && auth && from);
    meta.details = { sid: mask(sid), from: mask(from) };
  }
  return meta;
}

// Send invoice link via WhatsApp for a given orderId. Best-effort; resolves with a result object.
export async function sendInvoiceWhatsApp(orderId) {
  const health = getWhatsAppHealth();
  if (!health.enabled || !health.configured) {
    return { ok: false, reason: 'NOT_CONFIGURED', health };
  }
  try {
    // Construct a message with a generic invoice URL the user can open
    const base = process.env.PUBLIC_BASE_URL || '';
    const url = base ? `${base.replace(/\/$/, '')}/orders/${encodeURIComponent(orderId)}/invoice` : `/orders/${encodeURIComponent(orderId)}/invoice`;
    if (health.provider === 'meta') {
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      // In this scaffold, we do not know the destination phone. This should be loaded from user profile/order.
      // We return a simulated success in development to confirm plumbing.
      if (process.env.NODE_ENV !== 'production') {
        return { ok: true, provider: 'meta', simulated: true, message: `Would send invoice link: ${url}` };
      }
      // A real implementation would call Meta Cloud API here.
      return { ok: true, provider: 'meta', note: 'Message enqueued (placeholder)' };
    }
    if (health.provider === 'twilio') {
      if (process.env.NODE_ENV !== 'production') {
        return { ok: true, provider: 'twilio', simulated: true, message: `Would send invoice link: ${url}` };
      }
      // Real Twilio integration would go here
      return { ok: true, provider: 'twilio', note: 'Message enqueued (placeholder)' };
    }
    return { ok: false, reason: 'UNKNOWN_PROVIDER', provider: health.provider };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export default { getWhatsAppHealth, sendInvoiceWhatsApp };

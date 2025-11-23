// Email utility with real provider support (SendGrid) and fallback to simulation
import 'dotenv/config';

let provider = null;
let providerName = 'simulate';

if (process.env.SENDGRID_API_KEY) {
  try {
    const sgMail = await import('@sendgrid/mail');
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
    provider = sgMail.default;
    providerName = 'sendgrid';
  } catch (e) {
    // Use a logger if available, otherwise console.warn
    if (global.appLogger) global.appLogger.warn({ err: e }, '[EMAIL] Failed to init SendGrid, falling back to simulate');
    else console.warn('[EMAIL] Failed to init SendGrid, falling back to simulate:', e.message);
  }
}

export async function sendEmail({ to, subject, text, html }) {
  if (provider && providerName === 'sendgrid') {
    const from = process.env.SENDGRID_FROM || process.env.EMAIL_FROM || 'no-reply@localhost';
    try {
      await provider.send({ to, from, subject, text, html });
      return { ok: true, provider: providerName };
    } catch (e) {
      // Use a logger if available, otherwise console.error
      if (global.appLogger) global.appLogger.error({ err: e.response?.body || e }, '[EMAIL] SendGrid error');
      else console.error('[EMAIL] SendGrid error:', e.response?.body || e.message);
      return { ok: false, error: e.message, provider: providerName };
    }
  }
  // Fallback simulate
  // Use a logger if available, otherwise console.log
  if (global.appLogger) global.appLogger.info({ to, subject, text: text?.slice(0, 160), hasHtml: !!html }, '[EMAIL:simulate]');
  else console.log('[EMAIL:simulate]', { to, subject, text: text?.slice(0, 160), hasHtml: !!html });
  return { ok: true, provider: 'simulate' };
}

export default { sendEmail };

// SMS utility with provider support (Twilio) and fallback to simulation
import 'dotenv/config';

let twilioClient = null;
let providerName = 'simulate';

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilioMod = await import('twilio');
    twilioClient = twilioMod.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    providerName = 'twilio';
  } catch (e) {
     
    console.warn('[SMS] Failed to init Twilio, falling back to simulate:', e.message);
  }
}

export async function sendSms({ to, message }) {
  if (twilioClient && providerName === 'twilio') {
    const from = process.env.TWILIO_FROM || process.env.SMS_FROM;
    if (!from) {
       
      console.warn('[SMS] TWILIO_FROM missing, using simulate');
    } else {
      try {
        await twilioClient.messages.create({ body: message, from, to });
        return { ok: true, provider: providerName };
      } catch (e) {
         
        console.error('[SMS] Twilio error:', e.message);
        return { ok: false, error: e.message, provider: providerName };
      }
    }
  }
  // Fallback simulate
   
  console.log('[SMS:simulate]', { to, message: String(message).slice(0, 160) });
  return { ok: true, provider: 'simulate' };
}

export default { sendSms };

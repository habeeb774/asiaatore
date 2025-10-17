import prisma from '../db/client.js';
// Detect presence of certain fields/models in the connected database's Prisma DMMF.
// This module runs once at startup and exports simple booleans used across the app.

let HAS_DELETED_AT = false;
let HAS_SESSION_MODEL = false;
let HAS_AUTH_TOKEN_MODEL = false;

async function detect() {
  try {
    // Prisma exposes DMMF via _dmmf on the generated client. Access carefully.
    const dmmf = prisma._dmmf?.modelMap || (prisma._dmmf && prisma._dmmf.datamodel) || null;
    if (dmmf && typeof dmmf === 'object') {
      // modelMap is present in newer prisma clients
      const models = prisma._dmmf.modelMap ? Object.keys(prisma._dmmf.modelMap) : prisma._dmmf.datamodel?.models?.map(m => m.name) || [];
      const hasModel = name => models.includes(name);

      HAS_SESSION_MODEL = hasModel('Session') || hasModel('session');
      HAS_AUTH_TOKEN_MODEL = hasModel('AuthToken') || hasModel('authToken') || hasModel('Auth_Token');

      // Check a few core models for deletedAt field
      const modelNamesToCheck = ['Product', 'Order', 'Address', 'Chat', 'ChatMessage'];
      for (const mn of modelNamesToCheck) {
        const mm = prisma._dmmf.modelMap ? prisma._dmmf.modelMap[mn] : null;
        if (mm && mm.fields && mm.fields.some(f => f.name === 'deletedAt')) {
          HAS_DELETED_AT = true;
          break;
        }
      }
    }
  } catch (e) {
    // Ignore — feature detection is best-effort. Leave flags false.
    // Avoid crashing startup for detection failures.
  }
}

// Kick off detection in background (non-blocking). Callers can import booleans but
// should be resilient to them being false initially. For deterministic behavior,
// server startup can `await import('./features.js')` if desired.
detect();

export { HAS_DELETED_AT, HAS_SESSION_MODEL, HAS_AUTH_TOKEN_MODEL };

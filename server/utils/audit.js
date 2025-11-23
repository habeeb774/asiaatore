import prisma from '../db/client.js';

export async function audit({ action, entity, entityId, userId, meta }) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId || null,
        userId: userId || null,
        meta: meta || null
      }
    });
  } catch (e) {
    // Use a logger if available, otherwise console.warn
    if (global.appLogger) global.appLogger.warn({ err: e }, 'Audit log failed');
    else console.warn('Audit log failed:', e.message);
  }
}

export default { audit };

// Best-effort Prisma middleware to implement soft-delete semantics.
// This module does NOT import the Prisma client directly to avoid circular imports.
// Instead it exports a function that accepts a prisma instance and registers a $use middleware.
export async function initSoftDelete(prisma) {
  if (!prisma || typeof prisma.$use !== 'function') return;

  // Discover models that have a `deletedAt` field using DMMF
  const modelMap = prisma._dmmf?.modelMap || {};
  const modelsWithDeletedAt = Object.keys(modelMap).filter(mn => {
    try {
      const m = modelMap[mn];
      return Array.isArray(m.fields) && m.fields.some(f => f.name === 'deletedAt');
    } catch { return false; }
  });
  if (!modelsWithDeletedAt.length) return;

  // Register middleware
  prisma.$use(async (params, next) => {
    try {
      const model = params.model;
      if (!model || !modelsWithDeletedAt.includes(model)) return next(params);

      // Convert deletes into soft-deletes
      if (params.action === 'delete') {
        // delete -> update (set deletedAt)
        params.action = 'update';
        params.args = params.args || {};
        params.args.data = { ...(params.args.data || {}), deletedAt: new Date() };
        return next(params);
      }
      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        params.args = params.args || {};
        params.args.data = { ...(params.args.data || {}), deletedAt: new Date() };
        return next(params);
      }

      // For read operations, inject deletedAt: null into where clauses when not explicitly filtering
      const readActions = new Set(['findMany','findFirst','findUnique','count','aggregate']);
      if (readActions.has(params.action)) {
        params.args = params.args || {};
        // For findUnique, Prisma expects a unique where; we only augment if there is already a where object
        if (params.args.where && typeof params.args.where === 'object') {
          // If caller already filters deletedAt explicitly, leave it alone
          if (!Object.prototype.hasOwnProperty.call(params.args.where, 'deletedAt')) {
            params.args.where = { ...params.args.where, deletedAt: null };
          }
        }
      }

      return next(params);
    } catch (e) {
      // On middleware error, log minimally but don't crash the app
      try { console.warn('[SoftDeleteMiddleware] Error in middleware:', e && e.message ? e.message : e); } catch {}
      return next(params);
    }
  });
}

export default { initSoftDelete };
import prisma from './client.js';

// Soft-delete middleware for Prisma client.
// - Intercepts delete/deleteMany and converts them to update/updateMany setting deletedAt = new Date()
// - Intercepts find/findMany/count/aggregate to add deletedAt: null to where clauses when model supports it
// This is best-effort and uses the generated client's DMMF to detect fields.
function modelHasDeletedAt(modelName) {
  try {
    const map = prisma._dmmf?.modelMap;
    if (!map) return false;
    const m = map[modelName];
    if (!m || !Array.isArray(m.fields)) return false;
    return m.fields.some(f => f.name === 'deletedAt');
  } catch {
    return false;
  }
}

// Register middleware once
if (prisma && typeof prisma.$use === 'function') {
  prisma.$use(async (params, next) => {
    try {
      const model = params.model;
      const action = params.action;

      // Convert delete -> update (soft-delete) when model has deletedAt
      if (model && (action === 'delete' || action === 'deleteMany')) {
        if (modelHasDeletedAt(model)) {
          if (action === 'delete') {
            params.action = 'update';
            params.args = params.args || {};
            params.args['data'] = { ...(params.args.data || {}), deletedAt: new Date() };
            return next(params);
          }
          if (action === 'deleteMany') {
            params.action = 'updateMany';
            params.args = params.args || {};
            params.args['data'] = { ...(params.args.data || {}), deletedAt: new Date() };
            return next(params);
          }
        }
      }

      // For read-like actions, inject deletedAt: null into where if supported
      const readActions = new Set(['findMany','findUnique','findFirst','count','aggregate','findRaw']);
      if (model && readActions.has(action) && modelHasDeletedAt(model)) {
        params.args = params.args || {};
        const where = params.args.where || {};
        // Do not overwrite explicit deletedAt filter
        if (where && where.deletedAt === undefined) {
          params.args.where = { ...where, deletedAt: null };
        }
      }
    } catch (e) {
      // best-effort; fall-through to next
    }
    return next(params);
  });
}

export default {};

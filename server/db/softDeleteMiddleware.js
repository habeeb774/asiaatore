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

  const hasDeletedAt = (model) => modelsWithDeletedAt.includes(model);

  // Register middleware
  prisma.$use(async (params, next) => {
    const model = params.model;
    const action = params.action;
    const supportsSoftDelete = !!model && hasDeletedAt(model);

    try {
      // Convert deletes into soft-deletes when supported
      if (supportsSoftDelete && (action === 'delete' || action === 'deleteMany')) {
        const original = { ...params };
        try {
          const now = new Date();
          if (action === 'delete') {
            params.action = 'update';
            params.args = params.args || {};
            params.args.data = { ...(params.args.data || {}), deletedAt: now };
          } else {
            params.action = 'updateMany';
            params.args = params.args || {};
            params.args.data = { ...(params.args.data || {}), deletedAt: now };
          }
          return await next(params);
        } catch (e) {
          // If the update fails due to unknown field, fall back to real delete to avoid crashes
          const msg = (e && e.message) || '';
          if (/Unknown arg `deletedAt`|Unknown field `deletedAt`|Argument deletedAt/i.test(msg)) {
            return await next(original);
          }
          throw e;
        }
      }

      // For read operations, inject deletedAt: null into where clauses when supported
      const readActions = new Set(['findMany','findFirst','findUnique','count','aggregate']);
      if (supportsSoftDelete && readActions.has(action)) {
        params.args = params.args || {};
        const where = params.args.where;
        if (where && typeof where === 'object' && !Object.prototype.hasOwnProperty.call(where, 'deletedAt')) {
          // Try with deletedAt: null; if Prisma complains, retry without it
          const attempt = { ...params, args: { ...params.args, where: { ...where, deletedAt: null } } };
          try {
            return await next(attempt);
          } catch (e) {
            const msg = (e && e.message) || '';
            if (/Unknown arg `deletedAt`|Unknown field `deletedAt`|Argument deletedAt/i.test(msg)) {
              return await next(params);
            }
            throw e;
          }
        }
      }

      return await next(params);
    } catch (e) {
      // On middleware error, log minimally but don't crash the app
      try { console.warn('[SoftDeleteMiddleware] Error in middleware:', e && e.message ? e.message : e); } catch {}
      return next(params);
    }
  });
}

export default { initSoftDelete };

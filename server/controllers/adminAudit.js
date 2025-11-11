import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/admin/audit?entity=&action=&page=&pageSize=
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { entity, action, page, pageSize, userId } = req.query;
    const where = {};
    if (entity) where.entity = String(entity);
    if (action) where.action = String(action);
    if (userId) where.userId = String(userId);
    const pg = page ? Math.max(1, parseInt(page, 10)) : 1;
    const ps = pageSize ? Math.min(200, Math.max(1, parseInt(pageSize, 10))) : 30;
    const skip = (pg - 1) * ps;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: ps })
    ]);
    res.json({
      ok: true,
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        userId: l.userId,
        meta: l.meta,
        createdAt: l.createdAt
      })),
      page: pg,
      pageSize: ps,
      total,
      totalPages: Math.ceil(total / ps)
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_AUDIT_LIST', message: e.message });
  }
});

export default router;

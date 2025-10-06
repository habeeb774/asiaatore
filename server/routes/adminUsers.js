import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';

// /api/admin/users
// Basic user management: list users, update role, deactivate (soft via active flag added ad-hoc), delete.
// NOTE: 'active' field not in schema; we emulate by using meta in AuditLog if deactivated.

const router = Router();

// List users (id, email, role, createdAt)
router.get('/', requireAdmin, async (_req, res) => {
  try {
    const list = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ ok: true, users: list.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name, createdAt: u.createdAt })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_USERS_LIST', message: e.message });
  }
});

// Update user role or name
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};
    if (body.role) data.role = body.role; // trust admin input
    if (body.name !== undefined) data.name = body.name;
    if (!Object.keys(data).length) return res.status(400).json({ ok: false, error: 'NO_FIELDS' });
    const updated = await prisma.user.update({ where: { id: req.params.id }, data });
    audit({ action: 'user.update', entity: 'User', entityId: updated.id, userId: req.user?.id, meta: { role: updated.role } });
    res.json({ ok: true, user: { id: updated.id, email: updated.email, role: updated.role, name: updated.name } });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.status(400).json({ ok: false, error: 'FAILED_USER_UPDATE', message: e.message });
  }
});

// Delete user (danger):
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const removed = await prisma.user.delete({ where: { id: req.params.id } });
    audit({ action: 'user.delete', entity: 'User', entityId: removed.id, userId: req.user?.id });
    res.json({ ok: true, removed: { id: removed.id, email: removed.email } });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.status(400).json({ ok: false, error: 'FAILED_USER_DELETE', message: e.message });
  }
});

export default router;

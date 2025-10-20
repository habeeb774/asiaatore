import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utils/email.js';
import { randomToken, sha256 } from '../utils/jwt.js';

// /api/admin/users
// Basic user management: list users, update role, deactivate (soft via active flag added ad-hoc), delete.
// NOTE: 'active' field not in schema; we emulate by using meta in AuditLog if deactivated.

const router = Router();
const ALLOW_DEGRADED = process.env.ALLOW_INVALID_DB === 'true';
const isDbDisabled = (e) => ALLOW_DEGRADED || (e && (e.code === 'DB_DISABLED' || /Degraded mode: DB disabled/i.test(e.message || '')));

// Create user (admin-only)
router.post('/', requireAdmin, async (req, res) => {
  try {
  let { email, password, name, phone, role, sendInvite } = req.body || {};
  if (!email) return res.status(400).json({ ok:false, error:'MISSING_EMAIL' });
  email = String(email).trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return res.status(400).json({ ok:false, error:'INVALID_EMAIL' });
    role = role || 'user';
  const allowedRoles = new Set(['user','admin','seller','delivery']);
    if (!allowedRoles.has(role)) return res.status(400).json({ ok:false, error:'INVALID_ROLE' });
    if (!sendInvite) {
      if (!password) return res.status(400).json({ ok:false, error:'MISSING_PASSWORD' });
      if (String(password).length < 6) return res.status(400).json({ ok:false, error:'WEAK_PASSWORD', message:'Password must be at least 6 characters' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ ok:false, error:'EMAIL_EXISTS' });
    const rawPass = password && String(password).length ? String(password) : randomToken(16);
    const hashed = await bcrypt.hash(rawPass, 12);
    const created = await prisma.user.create({ data: { email, password: hashed, role, name: name || null, phone: phone ? String(phone).trim() : null } });
    // Optional: send invite email (password reset link)
    let inviteSent = false;
    try {
      if (sendInvite) {
        const token = randomToken(24);
        const hash = sha256(token);
        const expiresAt = new Date(Date.now() + 1000*60*60*24); // 24h
        await prisma.authToken.create({ data: { userId: created.id, type: 'password_reset', tokenHash: hash, expiresAt } });
        const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.headers.host}`;
        const url = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(created.email)}`;
        await sendEmail({ to: created.email, subject: 'Account created', text: `Your account has been created. Set password: ${url}` });
        inviteSent = true;
      }
    } catch (e) {
      // Don't fail creation if invite email fails; just log in non-prod
      if (process.env.DEBUG_ERRORS === 'true' || process.env.NODE_ENV !== 'production') {
        console.warn('[ADMIN_USERS] sendInvite failed:', e.message);
      }
    }
    audit({ action:'user.create', entity:'User', entityId: created.id, userId: req.user?.id, meta: { role, inviteSent } });
    return res.status(201).json({ ok:true, inviteSent, user: { id: created.id, email: created.email, role: created.role, name: created.name, phone: created.phone, createdAt: created.createdAt } });
  } catch (e) {
    if (isDbDisabled(e)) return res.status(503).json({ ok:false, error:'DB_DISABLED', message:'User management is unavailable in degraded mode' });
    if (e?.code === 'P2002') {
      // Unique constraint failed (likely phone)
      return res.status(409).json({ ok:false, error:'UNIQUE_CONSTRAINT', message: e.meta?.target?.join?.(',') || 'Unique field exists' });
    }
    return res.status(500).json({ ok:false, error:'USER_CREATE_FAILED', message: e.message });
  }
});

// List users (paginated) (id, email, role, createdAt, active computed from AuditLog)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20));
    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      prisma.user.count()
    ]);
    const ids = list.map(u => u.id);
    let flags = {};
    if (ids.length) {
      const logs = await prisma.auditLog.findMany({
        where: { entity: 'User', entityId: { in: ids }, action: { in: ['user.activate','user.deactivate'] } },
        orderBy: { createdAt: 'desc' }
      });
      for (const l of logs) {
        if (flags[l.entityId] !== undefined) continue; // take latest only
        flags[l.entityId] = l.action === 'user.deactivate' ? false : true;
      }
    }
    const users = list.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name, phone: u.phone || null, createdAt: u.createdAt, active: flags[u.id] ?? true }));
    res.json({ ok: true, users, total, page, pageSize });
  } catch (e) {
    if (isDbDisabled(e)) return res.json({ ok: true, users: [], total: 0, page: 1, pageSize: Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 20)) });
    res.status(500).json({ ok: false, error: 'FAILED_USERS_LIST', message: e.message });
  }
});

// Update user role or name (and phone)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};
    if (body.role) {
      const allowedRoles = new Set(['user','admin','seller','delivery']);
      if (!allowedRoles.has(body.role)) return res.status(400).json({ ok: false, error: 'INVALID_ROLE' });
      data.role = body.role;
    }
    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
    if (!Object.keys(data).length) return res.status(400).json({ ok: false, error: 'NO_FIELDS' });
    const updated = await prisma.user.update({ where: { id: req.params.id }, data });
    audit({ action: 'user.update', entity: 'User', entityId: updated.id, userId: req.user?.id, meta: { role: updated.role } });
    res.json({ ok: true, user: { id: updated.id, email: updated.email, role: updated.role, name: updated.name } });
  } catch (e) {
    if (isDbDisabled(e)) return res.status(503).json({ ok: false, error: 'DB_DISABLED', message: 'User update unavailable in degraded mode' });
    // Prisma: record not found
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    // Unique constraint violation (phone/email)
    if (e.code === 'P2002') return res.status(409).json({ ok: false, error: 'UNIQUE_CONSTRAINT', message: e.meta?.target?.join?.(',') || 'Unique field exists' });
    // Fallback
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
    if (isDbDisabled(e)) return res.status(503).json({ ok: false, error: 'DB_DISABLED', message: 'User delete unavailable in degraded mode' });
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.status(400).json({ ok: false, error: 'FAILED_USER_DELETE', message: e.message });
  }
});

// Activate/deactivate user (soft) by AuditLog marker
router.post('/:id/activate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // validate existence
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    await audit({ action:'user.activate', entity:'User', entityId:id, userId:req.user?.id });
    res.json({ ok:true, active:true });
  } catch (e) { res.status(500).json({ ok:false, error:'ACTIVATE_FAILED', message:e.message }); }
});

router.post('/:id/deactivate', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    await audit({ action:'user.deactivate', entity:'User', entityId:id, userId:req.user?.id });
    res.json({ ok:true, active:false });
  } catch (e) { res.status(500).json({ ok:false, error:'DEACTIVATE_FAILED', message:e.message }); }
});

export default router;

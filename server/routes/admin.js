import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import prisma from '../db/client.js';
import bcrypt from 'bcryptjs';
import { audit } from '../utils/audit.js';
import { sendEmail } from '../utils/email.js';
import { randomToken, sha256 } from '../utils/jwt.js';

const router = Router();

// Admin: Sales statistics
router.get('/sales-stats', requireAdmin, async (req, res) => {
  const totalSales = await prisma.order.aggregate({
    _sum: { grandTotal: true }
  });
  const totalOrders = await prisma.order.count();
  const totalSellers = await prisma.seller.count();
  res.json({
    totalSales: totalSales._sum.grandTotal,
    // commissionAmount is computed in-memory per order where applicable; not persisted in DB
    // To avoid schema mismatch, report 0 for now (or compute via business rules if needed)
    totalCommission: 0,
    totalOrders,
    totalSellers,
  });
});

// List all users (with pagination)
router.get('/users', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const skip = (page - 1) * pageSize;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      }
    }),
    prisma.user.count()
  ]);
  res.json({ users, total, page, pageSize });
});

// Create user (fallback for admin panel)
router.post('/users', requireAdmin, async (req, res) => {
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
      if (String(password).length < 6) return res.status(400).json({ ok:false, error:'WEAK_PASSWORD' });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ ok:false, error:'EMAIL_EXISTS' });
    const rawPass = password && String(password).length ? String(password) : randomToken(16);
    const hashed = await bcrypt.hash(rawPass, 12);
    const created = await prisma.user.create({ data: { email, password: hashed, role, name: name || null, phone: phone ? String(phone).trim() : null } });
    audit({ action:'user.create', entity:'User', entityId: created.id, userId: req.user?.id, meta: { role } });
    try {
      let inviteSent = false;
      if (sendInvite) {
        const token = randomToken(24);
        const hash = sha256(token);
        const expiresAt = new Date(Date.now() + 1000*60*60*24);
        await prisma.authToken.create({ data: { userId: created.id, type: 'password_reset', tokenHash: hash, expiresAt } });
        const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.headers.host}`;
        const url = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(created.email)}`;
        await sendEmail({ to: created.email, subject: 'Account created', text: `Set password: ${url}` });
        inviteSent = true;
      }
    } catch (e) { if (process.env.DEBUG_ERRORS === 'true') console.warn('[ADMIN] invite failed', e.message); }
    return res.status(201).json({ ok:true, inviteSent, user: { id: created.id, email: created.email, role: created.role, name: created.name, phone: created.phone, createdAt: created.createdAt } });
  } catch (e) {
    return res.status(500).json({ ok:false, error:'USER_CREATE_FAILED', message: e.message });
  }
});

// Get a single user by ID
router.get('/users/:id', requireAdmin, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update a user (role, name, phone)
router.patch('/users/:id', requireAdmin, async (req, res) => {
  const { role, name, phone } = req.body || {};
  const id = req.params.id;
  const before = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, phone: true, createdAt: true, updatedAt: true }
  });
  if (!before) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });

  const data = {
    ...(typeof role !== 'undefined' && role && { role }),
    ...(typeof name !== 'undefined' && { name }),
    ...(typeof phone !== 'undefined' && { phone }),
  };
  if (!Object.keys(data).length) return res.status(400).json({ ok: false, error: 'NO_CHANGES' });

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, phone: true, createdAt: true, updatedAt: true }
  });

  try {
    const changedFields = [];
    if (typeof data.role !== 'undefined' && before.role !== updated.role) changedFields.push('role');
    if (typeof data.name !== 'undefined' && before.name !== updated.name) changedFields.push('name');
    if (typeof data.phone !== 'undefined' && before.phone !== updated.phone) changedFields.push('phone');
    await audit({
      action: 'user.update',
      entity: 'User',
      entityId: id,
      userId: req.user?.id,
      meta: {
        changedFields,
        before: { role: before.role, name: before.name, phone: before.phone },
        after: { role: updated.role, name: updated.name, phone: updated.phone }
      }
    });
  } catch (_) { /* noop */ }

  res.json(updated);
});

// Delete a user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  const id = req.params.id;
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, role: true } });
  if (!existing) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
  await prisma.user.delete({ where: { id } });
  try {
    await audit({ action: 'user.delete', entity: 'User', entityId: id, userId: req.user?.id, meta: { email: existing.email, role: existing.role } });
  } catch (_) { /* noop */ }
  res.json({ ok: true });
});

export default router;
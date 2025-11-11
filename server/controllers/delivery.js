import express from 'express';
import prisma from '../db/client.js';
import { audit } from '../utils/audit.js';
import { broadcast } from '../utils/realtimeHub.js';
import { attachUser } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = express.Router();
// Detect degraded/invalid DB mode from env flags exposed by server/index.js conditions
const ALLOW_DEGRADED = process.env.ALLOW_INVALID_DB === 'true';
router.use(attachUser);

// Helpers
const asJson = (o) => JSON.parse(JSON.stringify(o));
const orderSummarySelect = {
  id: true,
  status: true,
  deliveryStatus: true,
  grandTotal: true,
  userId: true,
  deliveryDriverId: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  outForDeliveryAt: true,
  deliveredAt: true,
  failedAt: true,
  deliveryDurationSec: true,
};
const buildDeliveryEventPayload = (order) => ({
  orderId: order.id,
  deliveryStatus: order.deliveryStatus,
  acceptedAt: order.acceptedAt || null,
  outForDeliveryAt: order.outForDeliveryAt || null,
  deliveredAt: order.deliveredAt || null,
  failedAt: order.failedAt || null,
  updatedAt: order.updatedAt || null,
  deliveryDurationSec: order.deliveryDurationSec ?? null,
});
const safeFileName = (name) => (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
// Proof-of-delivery upload setup
const proofDir = path.join(process.cwd(), 'uploads', 'delivery-proofs');
try { fs.mkdirSync(proofDir, { recursive: true }); } catch {}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, proofDir),
  filename: (req, file, cb) => {
    const id = req.params?.id || 'order';
    cb(null, `${id}_${Date.now()}_${safeFileName(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB cap

// List orders assigned to the current delivery driver (or unassigned pool if query=pool)
router.get('/orders', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!['delivery', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'FORBIDDEN', required: 'delivery' });
    }
    // Degraded mode: avoid hard crash if DB is unavailable
    if (!prisma?.order) {
      return res.json({ ok: true, orders: [] });
    }
    const { status, pool } = req.query || {};
    const where = {};
    if (pool === '1' || pool === 'true') {
      Object.assign(where, { deliveryStatus: 'unassigned' });
    } else {
      Object.assign(where, { deliveryDriverId: user.role === 'delivery' ? user.id : undefined });
    }
    if (status) where.deliveryStatus = status;
    const orders = await prisma.order.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: orderSummarySelect
    });
    res.json({ ok: true, orders: asJson(orders) });
  } catch (e) {
    if (ALLOW_DEGRADED) return res.json({ ok: true, orders: [] });
    res.status(500).json({ error: 'DELIVERY_LIST_FAILED', message: e.message });
  }
});

// Aliases to satisfy /api/delivery API spec in the request
// GET /orders/assigned — list orders assigned to current driver
router.get('/orders/assigned', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!['delivery','admin'].includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    if (!prisma?.order) {
      return res.json({ ok: true, orders: [] });
    }
    const orders = await prisma.order.findMany({
      where: { deliveryDriverId: user.role === 'delivery' ? user.id : undefined },
      orderBy: { updatedAt: 'desc' },
      select: orderSummarySelect
    });
    res.json({ ok: true, orders: asJson(orders) });
  } catch (e) {
    if (ALLOW_DEGRADED) return res.json({ ok: true, orders: [] });
    res.status(500).json({ error: 'DELIVERY_ASSIGNED_FAILED', message: e.message });
  }
});

// GET /orders/history — list completed/failed orders for current driver (or specified driverId for admins)
router.get('/orders/history', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!['delivery', 'admin'].includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    if (!prisma?.order) {
      return res.json({ ok: true, orders: [] });
    }

    const allowedStatuses = new Set(['delivered', 'failed', 'canceled']);
    let statuses = Array.from(allowedStatuses);
    if (req.query?.status) {
      statuses = String(req.query.status)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => allowedStatuses.has(s));
      if (!statuses.length) statuses = Array.from(allowedStatuses);
    }

    const limit = Math.min(200, Math.max(1, parseInt(req.query?.limit, 10) || 100));
    const driverId = user.role === 'admin' && req.query?.driverId ? String(req.query.driverId) : user.id;

    const orders = await prisma.order.findMany({
      where: {
        deliveryDriverId: driverId,
        deliveryStatus: { in: statuses },
      },
      orderBy: [{ deliveredAt: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      select: orderSummarySelect,
    });

    res.json({ ok: true, orders: asJson(orders) });
  } catch (e) {
    if (ALLOW_DEGRADED) return res.json({ ok: true, orders: [] });
    res.status(500).json({ error: 'DELIVERY_HISTORY_FAILED', message: e.message });
  }
});

// Get a single assigned order (ensure the driver owns it or admin)
router.get('/orders/:id', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!['delivery', 'admin'].includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    const id = req.params.id;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
    res.json({ ok: true, order: asJson(order) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_GET_FAILED', message: e.message });
  }
});

// Claim an unassigned order (accept assignment)
router.post('/orders/:id/accept', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (user.role !== 'delivery' && user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    const id = req.params.id;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
  const assignedToCaller = order.deliveryStatus === 'assigned' && order.deliveryDriverId === user.id;
  if (order.deliveryStatus !== 'unassigned' && !assignedToCaller) return res.status(400).json({ error: 'ALREADY_ASSIGNED' });
    const now = new Date();
    const updated = await prisma.order.update({
      where: { id },
      data: {
        deliveryDriverId: assignedToCaller ? order.deliveryDriverId : user.id,
        deliveryStatus: 'accepted',
        acceptedAt: order.acceptedAt || now,
      },
      select: orderSummarySelect,
    });
    await audit({ action: 'DELIVERY_ACCEPT', entity: 'Order', entityId: id, userId: user.id, meta: { prev: order.deliveryStatus, next: 'accepted', at: new Date().toISOString(), loc: order.deliveryLocation || null } });
    broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
    broadcast('delivery.assigned', { order: asJson(updated) }, (c) => c.role === 'admin' || c.userId === updated.deliveryDriverId);
    res.json({ ok: true, order: asJson(updated) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_ACCEPT_FAILED', message: e.message });
  }
});

// Release / reject an assigned order before it starts
router.post('/orders/:id/reject', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (user.role !== 'delivery' && user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    const id = req.params.id;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    const isDriver = order.deliveryDriverId && order.deliveryDriverId === user.id;
    if (!isDriver && user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    if (!['assigned', 'accepted'].includes(order.deliveryStatus)) {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Cannot reject this delivery stage.' });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: {
        deliveryDriverId: null,
        deliveryStatus: 'unassigned',
        acceptedAt: null,
        outForDeliveryAt: null,
      },
      select: orderSummarySelect,
    });
    await audit({ action: 'DELIVERY_REJECT', entity: 'Order', entityId: id, userId: user.id, meta: { prev: order.deliveryStatus, next: 'unassigned' } });
    broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
    broadcast('delivery.released', { order: asJson(updated) }, (c) => c.role === 'admin');
    res.json({ ok: true, order: asJson(updated) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_REJECT_FAILED', message: e.message });
  }
});

// Start delivery (out for delivery)
router.post('/orders/:id/start', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
  const now = new Date();
  const updated = await prisma.order.update({ where: { id }, data: { deliveryStatus: 'out_for_delivery', outForDeliveryAt: now, acceptedAt: order.acceptedAt || now }, select: orderSummarySelect });
    await audit({ action: 'DELIVERY_START', entity: 'Order', entityId: id, userId: user.id, meta: { prev: order.deliveryStatus, next: 'out_for_delivery', at: new Date().toISOString(), loc: order.deliveryLocation || null } });
  broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
  res.json({ ok: true, order: asJson(updated) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_START_FAILED', message: e.message });
  }
});

// Complete delivery
router.post('/orders/:id/complete', upload.single('proof'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const { note } = req.body || {};
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
    const file = req.file || null;
    const proofUrl = file ? `/uploads/delivery-proofs/${file.filename}` : null;
    const now = new Date();
    // derive duration if outForDeliveryAt exists
    let durationSec = null;
    if (order.outForDeliveryAt) {
      durationSec = Math.max(0, Math.round((now.getTime() - new Date(order.outForDeliveryAt).getTime()) / 1000));
    }
    const updated = await prisma.order.update({ where: { id }, data: { deliveryStatus: 'delivered', deliveredAt: now, deliveryLocation: order.deliveryLocation, deliveryDurationSec: durationSec }, select: orderSummarySelect });
    await audit({ action: 'DELIVERY_COMPLETE', entity: 'Order', entityId: id, userId: user.id, meta: { note, proof: proofUrl, at: new Date().toISOString(), loc: order.deliveryLocation || null } });
    // Record confirmation record if proof present
    try {
      await prisma.deliveryConfirmation.create({ data: { orderId: id, driverId: user.id, method: proofUrl ? 'photo' : 'other', photoUrl: proofUrl, note: note || null } });
    } catch {}
  broadcast('delivery.updated', { ...buildDeliveryEventPayload(updated), proof: proofUrl }, (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
  res.json({ ok: true, order: asJson(updated), proof: proofUrl });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_COMPLETE_FAILED', message: e.message });
  }
});

// Report failed delivery attempt
router.post('/orders/:id/fail', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const { reason } = req.body || {};
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
  const updated = await prisma.order.update({ where: { id }, data: { deliveryStatus: 'failed', failedAt: new Date() }, select: orderSummarySelect });
    await audit({ action: 'DELIVERY_FAIL', entity: 'Order', entityId: id, userId: user.id, meta: { reason, at: new Date().toISOString(), loc: order.deliveryLocation || null } });
  broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
  res.json({ ok: true, order: asJson(updated) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_FAIL_FAILED', message: e.message });
  }
});

// Location update (lat/lng optional data shape)
router.post('/orders/:id/location', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const { lat, lng, accuracy, heading, speed } = req.body || {};
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
  const loc = { lat, lng, accuracy, heading, speed, at: new Date().toISOString() };
    // Persist on order
  const updated = await prisma.order.update({ where: { id }, data: { deliveryLocation: loc } });
    // Also persist on driver's profile
    try {
      await prisma.deliveryProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, online: true, lastKnownLocation: loc, lastSeenAt: new Date() },
        update: { online: true, lastKnownLocation: loc, lastSeenAt: new Date() }
      });
    } catch {}
  broadcast('delivery.location', { orderId: id, location: updated.deliveryLocation }, (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
  res.json({ ok: true, orderId: id, deliveryLocation: updated.deliveryLocation });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_LOCATION_FAILED', message: e.message });
  }
});

// Alias: POST /location/update with body { orderId, lat, lng, ... }
router.post('/location/update', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const { orderId, lat, lng, accuracy, heading, speed } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'MISSING_ORDER_ID' });
    req.params.id = orderId;
    req.body = { lat, lng, accuracy, heading, speed };
    return router.handle({ ...req, method: 'POST', url: `/orders/${orderId}/location` }, res);
  } catch (e) {
    res.status(500).json({ error: 'LOCATION_ALIAS_FAILED', message: e.message });
  }
});

// PATCH /orders/:id/status { status }
router.patch('/orders/:id/status', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'MISSING_STATUS' });
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
    const patch = { deliveryStatus: status };
    if (status === 'accepted') patch.acceptedAt = new Date();
    if (status === 'out_for_delivery') patch.outForDeliveryAt = new Date();
    if (status === 'delivered') {
      const now = new Date();
      patch.deliveredAt = now;
      if (order.outForDeliveryAt) {
        patch.deliveryDurationSec = Math.max(0, Math.round((now.getTime() - new Date(order.outForDeliveryAt).getTime()) / 1000));
      }
    }
    if (status === 'failed') patch.failedAt = new Date();
  const updated = await prisma.order.update({ where: { id }, data: patch, select: orderSummarySelect });
    await audit({ action: 'DELIVERY_STATUS_PATCH', entity: 'Order', entityId: id, userId: user.id, meta: { prev: order.deliveryStatus, next: status } });
  broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
    res.json({ ok: true, order: asJson(updated) });
  } catch (e) {
    res.status(400).json({ error: 'DELIVERY_STATUS_PATCH_FAILED', message: e.message });
  }
});

// OTP: generate a short code and store its hash
router.post('/orders/:id/otp/generate', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    // deactivate existing
    try { await prisma.deliveryOtp.updateMany({ where: { orderId: id, active: true }, data: { active: false } }); } catch {}
    await prisma.deliveryOtp.create({ data: { orderId: id, userId: order.userId, codeHash, expiresAt, active: true } });
    await audit({ action: 'DELIVERY_OTP_GENERATE', entity: 'Order', entityId: id, userId: user.id, meta: { expiresAt: expiresAt.toISOString() } });
    // Return masked hint for debugging in dev only
    const hint = process.env.NODE_ENV !== 'production' ? code : undefined;
    res.json({ ok: true, expiresAt, hint });
  } catch (e) {
    res.status(400).json({ error: 'OTP_GENERATE_FAILED', message: e.message });
  }
});

// OTP: confirm by code from customer
router.post('/orders/:id/otp/confirm', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'MISSING_CODE' });
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
    const now = new Date();
    const rec = await prisma.deliveryOtp.findFirst({ where: { orderId: id, active: true, expiresAt: { gt: now } }, orderBy: { createdAt: 'desc' } });
    if (!rec) return res.status(400).json({ error: 'OTP_NOT_FOUND' });
    const hash = crypto.createHash('sha256').update(String(code)).digest('hex');
    if (hash !== rec.codeHash) return res.status(400).json({ error: 'OTP_INVALID' });
    // Mark consumed + inactive
    await prisma.deliveryOtp.update({ where: { id: rec.id }, data: { active: false, consumedAt: now } });
    // Create confirmation record
    await prisma.deliveryConfirmation.create({ data: { orderId: id, driverId: user.id, method: 'otp', otpVerifiedAt: now, otpLast4: String(code).slice(-4) } });
    // Mark order delivered (if not already)
    let durationSec = null;
    if (order.outForDeliveryAt) {
      durationSec = Math.max(0, Math.round((now.getTime() - new Date(order.outForDeliveryAt).getTime()) / 1000));
    }
  const updated = await prisma.order.update({ where: { id }, data: { deliveryStatus: 'delivered', deliveredAt: now, deliveryDurationSec: durationSec }, select: orderSummarySelect });
  broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
    res.json({ ok: true, order: asJson(updated) });
  } catch (e) {
    res.status(400).json({ error: 'OTP_CONFIRM_FAILED', message: e.message });
  }
});

// Signature upload
router.post('/orders/:id/signature', upload.single('signature'), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    const id = req.params.id;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
    if (user.role !== 'admin' && order.deliveryDriverId !== user.id) return res.status(403).json({ error: 'FORBIDDEN' });
    const file = req.file || null;
    if (!file) return res.status(400).json({ error: 'MISSING_SIGNATURE' });
    const signatureUrl = `/uploads/delivery-proofs/${file.filename}`;
    await prisma.deliveryConfirmation.create({ data: { orderId: id, driverId: user.id, method: 'signature', signatureUrl } });
    const now = new Date();
  const updated = await prisma.order.update({ where: { id }, data: { deliveryStatus: 'delivered', deliveredAt: now }, select: orderSummarySelect });
  broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === order.userId || c.userId === user.id);
  res.json({ ok: true, order: asJson(updated), signatureUrl });
  } catch (e) {
    res.status(400).json({ error: 'SIGNATURE_UPLOAD_FAILED', message: e.message });
  }
});

// Get my delivery profile (driver)
router.get('/me/profile', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!['delivery', 'admin'].includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    // If the generated Prisma client doesn't yet include DeliveryProfile (due to generate issues), fall back to raw SQL
    let prof = null;
    if (prisma.deliveryProfile) {
      prof = await prisma.deliveryProfile.findUnique({ where: { userId: user.id } });
    } else {
      try {
        const rows = await prisma.$queryRaw`
          SELECT id, userId, online, vehicleType, licensePlate, lastKnownLocation, lastSeenAt, createdAt, updatedAt
          FROM DeliveryProfile WHERE userId = ${user.id} LIMIT 1`;
        prof = Array.isArray(rows) && rows.length ? rows[0] : null;
      } catch (e) {
        return res.status(503).json({ ok: false, error: 'PROFILE_MODEL_UNAVAILABLE', message: 'DeliveryProfile not available yet. Try again after DB sync.', detail: e.message });
      }
    }
    // Compute derived status: offline / available / busy
    const online = !!(prof && (prof.online === true || prof.online === 1));
    let activeCount = 0;
    try {
      activeCount = await prisma.order.count({ where: { deliveryDriverId: user.id, deliveryStatus: { in: ['accepted','out_for_delivery'] } } });
    } catch {
      try {
        const rows = await prisma.$queryRaw`SELECT COUNT(*) as c FROM \\\n+          \
          \`Order\` WHERE deliveryDriverId = ${user.id} AND deliveryStatus IN ('accepted','out_for_delivery')`;
        activeCount = Array.isArray(rows) && rows.length ? Number(rows[0]?.c || 0) : 0;
      } catch { activeCount = 0; }
    }
    const status = online ? (activeCount > 0 ? 'busy' : 'available') : 'offline';
    res.json({ ok: true, profile: prof ? { ...prof, status } : { status: 'offline' } });
  } catch (e) { res.status(500).json({ ok: false, error: 'PROFILE_GET_FAILED', message: e.message }); }
});

// Update my delivery profile (driver)
router.patch('/me/profile', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'UNAUTHENTICATED' });
    if (!['delivery', 'admin'].includes(user.role)) return res.status(403).json({ error: 'FORBIDDEN' });
    const { online, vehicleType, licensePlate, status } = req.body || {};
    // Map status -> online when provided
    const onlineFromStatus = typeof status === 'string' ? (status !== 'offline') : undefined;
    let prof = null;
    if (prisma.deliveryProfile) {
      prof = await prisma.deliveryProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, online: onlineFromStatus == null ? !!online : !!onlineFromStatus, vehicleType: vehicleType || null, licensePlate: licensePlate || null, lastSeenAt: new Date() },
        update: { online: (onlineFromStatus == null ? (online == null ? undefined : !!online) : !!onlineFromStatus), vehicleType, licensePlate, lastSeenAt: new Date() }
      });
    } else {
      // Raw SQL fallback (MySQL): insert or update by unique userId
      try {
        const now = new Date();
        const onBool = onlineFromStatus == null ? (online == null ? null : (!!online)) : !!onlineFromStatus;
        const on = onBool == null ? null : (onBool ? 1 : 0);
        // Create row if missing
        await prisma.$executeRaw`
          INSERT INTO DeliveryProfile (userId, online, vehicleType, licensePlate, lastSeenAt, createdAt, updatedAt)
          VALUES (${user.id}, ${on ?? 0}, ${vehicleType || null}, ${licensePlate || null}, ${now}, ${now}, ${now})
          ON DUPLICATE KEY UPDATE
            online = VALUES(online),
            vehicleType = VALUES(vehicleType),
            licensePlate = VALUES(licensePlate),
            lastSeenAt = VALUES(lastSeenAt),
            updatedAt = VALUES(updatedAt)`;
        const rows = await prisma.$queryRaw`
          SELECT id, userId, online, vehicleType, licensePlate, lastKnownLocation, lastSeenAt, createdAt, updatedAt
          FROM DeliveryProfile WHERE userId = ${user.id} LIMIT 1`;
        prof = Array.isArray(rows) && rows.length ? rows[0] : null;
      } catch (e) {
        return res.status(400).json({ ok: false, error: 'PROFILE_UPDATE_FAILED', message: e.message });
      }
    }
    // Derive status for response
    const onlineFinal = !!(prof && (prof.online === true || prof.online === 1));
    let activeCount = 0;
    try {
      activeCount = await prisma.order.count({ where: { deliveryDriverId: user.id, deliveryStatus: { in: ['accepted','out_for_delivery'] } } });
    } catch {
	  try { const rows = await prisma.$queryRaw`SELECT COUNT(*) as c FROM \`Order\` WHERE deliveryDriverId = ${user.id} AND deliveryStatus IN ('accepted','out_for_delivery')`; activeCount = Array.isArray(rows)&&rows.length? Number(rows[0]?.c||0) : 0; } catch { activeCount = 0; }
    }
    const derivedStatus = onlineFinal ? (activeCount > 0 ? 'busy' : 'available') : 'offline';
    res.json({ ok: true, profile: prof ? { ...prof, status: derivedStatus } : { status: 'offline' } });
  } catch (e) { res.status(400).json({ ok: false, error: 'PROFILE_UPDATE_FAILED', message: e.message }); }
});

// Admin: list online drivers with last location
router.get('/drivers/online', async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    if (prisma.deliveryProfile) {
      const list = await prisma.deliveryProfile.findMany({ where: { online: true }, include: { user: { select: { id: true, email: true, name: true } } }, orderBy: { updatedAt: 'desc' } });
      return res.json({ ok: true, drivers: list });
    }
    // Raw SQL fallback join to include minimal user info
    const rows = await prisma.$queryRaw`
      SELECT dp.id, dp.userId, dp.online, dp.vehicleType, dp.licensePlate, dp.lastKnownLocation, dp.lastSeenAt, dp.createdAt, dp.updatedAt,
             u.id AS user_id, u.email AS user_email, u.name AS user_name
      FROM DeliveryProfile dp
      INNER JOIN User u ON u.id = dp.userId
      WHERE dp.online = 1
      ORDER BY dp.updatedAt DESC`;
    const drivers = (Array.isArray(rows) ? rows : []).map(r => ({
      id: r.id,
      userId: r.userId,
      online: !!r.online,
      vehicleType: r.vehicleType,
      licensePlate: r.licensePlate,
      lastKnownLocation: r.lastKnownLocation,
      lastSeenAt: r.lastSeenAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: { id: r.user_id, email: r.user_email, name: r.user_name }
    }));
    res.json({ ok: true, drivers });
  } catch (e) { res.status(500).json({ ok: false, error: 'DRIVERS_LIST_FAILED', message: e.message }); }
});

// Admin: bulk assign or unassign delivery driver for a set of orders
// POST /api/delivery/assign/bulk { ids: string[], driverId: string, status?: 'assigned'|'accepted' }
router.post('/assign/bulk', async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    const { ids, driverId, status } = req.body || {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'INVALID_IDS' });
    if (!driverId || typeof driverId !== 'string') return res.status(400).json({ error: 'INVALID_DRIVER' });
    const nextStatus = typeof status === 'string' && status.trim() ? status.trim() : 'assigned';
    // Update many
    await prisma.order.updateMany({ where: { id: { in: ids.map(String) } }, data: { deliveryDriverId: driverId, deliveryStatus: nextStatus, acceptedAt: nextStatus === 'accepted' ? new Date() : undefined } });
    const list = await prisma.order.findMany({ where: { id: { in: ids.map(String) } }, select: orderSummarySelect });
    // Audit and notify
    try {
      for (const o of list) {
        await audit({ action: 'DELIVERY_BULK_ASSIGN', entity: 'Order', entityId: o.id, userId: user.id, meta: { driverId, status: nextStatus } });
        broadcast('delivery.updated', buildDeliveryEventPayload(o), (c) => c.role === 'admin' || c.userId === o.userId || c.userId === driverId);
      }
    } catch {}
    res.json({ ok: true, count: list.length, orders: list.map(asJson) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_BULK_ASSIGN_FAILED', message: e.message });
  }
});

// Admin: auto-assign from unassigned pool to least-busy online drivers
// POST /api/delivery/assign/auto { limit?: number }
router.post('/assign/auto', async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'admin') return res.status(403).json({ error: 'FORBIDDEN' });
    const limit = Math.min(200, Math.max(1, parseInt(req.body?.limit || '20', 10)));
    // Get online drivers
    const drivers = await prisma.deliveryProfile.findMany({ where: { online: true }, select: { userId: true } });
    if (!drivers.length) return res.status(400).json({ error: 'NO_ONLINE_DRIVERS' });
    // Get active counts
    const countsRaw = await prisma.order.groupBy({ by: ['deliveryDriverId'], _count: { _all: true }, where: { deliveryDriverId: { not: null }, deliveryStatus: { in: ['accepted','out_for_delivery'] } } }).catch(() => []);
    const counts = new Map(countsRaw.map(r => [r.deliveryDriverId, r._count?._all || 0]));
    // Sort least busy first
    const pool = drivers.map(d => ({ userId: d.userId, load: counts.get(d.userId) || 0 })).sort((a,b) => a.load - b.load);
    if (!pool.length) return res.status(400).json({ error: 'NO_DRIVERS' });
    // Fetch unassigned orders
    const unassigned = await prisma.order.findMany({ where: { deliveryStatus: 'unassigned' }, orderBy: { createdAt: 'asc' }, take: limit, select: { id: true, userId: true } });
    if (!unassigned.length) return res.json({ ok: true, assigned: [] });
    const assigned = [];
    let idx = 0;
    for (const o of unassigned) {
      const d = pool[idx % pool.length];
      try {
        const updated = await prisma.order.update({ where: { id: o.id }, data: { deliveryDriverId: d.userId, deliveryStatus: 'assigned' }, select: orderSummarySelect });
        assigned.push(updated);
        await audit({ action: 'DELIVERY_AUTO_ASSIGN', entity: 'Order', entityId: o.id, userId: user.id, meta: { driverId: d.userId } });
        broadcast('delivery.updated', buildDeliveryEventPayload(updated), (c) => c.role === 'admin' || c.userId === updated.userId || c.userId === d.userId);
      } catch {}
      idx++;
    }
    res.json({ ok: true, count: assigned.length, orders: assigned.map(asJson) });
  } catch (e) {
    res.status(500).json({ error: 'DELIVERY_AUTO_ASSIGN_FAILED', message: e.message });
  }
});

export default router;

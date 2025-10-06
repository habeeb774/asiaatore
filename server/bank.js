import express from 'express';
import crypto from 'crypto';
import prisma from './db/client.js';
import { audit } from './utils/audit.js';
import { attachUser } from './middleware/auth.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { sendEmail } from './utils/email.js';

// Ensure user context (JWT) is parsed before admin checks
// (index.js already applies attachUser globally before /api/pay, but this is defensive)
// router.use(attachUser); // optional if needed

const router = express.Router();

const BANK_ACCOUNT = {
  accountName: process.env.BANK_ACCOUNT_NAME || 'Demo Trading Co.',
  iban: process.env.BANK_ACCOUNT_IBAN || 'SA03 8000 0000 6080 1016 7519',
  bank: process.env.BANK_NAME || 'Demo Bank'
};

function makeReference(orderId) {
  return 'REF-' + (orderId ? orderId.slice(0,6).toUpperCase() : crypto.randomBytes(3).toString('hex').toUpperCase());
}

// Initialize bank transfer (assign reference and set order pending, method=bank)
router.post('/init', async (req, res) => {
  try {
    const body = req.body || {};
    let { orderId } = body;
    if (!orderId) {
      return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID', message: 'orderId is required' });
    }
    let order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND', message: 'Order not found for bank init' });
    }
    const reference = makeReference(orderId);
    const existingMeta = order.paymentMeta || {};
    const newMeta = { ...existingMeta, bank: { ...existingMeta.bank, reference } };
    // Move order into pending_bank_review state awaiting receipt upload
    order = await prisma.order.update({ where: { id: orderId }, data: { paymentMethod: 'bank', paymentMeta: newMeta, status: 'pending_bank_review' } });
    audit({ action: 'order.bank.init', entity: 'Order', entityId: orderId, userId: order.userId, meta: { reference } });
    // Lightweight server log
    // eslint-disable-next-line no-console
    console.log('[BANK] init', { orderId, reference });
    res.json({ ok: true, bank: { ...BANK_ACCOUNT, reference } });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[BANK] init error', e);
    res.status(500).json({ ok: false, error: 'BANK_INIT_FAILED', message: e.message });
  }
});

// Receipt upload (user or admin) -> keeps status pending_bank_review, store path in paymentMeta.bank.receiptUrl
const uploadsDir = path.join(process.cwd(), 'uploads', 'bank-receipts');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {/* ignore */}
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `rec_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    }
    cb(null, true);
  }
});

router.post('/upload', attachUser, (req, res, next) => {
  upload.single('receipt')(req, res, function(err) {
    if (err) {
      if (err.message === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({ ok: false, error: 'UNSUPPORTED_FILE_TYPE', message: 'نوع الملف غير مدعوم. استخدم JPG/PNG/WEBP أو PDF.' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, error: 'FILE_TOO_LARGE', message: 'الحجم يتجاوز 5MB' });
      }
      return res.status(400).json({ ok: false, error: 'UPLOAD_ERROR', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    // Allow owner or admin
    if (req.user?.role !== 'admin' && order.userId !== (req.user?.id || 'guest')) {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }
    const existingMeta = order.paymentMeta || {};
    const relPath = req.file ? `/uploads/bank-receipts/${req.file.filename}` : null;
    const newMeta = { ...existingMeta, bank: { ...(existingMeta.bank||{}), receiptUrl: relPath } };
    await prisma.order.update({ where: { id: order.id }, data: { paymentMeta: newMeta, status: 'pending_bank_review' } });
    audit({ action: 'order.bank.receipt', entity: 'Order', entityId: order.id, userId: req.user?.id, meta: { receiptUrl: relPath } });
    res.json({ ok: true, receiptUrl: relPath });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[BANK] upload error', e);
    res.status(500).json({ ok: false, error: 'BANK_UPLOAD_FAILED', message: e.message });
  }
});

// Admin-only confirm endpoint -> transitions to paid
router.post('/confirm', attachUser, async (req, res) => {
  try {
    const { orderId, reference } = req.body || {};
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'Admin only' });
    }
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    if (order.paymentMethod !== 'bank') {
      return res.status(400).json({ ok: false, error: 'NOT_BANK_METHOD', message: 'Order is not a bank transfer' });
    }
    const existingMeta = order.paymentMeta || {};
    const storedRef = existingMeta?.bank?.reference;
    if (storedRef && reference && storedRef !== reference) {
      return res.status(400).json({ ok: false, error: 'REFERENCE_MISMATCH', message: 'Reference does not match stored one.' });
    }
    if (order.status === 'paid') {
      return res.json({ ok: true, message: 'Already paid', orderId });
    }
    const updatedMeta = { ...existingMeta, bank: { ...(existingMeta.bank||{}), reference: storedRef || reference, confirmedAt: new Date().toISOString() } };
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: 'paid', paymentMeta: updatedMeta } });
    audit({ action: 'order.bank.confirm', entity: 'Order', entityId: order.id, userId: req.user.id, meta: { reference: updatedMeta.bank.reference } });
    // Email placeholder
    try { await sendEmail({ to: updated.userId, subject: 'Bank Transfer Confirmed', text: `Order ${updated.id} marked as paid.` }); } catch {/* ignore */}
    res.json({ ok: true, orderId: order.id, status: 'paid' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[BANK] confirm error', e);
    res.status(500).json({ ok: false, error: 'BANK_CONFIRM_FAILED', message: e.message });
  }
});

export default router;
// Admin-only reject endpoint -> transitions to cancelled with reason
router.post('/reject', attachUser, async (req, res) => {
  try {
    const { orderId, reason } = req.body || {};
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'Admin only' });
    }
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });
    if (order.paymentMethod !== 'bank') {
      return res.status(400).json({ ok: false, error: 'NOT_BANK_METHOD', message: 'Order is not a bank transfer' });
    }
    if (order.status === 'cancelled' || order.status === 'canceled') {
      return res.json({ ok: true, message: 'Already cancelled', orderId });
    }
    const existingMeta = order.paymentMeta || {};
    const updatedMeta = { ...existingMeta, bank: { ...(existingMeta.bank||{}), rejectedAt: new Date().toISOString(), rejectReason: reason || null } };
    const updated = await prisma.order.update({ where: { id: order.id }, data: { status: 'cancelled', paymentMeta: updatedMeta } });
    audit({ action: 'order.bank.reject', entity: 'Order', entityId: order.id, userId: req.user.id, meta: { reason: reason || null } });
    try { await sendEmail({ to: updated.userId, subject: 'Bank Transfer Rejected', text: `Order ${updated.id} was rejected. Reason: ${reason || 'N/A'}` }); } catch {/* ignore */}
    res.json({ ok: true, orderId: order.id, status: 'cancelled' });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[BANK] reject error', e);
    res.status(500).json({ ok: false, error: 'BANK_REJECT_FAILED', message: e.message });
  }
});

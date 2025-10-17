import express from 'express';
import prisma from '../db/client.js';
import { attachUser, requireRole } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Attach user for all endpoints; apply role guards per-section.
router.use(attachUser);

// Feature detection: not all databases may include Seller model yet
const HAS_PRISMA_SELLER = !!prisma.seller && typeof prisma.seller.findUnique === 'function';

// Resolve sellerId for current user
async function getSellerId(userId) {
  if (!HAS_PRISMA_SELLER) return null;
  const sp = await prisma.seller.findUnique({ where: { userId }, select: { id: true } });
  return sp?.id || null;
}

// List products for the current seller, with pagination and basic filters
router.get('/products', requireRole('seller'), async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const { q, page = '1', pageSize = '20' } = req.query || {};
    const where = { sellerId };
    if (q) Object.assign(where, { OR: [ { nameAr: { contains: String(q) } }, { nameEn: { contains: String(q) } }, { slug: { contains: String(q) } } ] });
    const take = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const skip = Math.max(0, (Number(page) - 1) * take);
    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.product.count({ where })
    ]);
    res.json({ items, total, page: Number(page), pageSize: take });
  } catch (e) {
    res.status(500).json({ error: 'SELLER_PRODUCTS_LIST_FAILED', message: e.message });
  }
});

// Create a new product for the seller
router.post('/products', requireRole('seller'), async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const { slug, nameAr, nameEn, price, category, categoryId, image, stock = 10, shortAr, shortEn } = req.body || {};
    if (!nameAr || !nameEn || !price) return res.status(400).json({ error: 'MISSING_FIELDS' });
    // prefer provided categoryId, else map from category slug
    let catId = categoryId;
    if (!catId && category) {
      const c = await prisma.category.findFirst({ where: { slug: String(category) }, select: { id: true } });
      catId = c?.id || null;
    }
    const created = await prisma.product.create({
      data: {
        slug: slug || undefined,
        nameAr, nameEn,
        shortAr: shortAr || null, shortEn: shortEn || null,
        price: Number(price),
        category: category || 'supermarket',
        categoryId: catId,
        image: image || null,
        rating: 0, stock: Number(stock) || 0,
        sellerId
      }
    });
    await audit({ action: 'SELLER_PRODUCT_CREATE', entity: 'Product', entityId: created.id, userId: req.user.id, meta: { sellerId } });
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: 'SELLER_PRODUCT_CREATE_FAILED', message: e.message });
  }
});

// Update a product (must belong to current seller)
router.patch('/products/:id', requireRole('seller'), async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const id = req.params.id;
    const exists = await prisma.product.findFirst({ where: { id, sellerId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'NOT_FOUND' });
    const { nameAr, nameEn, price, stock, category, categoryId, image, shortAr, shortEn, oldPrice } = req.body || {};
    let catId = categoryId;
    if (!catId && category) {
      const c = await prisma.category.findFirst({ where: { slug: String(category) }, select: { id: true } });
      catId = c?.id || null;
    }
    const updated = await prisma.product.update({
      where: { id },
      data: {
        nameAr, nameEn,
        shortAr, shortEn,
        price: price !== undefined ? Number(price) : undefined,
        oldPrice: oldPrice !== undefined ? Number(oldPrice) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        category: category || undefined,
        categoryId: catId,
        image: image || undefined
      }
    });
    await audit({ action: 'SELLER_PRODUCT_UPDATE', entity: 'Product', entityId: id, userId: req.user.id, meta: { sellerId } });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'SELLER_PRODUCT_UPDATE_FAILED', message: e.message });
  }
});

// Delete a product (soft delete optional later). Currently hard delete limited to seller-owned products.
router.delete('/products/:id', requireRole('seller'), async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const id = req.params.id;
    const exists = await prisma.product.findFirst({ where: { id, sellerId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'NOT_FOUND' });
    await prisma.product.delete({ where: { id } });
    await audit({ action: 'SELLER_PRODUCT_DELETE', entity: 'Product', entityId: id, userId: req.user.id, meta: { sellerId } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'SELLER_PRODUCT_DELETE_FAILED', message: e.message });
  }
});

// Optional: manage product images for seller-owned products
router.post('/products/:id/images', requireRole('seller'), async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const id = req.params.id;
    const exists = await prisma.product.findFirst({ where: { id, sellerId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'NOT_FOUND' });
    const { images = [] } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'NO_IMAGES' });
    const toCreate = images.slice(0, 8).map((url, idx) => ({ productId: id, url: String(url), sort: idx }));
    await prisma.productImage.createMany({ data: toCreate });
    res.json({ ok: true, created: toCreate.length });
  } catch (e) {
    res.status(500).json({ error: 'SELLER_PRODUCT_IMAGES_FAILED', message: e.message });
  }
});

// --- Multipart upload for a single product image (seller-owned) ---
// Save under /uploads/product-images and generate variants similar to admin products
const prodUploadsDir = path.join(process.cwd(), 'uploads', 'product-images');
if (!fs.existsSync(prodUploadsDir)) { try { fs.mkdirSync(prodUploadsDir, { recursive: true }); } catch { /* ignore */ } }
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, prodUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    cb(null, 'seller_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    cb(null, true);
  }
});

router.post('/products/:id/upload-image', requireRole('seller'), (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (!ct.startsWith('multipart/form-data')) return res.status(400).json({ error: 'INVALID_CONTENT_TYPE' });
  upload.single('image')(req, res, function(err){
    if (err) {
      if (err.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).json({ error:'UNSUPPORTED_FILE_TYPE', message:'Allowed: JPEG/PNG/WEBP' });
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error:'FILE_TOO_LARGE', message:'Max 4MB' });
      return res.status(400).json({ error:'UPLOAD_ERROR', message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const id = req.params.id;
    const product = await prisma.product.findFirst({ where: { id, sellerId }, select: { id: true } });
    if (!product) return res.status(404).json({ error: 'NOT_FOUND' });
    if (!req.file) return res.status(400).json({ error: 'NO_FILE' });

    const url = '/uploads/product-images/' + req.file.filename;
    // generate variants
    try {
      const full = req.file.path;
      const baseNoExt = full.replace(/\.[^.]+$/, '');
      await sharp(full).resize(180,180,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
      await sharp(full).resize(600,600,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
      await sharp(full).resize(1200,1200,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
    } catch {}

    // Attach as primary image if product has none, else append to gallery
    const updated = await prisma.product.update({ where: { id }, data: { image: url } });
    await prisma.productImage.create({ data: { productId: id, url, sort: 0 } }).catch(()=>null);
    await audit({ action: 'SELLER_PRODUCT_IMAGE_UPLOAD', entity: 'Product', entityId: id, userId: req.user.id, meta: { url } });
    res.json({ ok: true, url });
  } catch (e) {
    res.status(500).json({ error: 'SELLER_IMAGE_UPLOAD_FAILED', message: e.message });
  }
});

// Seller orders
router.get('/orders', requireRole('seller'), async (req, res) => {
  try {
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ error: 'SELLER_MODEL_UNAVAILABLE' });
    const sellerId = await getSellerId(req.user.id);
    if (!sellerId) return res.status(400).json({ error: 'SELLER_PROFILE_NOT_FOUND' });
    const orders = await prisma.order.findMany({
      where: { sellerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: 'SELLER_ORDERS_LIST_FAILED', message: e.message });
  }
});

export default router;

// ---- Separate admin router for KYC review (mounted under /api/admin/sellers) ----
export const adminSellersRouter = express.Router();
adminSellersRouter.use(attachUser, requireRole('admin'));

// List seller profiles with KYC status filters
adminSellersRouter.get('/', async (req, res) => {
  try {
    const { status, page = '1', pageSize = '20' } = req.query || {};
    const where = {};
    if (status) where.kycStatus = String(status);
    const take = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const skip = Math.max(0, (Number(page) - 1) * take);
    const [items, total] = await Promise.all([
      prisma.seller.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.seller.count({ where })
    ]);
    res.json({ ok: true, items, total, page: Number(page), pageSize: take });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'ADMIN_SELLERS_LIST_FAILED', message: e.message });
  }
});

// Approve a seller KYC
adminSellersRouter.post('/:id/approve', async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await prisma.seller.update({ where: { id }, data: { kycStatus: 'approved', kycAt: new Date(), rejectionReason: null, active: true } });
    await audit({ action: 'KYC_APPROVE', entity: 'Seller', entityId: id, userId: req.user.id });
    res.json({ ok: true, seller: updated });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'KYC_APPROVE_FAILED', message: e.message });
  }
});

// Reject a seller KYC
adminSellersRouter.post('/:id/reject', async (req, res) => {
  try {
    const id = req.params.id;
    const reason = req.body?.reason || null;
    const updated = await prisma.seller.update({ where: { id }, data: { kycStatus: 'rejected', kycAt: new Date(), rejectionReason: reason, active: false } });
    await audit({ action: 'KYC_REJECT', entity: 'Seller', entityId: id, userId: req.user.id, meta: { reason } });
    res.json({ ok: true, seller: updated });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'KYC_REJECT_FAILED', message: e.message });
  }
});

// KYC: get my seller profile
router.get('/profile', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ ok: false, error: 'SELLER_MODEL_UNAVAILABLE' });
    const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller) return res.status(404).json({ ok: false, error: 'SELLER_PROFILE_NOT_FOUND' });
    res.json({ ok: true, seller });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'SELLER_PROFILE_GET_FAILED', message: e.message });
  }
});

// KYC: submit/update my KYC fields
router.post('/profile', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    if (!HAS_PRISMA_SELLER) return res.status(503).json({ ok: false, error: 'SELLER_MODEL_UNAVAILABLE' });
    const { companyName, crNumber, iban, bankName, addressText, documents } = req.body || {};
    // Create seller profile if it doesn't exist yet (first-time KYC)
    const existing = await prisma.seller.findUnique({ where: { userId: req.user.id } });
    let result;
    if (!existing) {
      result = await prisma.seller.create({ data: {
        userId: req.user.id,
        companyName: companyName || null,
        crNumber: crNumber || null,
        iban: iban || null,
        bankName: bankName || null,
        addressText: addressText || null,
        documents: documents || null,
        kycStatus: 'pending',
        active: false
      }});
      await audit({ action: 'SELLER_KYC_CREATE', entity: 'Seller', entityId: result.id, userId: req.user.id });
    } else {
      result = await prisma.seller.update({ where: { id: existing.id }, data: {
        companyName: companyName ?? existing.companyName,
        crNumber: crNumber ?? existing.crNumber,
        iban: iban ?? existing.iban,
        bankName: bankName ?? existing.bankName,
        addressText: addressText ?? existing.addressText,
        documents: documents ?? existing.documents,
        kycStatus: 'pending'
      }});
      await audit({ action: 'SELLER_KYC_SUBMIT', entity: 'Seller', entityId: result.id, userId: req.user.id });
    }
    res.json({ ok: true, seller: result });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'SELLER_KYC_SUBMIT_FAILED', message: e.message });
  }
});
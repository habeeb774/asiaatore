import { Router } from 'express';
import * as productService from '../services/productService.js';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import softDelete from '../utils/softDelete.js';
// Image upload dependencies (similar pattern to categories)
import multer from 'multer';
import sharp from 'sharp';
import prisma from '../db/client.js';
import { whereWithDeletedAt } from '../utils/deletedAt.js';

const router = Router();

// ---- Image Upload Setup ----
const prodUploadsDir = path.join(process.cwd(), 'uploads', 'product-images');
if (!fs.existsSync(prodUploadsDir)) { try { fs.mkdirSync(prodUploadsDir, { recursive: true }); } catch { /* ignore */ } }
const prodStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, prodUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    cb(null, 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext);
  }
});
const prodUpload = multer({
  storage: prodStorage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    cb(null, true);
  }
});
function productImageMiddleware(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) {
    prodUpload.single('image')(req, res, function(err){
      if (err) {
        if (err.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).json({ error:'UNSUPPORTED_FILE_TYPE', message:'Allowed: JPEG/PNG/WEBP' });
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error:'FILE_TOO_LARGE', message:'Max 4MB' });
        return res.status(400).json({ error:'UPLOAD_ERROR', message: err.message });
      }
      next();
    });
  } else { next(); }
}

const { mapProduct } = productService;

// List + filters
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page, pageSize, brandId, brandSlug } = req.query;
    let where = whereWithDeletedAt({});
    if (category) where.category = String(category);
    if (brandId) where.brandId = String(brandId);
    if (!brandId && brandSlug) {
      try {
        const b = await prisma.brand.findUnique({ where: { slug: String(brandSlug) }, select: { id: true } });
        if (b?.id) where.brandId = b.id;
      } catch {}
    }
    if (q) {
      const needle = String(q);
      where.OR = [
        { nameAr: { contains: needle, mode: 'insensitive' } },
        { nameEn: { contains: needle, mode: 'insensitive' } }
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    // Pagination (optional)
    const pg = page ? Math.max(1, parseInt(page, 10)) : null;
    const ps = pageSize ? Math.min(100, Math.max(1, parseInt(pageSize, 10))) : 20;
    if (pg) {
      const skip = (pg - 1) * ps;
      const start = Date.now();
      const [total, list] = await Promise.all([
        productService.count(where),
        productService.list(where, { orderBy: { createdAt: 'desc' }, skip, take: ps })
      ]);
      const dur = Date.now() - start;
      res.setHeader('X-Query-Duration-ms', String(dur));
      if (dur > 200) console.warn('[PRODUCTS] slow query', dur, 'ms');
      return res.json({
        items: list.map(mapProduct),
        page: pg,
        pageSize: ps,
        total,
        totalPages: Math.ceil(total / ps)
      });
    }
  const startAll = Date.now();
  const list = await productService.list(where, { orderBy: { createdAt: 'desc' } });
  const durAll = Date.now() - startAll;
  res.setHeader('X-Query-Duration-ms', String(durAll));
  if (durAll > 200) console.warn('[PRODUCTS] slow query', durAll, 'ms');
  res.json(list.map(mapProduct));
  } catch (e) {
    if (process.env.DEBUG_PRODUCTS === '1') {
      console.error('[PRODUCTS] List failed:', e); // eslint-disable-line no-console
    }
    // Degraded mode in development: for ANY error, try serving a static sample as a minimal fallback
    // This makes the mobile/web app usable even when MySQL/Prisma aren't configured locally.
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_INVALID_DB === 'true' || (e && e.message && /Database|DB|connect/i.test(e.message))) {
      try {
        const samplePath = path.join(process.cwd(), 'server', 'data', 'realProducts.sample.json');
        const raw = fs.readFileSync(samplePath, 'utf8');
        const items = JSON.parse(raw);
        const mapped = items.map((p) => ({
          id: p.slug,
          slug: p.slug,
          name: { ar: p.nameAr, en: p.nameEn },
          short: { ar: p.shortAr, en: p.shortEn },
          category: p.category,
          price: p.price,
          oldPrice: p.oldPrice ?? null,
          originalPrice: p.oldPrice ?? null,
          image: p.image || null,
          images: p.image ? [p.image] : [],
          imageVariants: p.image ? { original: p.image } : null,
          brand: null,
          tierPrices: [],
          rating: 0,
          stock: p.stock ?? 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        res.setHeader('x-fallback', 'sample');
        return res.json(mapped);
      } catch (_) {
        // ignore, fall-through
      }
    }
    res.status(500).json({ error: 'FAILED_LIST', message: e.message });
  }
});

// Lightweight debug endpoint (disabled unless explicitly enabled) to help diagnose 500s
router.get('/_debug', async (req, res) => {
  // Allow ad-hoc enable via query ?debug=1 (dev only) if env var not set
  const debugEnabled = process.env.DEBUG_PRODUCTS === '1' || (req.query.debug === '1' && process.env.NODE_ENV !== 'production');
  if (!debugEnabled) {
    return res.status(403).json({ error: 'DISABLED' });
  }
  try {
    const count = await productService.count();
    const one = (await productService.list({}, { take: 1 }))[0] || null;
    res.json({ ok: true, count, sample: one ? mapProduct(one) : null, envFlag: process.env.DEBUG_PRODUCTS === '1' });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message, stack: process.env.NODE_ENV === 'production' ? undefined : e.stack });
  }
});

router.get('/offers', async (req, res) => {
  try {
  const list = await productService.list({ ...whereWithDeletedAt({}), oldPrice: { not: null } }, { orderBy: { createdAt: 'desc' } });
    res.json(list.map(mapProduct));
  } catch (e) {
    if (process.env.DEBUG_PRODUCTS === '1') {
      console.error('[PRODUCTS] Offers failed:', e); // eslint-disable-line no-console
    }
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_INVALID_DB === 'true' || (e && e.message && /Database|DB|connect/i.test(e.message))) {
      try {
        const samplePath = path.join(process.cwd(), 'server', 'data', 'realProducts.sample.json');
        const raw = fs.readFileSync(samplePath, 'utf8');
        const items = JSON.parse(raw);
        const discounted = items.filter(p => p.oldPrice != null);
        const mapped = discounted.map((p) => ({
          id: p.slug,
          slug: p.slug,
          name: { ar: p.nameAr, en: p.nameEn },
          short: { ar: p.shortAr, en: p.shortEn },
          category: p.category,
          price: p.price,
          oldPrice: p.oldPrice ?? null,
          originalPrice: p.oldPrice ?? null,
          image: p.image || null,
          images: p.image ? [p.image] : [],
          imageVariants: p.image ? { original: p.image } : null,
          brand: null,
          tierPrices: [],
          rating: 0,
          stock: p.stock ?? 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        res.setHeader('x-fallback', 'sample');
        return res.json(mapped);
      } catch (_) {}
    }
    res.status(500).json({ error: 'FAILED_OFFERS', message: e.message });
  }
});

// Batch: apply discounts to many products
// Body accepts either:
// 1) { productIds: string[], percent: number } -> applies same percent to all
// 2) { items: [{ id: string, newPrice: number }, ...] } -> per-product new price
router.post('/batch/discount', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const round2 = (n) => Math.max(0, Math.round((Number(n) + Number.EPSILON) * 100) / 100);
    const results = { updated: [], skipped: [], errors: [] };

    if (Array.isArray(body.items) && body.items.length) {
      const ids = body.items.map(it => String(it.id)).filter(Boolean);
      const byIdNew = new Map();
      for (const it of body.items) {
        const np = Number(it.newPrice);
        if (!it.id || !Number.isFinite(np) || np <= 0) {
          results.skipped.push({ id: it.id, reason: 'INVALID_NEW_PRICE' });
          continue;
        }
        byIdNew.set(String(it.id), round2(np));
      }
  const existing = await prisma.product.findMany({ where: whereWithDeletedAt({ id: { in: Array.from(byIdNew.keys()) } }) });
      const ops = [];
      for (const p of existing) {
        const np = byIdNew.get(p.id);
        if (!(Number(p.price) > 0) || !(np > 0) || np >= Number(p.price)) {
          results.skipped.push({ id: p.id, reason: 'PRICE_NOT_LOWER_THAN_CURRENT' });
          continue;
        }
        const data = { price: np, oldPrice: p.oldPrice != null ? p.oldPrice : Number(p.price) };
        ops.push(prisma.product.update({ where: { id: p.id }, data }));
      }
      const updated = ops.length ? await prisma.$transaction(ops) : [];
      for (const u of updated) {
        results.updated.push(mapProduct(u));
        audit({ action: 'product.discount.batch', entity: 'Product', entityId: u.id, userId: req.user?.id, meta: { mode: 'items', oldPrice: u.oldPrice, price: u.price } });
      }
      return res.json({ ok: true, ...results });
    }

    if (Array.isArray(body.productIds) && body.productIds.length && Number.isFinite(Number(body.percent))) {
      const percent = Number(body.percent);
      if (!(percent > 0 && percent < 95)) return res.status(400).json({ error: 'INVALID_PERCENT' });
      const ids = body.productIds.map(String);
  const products = await prisma.product.findMany({ where: whereWithDeletedAt({ id: { in: ids } }) });
      const ops = [];
      for (const p of products) {
        if (!(Number(p.price) > 0)) { results.skipped.push({ id: p.id, reason: 'ZERO_OR_INVALID_PRICE' }); continue; }
        const np = round2(Number(p.price) * (100 - percent) / 100);
        if (!(np > 0) || np >= Number(p.price)) { results.skipped.push({ id: p.id, reason: 'PRICE_NOT_LOWER_THAN_CURRENT' }); continue; }
        const data = { price: np, oldPrice: p.oldPrice != null ? p.oldPrice : Number(p.price) };
        ops.push(prisma.product.update({ where: { id: p.id }, data }));
      }
      const updated = ops.length ? await prisma.$transaction(ops) : [];
      for (const u of updated) {
        results.updated.push(mapProduct(u));
        audit({ action: 'product.discount.batch', entity: 'Product', entityId: u.id, userId: req.user?.id, meta: { mode: 'percent', percent } });
      }
      return res.json({ ok: true, ...results });
    }

    return res.status(400).json({ error: 'INVALID_BODY', message: 'Provide items[] with newPrice or productIds[] with percent' });
  } catch (e) {
    res.status(400).json({ error: 'FAILED_BATCH_DISCOUNT', message: e.message });
  }
});

// Batch: clear discount (set oldPrice to null) for multiple products
router.post('/batch/clear-discount', requireAdmin, async (req, res) => {
  try {
    const body = req.body || {};
    const ids = Array.isArray(body.productIds) ? body.productIds.map(String).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ error: 'INVALID_BODY', message: 'productIds[] required' });

    // Update in bulk, then fetch affected records for response mapping
  await prisma.product.updateMany({ where: whereWithDeletedAt({ id: { in: ids } }), data: { oldPrice: null } });
  const updated = await prisma.product.findMany({ where: whereWithDeletedAt({ id: { in: ids } }) });
    for (const u of updated) {
      audit({ action: 'product.discount.clear_batch', entity: 'Product', entityId: u.id, userId: req.user?.id });
    }
    res.json({ ok: true, updated: updated.map(mapProduct) });
  } catch (e) {
    res.status(400).json({ error: 'FAILED_BATCH_CLEAR', message: e.message });
  }
});

// Simple catalog endpoint: returns grouped products by category with counts
router.get('/catalog/summary', async (req, res) => {
  try {
    // Fetch categories that have at least one product
  const byCategory = await prisma.product.groupBy({ by: ['category'], where: whereWithDeletedAt({}), _count: { category: true } });
    // For each category, get a few recent products (limit 8)
    const categories = await Promise.all(byCategory.map(async c => {
      const items = await productService.list({ category: c.category }, { orderBy: { createdAt: 'desc' }, take: 8 });
      return {
        category: c.category,
        count: c._count.category,
        items: items.map(mapProduct)
      };
    }));
    res.json({ categories });
  } catch (e) {
    res.status(500).json({ error: 'FAILED_CATALOG', message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  const p = await productService.getById(req.params.id);
  if (!p) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(mapProduct(p));
});

// Create
router.post('/', requireAdmin, productImageMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    if (body.price != null && Number(body.price) < 0) return res.status(400).json({ error: 'INVALID_PRICE' });
    if (body.stock != null && Number(body.stock) < 0) return res.status(400).json({ error: 'INVALID_STOCK' });
    let imagePath = body.image || null;
    if (req.file) {
      imagePath = '/uploads/product-images/' + req.file.filename;
      // Generate multiple variants (thumb & medium) next to original
      try {
        const imageFull = req.file.path;
        const baseNoExt = imageFull.replace(/\.[^.]+$/, '');
        await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
        await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
      } catch {}
    }
    const created = await productService.create({
      slug: body.slug || `product-${Date.now()}`,
      nameAr: body.nameAr || body.name?.ar || 'منتج جديد',
      nameEn: body.nameEn || body.name?.en || 'New product',
      shortAr: body.shortAr || body.short?.ar || 'وصف مختصر',
      shortEn: body.shortEn || body.short?.en || 'Short description',
      category: body.category || 'general',
      price: body.price != null ? Number(body.price) : 0,
      oldPrice: body.oldPrice != null ? Number(body.oldPrice) : null,
  // Use a local placeholder to avoid external network failures in dev
  image: imagePath || '/logo.svg',
      rating: body.rating != null ? Number(body.rating) : 0,
      stock: Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0,
      brand: body.brandId ? { connect: { id: body.brandId } } : undefined,
    });
    audit({ action: 'product.create', entity: 'Product', entityId: created.id, userId: req.user?.id, meta: { slug: created.slug } });
    res.status(201).json(mapProduct(created));
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'SLUG_EXISTS' });
    if (e.code === 'P2025') return res.status(400).json({ error: 'BRAND_NOT_FOUND', message: 'Invalid brandId' });
    res.status(400).json({ error: 'FAILED_CREATE', message: e.message });
  }
});

// Update
router.put('/:id', requireAdmin, productImageMiddleware, async (req, res) => {
  try {
    const body = req.body || {};
    if (body.price != null && Number(body.price) < 0) return res.status(400).json({ error: 'INVALID_PRICE' });
    if (body.stock != null && Number(body.stock) < 0) return res.status(400).json({ error: 'INVALID_STOCK' });
    const data = {
      slug: body.slug,
      nameAr: body.nameAr || body.name?.ar,
      nameEn: body.nameEn || body.name?.en,
      shortAr: body.shortAr || body.short?.ar,
      shortEn: body.shortEn || body.short?.en,
      category: body.category,
      price: body.price != null ? Number(body.price) : undefined,
      // Allow explicit clearing of oldPrice by sending null; otherwise set number or leave unchanged
      oldPrice: body.oldPrice === null ? null : (body.oldPrice != null ? Number(body.oldPrice) : undefined),
      image: body.image,
      rating: body.rating != null ? Number(body.rating) : undefined,
      stock: body.stock != null ? Number(body.stock) : undefined
    };
    if (req.file) {
      data.image = '/uploads/product-images/' + req.file.filename;
      try {
        const imageFull = req.file.path;
        const baseNoExt = imageFull.replace(/\.[^.]+$/, '');
        await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
        await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
      } catch {}
    }
  if (body.brandId === null) data.brandId = null;
  if (body.brandId && typeof body.brandId === 'string') data.brandId = body.brandId;
    const updated = await productService.update(req.params.id, data);
    audit({ action: 'product.update', entity: 'Product', entityId: updated.id, userId: req.user?.id, meta: { slug: updated.slug } });
    res.json(mapProduct(updated));
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'NOT_FOUND' });
    if (e.code === 'P2002') return res.status(409).json({ error: 'SLUG_EXISTS' });
    res.status(400).json({ error: 'FAILED_UPDATE', message: e.message });
  }
});

// Delete
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
  const removed = await productService.remove(req.params.id);
    audit({ action: 'product.delete', entity: 'Product', entityId: removed.id, userId: req.user?.id, meta: { slug: removed.slug } });
    res.json({ ok: true, removed: mapProduct(removed) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'NOT_FOUND' });
    res.status(400).json({ error: 'FAILED_DELETE', message: e.message });
  }
});

// --- Additional Images (Gallery) Endpoints ---

// Add a new gallery image
router.post('/:id/images', requireAdmin, productImageMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    // Ensure product exists
  const product = await productService.getById(productId);
    if (!product) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
    if (!req.file) return res.status(400).json({ error: 'NO_FILE', message: 'Image file required' });

    const url = '/uploads/product-images/' + req.file.filename;
    // Generate variants
    try {
      const imageFull = req.file.path;
      const baseNoExt = imageFull.replace(/\.[^.]+$/, '');
      await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
      await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
      await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
    } catch {}

    // Determine next sort value
    const nextSort = await productService.maxImageSort(productId);
    await productService.createImage(productId, { url, altEn: req.body?.altEn || null, altAr: req.body?.altAr || null, sort: nextSort });
    const updated = await productService.getWithImages(productId);
    audit({ action: 'product.image.add', entity: 'Product', entityId: productId, userId: req.user?.id, meta: { image: url } });
    res.status(201).json(mapProduct(updated));
  } catch (e) {
    res.status(400).json({ error: 'FAILED_ADD_IMAGE', message: e.message });
  }
});

// Update gallery image (alt text or sort)
router.patch('/images/:imageId', requireAdmin, async (req, res) => {
  try {
    const { imageId } = req.params;
    const data = {};
    if (req.body.altEn !== undefined) data.altEn = req.body.altEn || null;
    if (req.body.altAr !== undefined) data.altAr = req.body.altAr || null;
    if (req.body.sort !== undefined && Number.isFinite(Number(req.body.sort))) data.sort = Number(req.body.sort);

  const existing = await productService.getImageById(imageId);
    if (!existing) return res.status(404).json({ error: 'IMAGE_NOT_FOUND' });
  await productService.updateImage(imageId, data);
  const updatedProduct = await productService.getWithImages(existing.productId);
    audit({ action: 'product.image.update', entity: 'Product', entityId: existing.productId, userId: req.user?.id, meta: { imageId } });
    res.json(mapProduct(updatedProduct));
  } catch (e) {
    res.status(400).json({ error: 'FAILED_UPDATE_IMAGE', message: e.message });
  }
});

// Delete gallery image
router.delete('/images/:imageId', requireAdmin, async (req, res) => {
  try {
    const { imageId } = req.params;
  const img = await productService.getImageById(imageId);
    if (!img) return res.status(404).json({ error: 'IMAGE_NOT_FOUND' });
  await productService.deleteImage(imageId);

    // Attempt to remove physical files (original + variants) if local
    if (img.url.startsWith('/uploads/product-images/')) {
      const abs = path.join(process.cwd(), img.url.replace(/^\//,''));
      const baseNoExt = abs.replace(/\.[^.]+$/, '');
      for (const f of [abs, baseNoExt + '_thumb.webp', baseNoExt + '_md.webp', baseNoExt + '_lg.webp']) {
        try { fs.unlinkSync(f); } catch {}
      }
    }

  const updatedProduct = await productService.getWithImages(img.productId);
    audit({ action: 'product.image.delete', entity: 'Product', entityId: img.productId, userId: req.user?.id, meta: { imageId } });
    res.json(mapProduct(updatedProduct));
  } catch (e) {
    res.status(400).json({ error: 'FAILED_DELETE_IMAGE', message: e.message });
  }
});

export default router;
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
import InventoryService from '../services/inventoryService.js';

const router = Router();

// Cache helper
async function getCached(key, ttl = 300) {
  if (!global.redisClient) return null;
  try {
    const data = await global.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

async function setCached(key, data, ttl = 300) {
  if (!global.redisClient) return;
  try {
    await global.redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (e) {}
}

async function invalidateCache(pattern) {
  if (!global.redisClient) return;
  try {
    const keys = await global.redisClient.keys(pattern);
    if (keys.length) await global.redisClient.del(keys);
  } catch (e) {}
}

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
    const cacheKey = `products:list:${JSON.stringify({ where, pg, ps })}`;
    let result = await getCached(cacheKey);
    if (!result) {
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
        result = {
          items: list.map(mapProduct),
          page: pg,
          pageSize: ps,
          total,
          totalPages: Math.ceil(total / ps)
        };
      } else {
        const list = await productService.list(where, { orderBy: { createdAt: 'desc' } });
        result = list.map(mapProduct);
      }
      await setCached(cacheKey, result);
    }
    res.json(result);
  } catch (e) {
    if (process.env.DEBUG_PRODUCTS === '1') {
      console.error('[PRODUCTS] List failed:', e);  
    }
    // Degraded mode: if DB is unavailable, try serving a static sample as a minimal fallback
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
      console.error('[PRODUCTS] Offers failed:', e);  
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

router.get('/featured', async (req, res) => {
  try {
    // Return most recently created active products (featured products)
    const list = await productService.list(whereWithDeletedAt({ status: 'active' }), { orderBy: { createdAt: 'desc' }, take: 12 });
    res.json(list.map(mapProduct));
  } catch (e) {
    if (process.env.DEBUG_PRODUCTS === '1') {
      console.error('[PRODUCTS] Featured failed:', e);  
    }
    if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_INVALID_DB === 'true' || (e && e.message && /Database|DB|connect/i.test(e.message))) {
      try {
        const samplePath = path.join(process.cwd(), 'server', 'data', 'realProducts.sample.json');
        const raw = fs.readFileSync(samplePath, 'utf8');
        const items = JSON.parse(raw);
        const featured = items.slice(0, 12); // Take first 12 as featured
        const mapped = featured.map((p) => ({
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
    res.status(500).json({ error: 'FAILED_FEATURED', message: e.message });
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

// Get similar/recommended products for a given product
router.get('/:id/similar', async (req, res) => {
  try {
    const productId = req.params.id;
    const { limit = 6 } = req.query;

    // Get the current product to understand its characteristics
    const currentProduct = await productService.getById(productId);
    if (!currentProduct) return res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });

    const similarProducts = [];
    const seenIds = new Set([productId]);

    // 1. First priority: Same category, different products
    if (currentProduct.category) {
      const categoryProducts = await productService.list(
        {
          category: currentProduct.category,
          status: 'active',
          id: { not: productId }
        },
        {
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit) * 2, 20)
        }
      );

      for (const product of categoryProducts) {
        if (!seenIds.has(product.id)) {
          similarProducts.push(product);
          seenIds.add(product.id);
          if (similarProducts.length >= limit) break;
        }
      }
    }

    // 2. Second priority: Same brand, different category
    if (similarProducts.length < limit && currentProduct.brandId) {
      const brandProducts = await productService.list(
        {
          brandId: currentProduct.brandId,
          status: 'active',
          id: { not: productId }
        },
        {
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit) * 2, 20)
        }
      );

      for (const product of brandProducts) {
        if (!seenIds.has(product.id)) {
          similarProducts.push(product);
          seenIds.add(product.id);
          if (similarProducts.length >= limit) break;
        }
      }
    }

    // 3. Third priority: Similar price range (±30% of current price)
    if (similarProducts.length < limit && currentProduct.price > 0) {
      const priceMin = currentProduct.price * 0.7;
      const priceMax = currentProduct.price * 1.3;

      const priceProducts = await productService.list(
        {
          price: { gte: priceMin, lte: priceMax },
          status: 'active',
          id: { not: productId }
        },
        {
          orderBy: { createdAt: 'desc' },
          take: Math.min(parseInt(limit) * 2, 20)
        }
      );

      for (const product of priceProducts) {
        if (!seenIds.has(product.id)) {
          similarProducts.push(product);
          seenIds.add(product.id);
          if (similarProducts.length >= limit) break;
        }
      }
    }

    // 4. Fallback: Recent active products
    if (similarProducts.length < limit) {
      const recentProducts = await productService.list(
        {
          status: 'active',
          id: { not: productId }
        },
        {
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit) - similarProducts.length
        }
      );

      for (const product of recentProducts) {
        if (!seenIds.has(product.id)) {
          similarProducts.push(product);
          seenIds.add(product.id);
        }
      }
    }

    res.json(similarProducts.map(mapProduct));
  } catch (e) {
    console.error('[PRODUCTS] Similar products failed:', e);
    res.status(500).json({ error: 'FAILED_SIMILAR_PRODUCTS', message: e.message });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await productService.getById(req.params.id);
    if (!product) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(mapProduct(product));
  } catch (e) {
    res.status(400).json({ error: 'FAILED_GET', message: e.message });
  }
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
      // Generate multiple variants (thumb, medium, large) next to original in WebP and AVIF
      try {
        const imageFull = req.file.path;
        const baseNoExt = imageFull.replace(/\.[^.]+$/, '');
        await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
        await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
        // AVIF (best effort)
        try {
          await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_thumb.avif');
          await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_md.avif');
          await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_lg.avif');
        } catch {}
      } catch {}
    }
    // Preflight duplicate detection: check by slug, sku, or exact name (AR/EN) case-insensitive
    try {
      const slug = (body.slug || '').trim();
      const sku = (body.sku || '').trim();
      const nameAr = (body.nameAr || body.name?.ar || '').trim();
      const nameEn = (body.nameEn || body.name?.en || '').trim();
      const ors = [];
      if (slug) ors.push({ slug });
      if (sku) ors.push({ sku });
      if (nameAr) ors.push({ nameAr: { equals: nameAr, mode: 'insensitive' } });
      if (nameEn) ors.push({ nameEn: { equals: nameEn, mode: 'insensitive' } });
      if (ors.length) {
        const dup = await prisma.product.findFirst({ where: whereWithDeletedAt({ OR: ors }) }).catch(() => null);
        if (dup) {
          let field = 'name';
          if (slug && dup.slug?.toLowerCase() === slug.toLowerCase()) field = 'slug';
          else if (sku && dup.sku?.toLowerCase?.() === sku.toLowerCase()) field = 'sku';
          return res.status(409).json({ error: 'DUPLICATE_PRODUCT', field, existingId: dup.id, message: 'Duplicate product' });
        }
      }
    } catch {}

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
    // Optional initial stock and low stock threshold
    try {
      const initial = body.initial_stock != null ? Number(body.initial_stock) : null;
      const threshold = body.low_stock_threshold != null ? Number(body.low_stock_threshold) : null;
      if (initial != null || threshold != null) {
        const inv = await prisma.inventory.findFirst({ where: { productId: created.id, warehouseId: null } }).catch(() => null);
        if (!inv) {
          await prisma.inventory.create({ data: { productId: created.id, quantity: initial || 0, reservedQuantity: 0, lowStockThreshold: threshold != null ? threshold : 5 } }).catch(() => null);
        } else {
          const data = {};
          if (initial != null) data.quantity = initial;
          if (threshold != null) data.lowStockThreshold = threshold;
          if (Object.keys(data).length) await prisma.inventory.update({ where: { id: inv.id }, data }).catch(() => null);
        }
      }
    } catch {}
    audit({ action: 'product.create', entity: 'Product', entityId: created.id, userId: req.user?.id, meta: { slug: created.slug } });
    await invalidateCache('products:list:*');
    res.status(201).json(mapProduct(created));
  } catch (e) {
    if (e.code === 'P2002') {
      // Unique constraint failed; try to detect which field
      const target = e?.meta?.target;
      let field = 'unique';
      if (typeof target === 'string') {
        if (/slug/i.test(target)) field = 'slug';
        if (/sku/i.test(target)) field = 'sku';
      } else if (Array.isArray(target)) {
        if (target.some(t => /slug/i.test(String(t)))) field = 'slug';
        else if (target.some(t => /sku/i.test(String(t)))) field = 'sku';
      }
      return res.status(409).json({ error: 'DUPLICATE_PRODUCT', field });
    }
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
        try {
          await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_thumb.avif');
          await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_md.avif');
          await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_lg.avif');
        } catch {}
      } catch {}
    }
  if (body.brandId === null) data.brandId = null;
  if (body.brandId && typeof body.brandId === 'string') data.brandId = body.brandId;
    const updated = await productService.update(req.params.id, data);
    // Allow updating low stock threshold
    try {
      if (body.low_stock_threshold != null) {
        const inv = await prisma.inventory.findFirst({ where: { productId: updated.id, warehouseId: null } });
        if (inv) await prisma.inventory.update({ where: { id: inv.id }, data: { lowStockThreshold: Number(body.low_stock_threshold) } });
      }
    } catch {}
    audit({ action: 'product.update', entity: 'Product', entityId: updated.id, userId: req.user?.id, meta: { slug: updated.slug } });
    await invalidateCache('products:list:*');
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
    await invalidateCache('products:list:*');
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
      try {
        await sharp(imageFull).resize(180,180,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_thumb.avif');
        await sharp(imageFull).resize(600,600,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_md.avif');
        await sharp(imageFull).resize(1200,1200,{ fit:'cover' }).toFormat('avif').toFile(baseNoExt + '_lg.avif');
      } catch {}
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
      for (const f of [
        abs,
        baseNoExt + '_thumb.webp', baseNoExt + '_md.webp', baseNoExt + '_lg.webp',
        baseNoExt + '_thumb.avif', baseNoExt + '_md.avif', baseNoExt + '_lg.avif'
      ]) {
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

// Upsert products by slug or sku. Body: { items: [{ slug?, sku?, nameAr, nameEn, category, price, oldPrice?, brandSlug?, stock?, tierPrices?: [{ minQty, price, packagingType? }] , image? }] }
router.post('/batch/upsert', requireAdmin, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error:'INVALID_BODY', message:'items[] required' });
    const results = [];
    for (const raw of items.slice(0, 500)) {
      const slug = raw.slug?.trim() || undefined;
      const sku = raw.sku?.trim() || undefined;
      const data = {
        slug,
        sku,
        nameAr: raw.nameAr || raw.name?.ar,
        nameEn: raw.nameEn || raw.name?.en,
        shortAr: raw.shortAr || raw.short?.ar || null,
        shortEn: raw.shortEn || raw.short?.en || null,
        category: raw.category || 'general',
        price: Number(raw.price) || 0,
        oldPrice: raw.oldPrice != null ? Number(raw.oldPrice) : null,
        image: raw.image || null
      };
      if (!data.nameAr || !data.nameEn) { results.push({ ok:false, error:'MISSING_NAME', slug, sku }); continue; }
      // Resolve brand by slug (optional)
      let brandId = null;
      if (raw.brandId) brandId = raw.brandId;
      else if (raw.brandSlug) {
        const b = await prisma.brand.findUnique({ where: { slug: String(raw.brandSlug) }, select: { id: true } }).catch(()=>null);
        brandId = b?.id || null;
      }
      if (brandId) data.brandId = brandId;
      // Upsert by sku if available else slug else create
      let prod = null;
      if (sku) {
        prod = await prisma.product.upsert({ where: { sku }, create: { ...data }, update: { ...data } });
      } else if (slug) {
        prod = await prisma.product.upsert({ where: { slug }, create: { ...data }, update: { ...data } });
      } else {
        prod = await prisma.product.create({ data });
      }
      // Stock update
      if (raw.stock != null) {
        await InventoryService.updateStock(prod.id, Number(raw.stock)).catch(()=>null);
      }
      // Tier prices (replace)
      if (Array.isArray(raw.tierPrices)) {
        await prisma.productTierPrice.deleteMany({ where: { productId: prod.id } }).catch(()=>null);
        const rows = raw.tierPrices
          .map(t => ({ productId: prod.id, minQty: Number(t.minQty)||1, price: Number(t.price)||0, packagingType: t.packagingType || 'unit', noteAr: t.noteAr||t.note?.ar||null, noteEn: t.noteEn||t.note?.en||null }))
          .filter(t => t.price >= 0 && t.minQty >= 1)
          .slice(0, 20);
        if (rows.length) await prisma.productTierPrice.createMany({ data: rows }).catch(()=>null);
      }
      results.push({ ok:true, id: prod.id, slug: prod.slug, sku: prod.sku });
    }
    res.json({ ok:true, results });
  } catch (e) {
    res.status(400).json({ error:'BATCH_UPSERT_FAILED', message: e.message });
  }
});

// Mass price/stock adjust. Body: { updates: [{ id|slug|sku, price?, oldPrice?, stock? }] }
router.post('/batch/stock-price', requireAdmin, async (req, res) => {
  try {
    const upd = Array.isArray(req.body?.updates) ? req.body.updates : [];
    if (!upd.length) return res.status(400).json({ error:'INVALID_BODY', message:'updates[] required' });
    const results = [];
    for (const u of upd.slice(0, 1000)) {
      const where = u.id ? { id: String(u.id) } : (u.sku ? { sku: String(u.sku) } : (u.slug ? { slug: String(u.slug) } : null));
      if (!where) { results.push({ ok:false, error:'NO_IDENTIFIER' }); continue; }
      const existing = await prisma.product.findFirst({ where }).catch(()=>null);
      if (!existing) { results.push({ ok:false, error:'NOT_FOUND' }); continue; }
      const data = {};
      if (u.price != null) data.price = Number(u.price);
      if (u.oldPrice === null) data.oldPrice = null; else if (u.oldPrice != null) data.oldPrice = Number(u.oldPrice);
      const updated = Object.keys(data).length ? await prisma.product.update({ where: { id: existing.id }, data }) : existing;
      if (u.stock != null) await InventoryService.updateStock(existing.id, Number(u.stock)).catch(()=>null);
      results.push({ ok:true, id: updated.id, slug: updated.slug, sku: updated.sku });
    }
    res.json({ ok:true, results });
  } catch (e) {
    res.status(400).json({ error:'BATCH_STOCK_PRICE_FAILED', message: e.message });
  }
});

export default router;

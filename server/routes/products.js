import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
// Image upload dependencies (similar pattern to categories)
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

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

function buildImageVariants(imagePath) {
  if (!imagePath) return null;
  // Only build predictable variant paths for local uploads under /uploads/product-images/
  if (!imagePath.startsWith('/uploads/product-images/')) return { original: imagePath };
  const base = imagePath.replace(/\.[^.]+$/, '');
  // We will save variants with suffixes _thumb.webp & _md.webp at generation time
  return {
    original: imagePath,
    thumb: base + '_thumb.webp',
    medium: base + '_md.webp'
  };
}

function mapProduct(p) {
  const mainVariants = buildImageVariants(p.image);
  // ProductImages (if included) may have their own variants based on naming convention
  const gallery = Array.isArray(p.productImages) ? p.productImages.map(img => ({
    id: img.id,
    url: img.url,
    variants: buildImageVariants(img.url),
    alt: { en: img.altEn || null, ar: img.altAr || null },
    sort: img.sort,
    createdAt: img.createdAt
  })).sort((a,b) => a.sort - b.sort || a.createdAt.localeCompare?.(b.createdAt) || 0) : [];

  const imagesAll = [
    ... (p.image ? [p.image] : []),
    ... gallery.map(g => g.url)
  ];
  return {
    id: p.id,
    slug: p.slug,
    name: { ar: p.nameAr, en: p.nameEn },
    short: { ar: p.shortAr, en: p.shortEn },
    category: p.category,
    price: p.price,
    oldPrice: p.oldPrice,
    originalPrice: p.oldPrice, // alias for older frontend components
    image: p.image,
    images: imagesAll,
    imageVariants: mainVariants,
    gallery, // detailed objects for additional images
    brand: p.brand ? {
      id: p.brand.id,
      slug: p.brand.slug,
      name: { ar: p.brand.nameAr, en: p.brand.nameEn },
      logo: p.brand.logo
    } : null,
    tierPrices: Array.isArray(p.tierPrices) ? p.tierPrices
      .sort((a,b)=> a.minQty - b.minQty)
      .map(t => ({ id: t.id, minQty: t.minQty, price: t.price, packagingType: t.packagingType, note: { ar: t.noteAr, en: t.noteEn } })) : [],
    rating: p.rating,
    stock: p.stock,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

// List + filters
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, page, pageSize } = req.query;
    const where = {};
    if (category) where.category = String(category);
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
      const [total, list] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: ps, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true } })
      ]);
      return res.json({
        items: list.map(mapProduct),
        page: pg,
        pageSize: ps,
        total,
        totalPages: Math.ceil(total / ps)
      });
    }
  const list = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' }, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true } });
    res.json(list.map(mapProduct));
  } catch (e) {
    if (process.env.DEBUG_PRODUCTS === '1') {
      console.error('[PRODUCTS] List failed:', e); // eslint-disable-line no-console
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
    const count = await prisma.product.count();
    const one = await prisma.product.findFirst();
    res.json({ ok: true, count, sample: one ? mapProduct(one) : null, envFlag: process.env.DEBUG_PRODUCTS === '1' });
  } catch (e) {
    res.status(500).json({ ok:false, error: e.message, stack: process.env.NODE_ENV === 'production' ? undefined : e.stack });
  }
});

router.get('/offers', async (req, res) => {
  const list = await prisma.product.findMany({ where: { oldPrice: { not: null } }, orderBy: { createdAt: 'desc' } });
  res.json(list.map(mapProduct));
});

// Simple catalog endpoint: returns grouped products by category with counts
router.get('/catalog/summary', async (req, res) => {
  try {
    // Fetch categories that have at least one product
    const byCategory = await prisma.product.groupBy({ by: ['category'], _count: { category: true } });
    // For each category, get a few recent products (limit 8)
    const categories = await Promise.all(byCategory.map(async c => {
      const items = await prisma.product.findMany({ where: { category: c.category }, orderBy: { createdAt: 'desc' }, take: 8 });
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
  const p = await prisma.product.findUnique({ where: { id: req.params.id }, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true } });
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
    const created = await prisma.product.create({ data: {
      slug: body.slug || `product-${Date.now()}`,
      nameAr: body.nameAr || body.name?.ar || 'منتج جديد',
      nameEn: body.nameEn || body.name?.en || 'New product',
      shortAr: body.shortAr || body.short?.ar || 'وصف مختصر',
      shortEn: body.shortEn || body.short?.en || 'Short description',
      category: body.category || 'general',
      price: body.price != null ? Number(body.price) : 0,
      oldPrice: body.oldPrice != null ? Number(body.oldPrice) : null,
      image: imagePath || `https://via.placeholder.com/600x400?text=P${Date.now()}`,
      rating: body.rating != null ? Number(body.rating) : 0,
      stock: Number.isFinite(Number(body.stock)) ? Number(body.stock) : 0,
      brand: body.brandId ? { connect: { id: body.brandId } } : undefined
    }, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true }});
    audit({ action: 'product.create', entity: 'Product', entityId: created.id, userId: req.user?.id, meta: { slug: created.slug } });
    res.status(201).json(mapProduct(created));
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'SLUG_EXISTS' });
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
      oldPrice: body.oldPrice != null ? Number(body.oldPrice) : undefined,
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
  const updated = await prisma.product.update({ where: { id: req.params.id }, data, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true } });
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
  const removed = await prisma.product.delete({ where: { id: req.params.id }, include: { productImages: { orderBy: { sort: 'asc' } }, brand: true, tierPrices: true } });
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
    const product = await prisma.product.findUnique({ where: { id: productId } });
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
    const maxSort = await prisma.productImage.aggregate({ where: { productId }, _max: { sort: true } });
    const nextSort = (maxSort._max.sort ?? -1) + 1;

    await prisma.productImage.create({ data: {
      productId,
      url,
      altEn: req.body?.altEn || null,
      altAr: req.body?.altAr || null,
      sort: nextSort
    }});

    const updated = await prisma.product.findUnique({ where: { id: productId }, include: { productImages: { orderBy: { sort: 'asc' } } } });
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

    const existing = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!existing) return res.status(404).json({ error: 'IMAGE_NOT_FOUND' });
    await prisma.productImage.update({ where: { id: imageId }, data });
    const updatedProduct = await prisma.product.findUnique({ where: { id: existing.productId }, include: { productImages: { orderBy: { sort: 'asc' } } } });
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
    const img = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!img) return res.status(404).json({ error: 'IMAGE_NOT_FOUND' });
    await prisma.productImage.delete({ where: { id: imageId } });

    // Attempt to remove physical files (original + variants) if local
    if (img.url.startsWith('/uploads/product-images/')) {
      const abs = path.join(process.cwd(), img.url.replace(/^\//,''));
      const baseNoExt = abs.replace(/\.[^.]+$/, '');
      for (const f of [abs, baseNoExt + '_thumb.webp', baseNoExt + '_md.webp']) {
        try { fs.unlinkSync(f); } catch {}
      }
    }

    const updatedProduct = await prisma.product.findUnique({ where: { id: img.productId }, include: { productImages: { orderBy: { sort: 'asc' } } } });
    audit({ action: 'product.image.delete', entity: 'Product', entityId: img.productId, userId: req.user?.id, meta: { imageId } });
    res.json(mapProduct(updatedProduct));
  } catch (e) {
    res.status(400).json({ error: 'FAILED_DELETE_IMAGE', message: e.message });
  }
});

export default router;
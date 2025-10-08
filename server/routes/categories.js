import { Router } from 'express';
// Use shared Prisma singleton to avoid multiple client instances
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

function mapCategory(c) {
  return {
    id: c.id,
    slug: c.slug,
    name: { ar: c.nameAr, en: c.nameEn },
    description: { ar: c.descriptionAr, en: c.descriptionEn },
    image: c.image,
    icon: c.icon,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  };
}

// List categories
router.get('/', async (req, res) => {
  try {
    const withCounts = req.query.withCounts === '1';
    const list = await prisma.category.findMany({ orderBy: { createdAt: 'desc' } });
    if (!withCounts) {
      return res.json({ ok: true, categories: list.map(mapCategory) });
    }
    // counts based on Product.category textual match to slug
    const slugs = list.map(c => c.slug);
    const countsRaw = await prisma.product.groupBy({ by: ['category'], _count: { category: true }, where: { category: { in: slugs } } });
    const countMap = Object.fromEntries(countsRaw.map(r => [r.category, r._count.category]));
    res.json({ ok: true, categories: list.map(c => ({ ...mapCategory(c), productCount: countMap[c.slug] || 0 })) });
  } catch (e) {
    // Degraded mode: fallback to derived categories from sample products if DB is down
    try {
      if (/Database|DB|connect/i.test(e.message || '')) {
        const samplePath = path.join(process.cwd(), 'server', 'data', 'realProducts.sample.json');
        const raw = fs.readFileSync(samplePath, 'utf8');
        const sample = JSON.parse(raw);
        const map = new Map();
        for (const p of sample) {
          const slug = p.category;
          if (!map.has(slug)) map.set(slug, { slug, nameAr: slug, nameEn: slug, descriptionAr: null, descriptionEn: null, image: null, icon: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }
        const list = Array.from(map.values());
        return res.json({ ok: true, categories: list.map(c => ({
          id: c.slug,
          slug: c.slug,
          name: { ar: c.nameAr, en: c.nameEn },
          description: { ar: c.descriptionAr, en: c.descriptionEn },
          image: c.image,
          icon: c.icon,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          productCount: undefined
        })) });
      }
    } catch {}
    res.status(500).json({ ok: false, error: 'FAILED_LIST', message: e.message });
  }
});

// Get single category by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const c = await prisma.category.findUnique({ where: { slug: req.params.slug } });
    if (!c) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.json({ ok: true, category: mapCategory(c) });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'FAILED_GET', message: e.message });
  }
});

// Image upload setup
const catUploadsDir = path.join(process.cwd(), 'uploads', 'category-images');
if (!fs.existsSync(catUploadsDir)) { try { fs.mkdirSync(catUploadsDir, { recursive: true }); } catch { /* ignore */ } }
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, catUploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, 'cat_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    cb(null, true);
  }
});

// Create category (admin) - supports optional image upload (multipart/form-data)
router.post('/', requireAdmin, (req, res, next) => {
  // detect multipart for image
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) {
    upload.single('image')(req, res, function(err){
      if (err) {
        if (err.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).json({ ok:false, error:'UNSUPPORTED_FILE_TYPE', message:'يجب أن تكون الصورة JPEG أو PNG أو WEBP' });
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ ok:false, error:'FILE_TOO_LARGE', message:'الحجم الأقصى 2MB' });
        return res.status(400).json({ ok:false, error:'UPLOAD_ERROR', message: err.message });
      }
      next();
    });
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.slug || !body.nameAr || !body.nameEn) {
      return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    }
    let imagePath = body.image || null;
    if (req.file) {
      // create a resized variant (webp) for thumbs
      const fullPath = req.file.path;
      const thumbName = req.file.filename.replace(/\.[^.]+$/, '') + '_thumb.webp';
      const thumbPath = path.join(catUploadsDir, thumbName);
      try {
        await sharp(fullPath).resize(300,300,{ fit:'cover' }).toFormat('webp').toFile(thumbPath);
      } catch {}
      imagePath = '/uploads/category-images/' + req.file.filename;
    }
    const created = await prisma.category.create({ data: {
      slug: body.slug,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      descriptionAr: body.descriptionAr || null,
      descriptionEn: body.descriptionEn || null,
      image: imagePath,
      icon: body.icon || null
    }});
    res.status(201).json({ ok: true, category: mapCategory(created) });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ ok: false, error: 'SLUG_EXISTS' });
    res.status(500).json({ ok: false, error: 'FAILED_CREATE', message: e.message });
  }
});

// Update category (admin)
router.put('/:id', requireAdmin, (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) {
    upload.single('image')(req,res,function(err){
      if (err) {
        if (err.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).json({ ok:false, error:'UNSUPPORTED_FILE_TYPE', message:'صيغة غير مدعومة' });
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ ok:false, error:'FILE_TOO_LARGE', message:'الحجم الأقصى 2MB' });
        return res.status(400).json({ ok:false, error:'UPLOAD_ERROR', message: err.message });
      }
      next();
    });
  } else { next(); }
}, async (req, res) => {
  try {
    const body = req.body || {};
    let imageData = {};
    if (req.file) {
      const fullPath = req.file.path;
      const thumbName = req.file.filename.replace(/\.[^.]+$/, '') + '_thumb.webp';
      const thumbPath = path.join(catUploadsDir, thumbName);
      try { await sharp(fullPath).resize(300,300,{ fit:'cover' }).toFormat('webp').toFile(thumbPath); } catch {}
      imageData.image = '/uploads/category-images/' + req.file.filename;
    } else if (body.image) {
      imageData.image = body.image;
    }
    const updated = await prisma.category.update({ where: { id: req.params.id }, data: {
      slug: body.slug ?? undefined,
      nameAr: body.nameAr ?? undefined,
      nameEn: body.nameEn ?? undefined,
      descriptionAr: body.descriptionAr ?? undefined,
      descriptionEn: body.descriptionEn ?? undefined,
      icon: (body.icon === undefined ? undefined : (body.icon || null)),
      ...imageData
    }});
    res.json({ ok: true, category: mapCategory(updated) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (e.code === 'P2002') return res.status(409).json({ ok: false, error: 'SLUG_EXISTS' });
    res.status(500).json({ ok: false, error: 'FAILED_UPDATE', message: e.message });
  }
});

// Delete category (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    res.status(500).json({ ok: false, error: 'FAILED_DELETE', message: e.message });
  }
});

export default router;

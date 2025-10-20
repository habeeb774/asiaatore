import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// ---- Logo Upload Setup ----
const logosDir = path.join(process.cwd(), 'uploads', 'brand-logos');
if (!fs.existsSync(logosDir)) { try { fs.mkdirSync(logosDir, { recursive: true }); } catch {} }
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, logosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    cb(null, 'brand_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext);
  }
});
const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png','image/jpeg','image/webp','image/svg+xml'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    cb(null, true);
  }
});

function brandUploadMiddleware(req, res, next) {
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) {
    logoUpload.single('logo')(req, res, (err) => {
      if (err) {
        if (err.message === 'UNSUPPORTED_FILE_TYPE') return res.status(400).json({ error:'UNSUPPORTED_FILE_TYPE', message:'Allowed: PNG/JPEG/WEBP/SVG' });
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error:'FILE_TOO_LARGE', message:'Max 2MB' });
        return res.status(400).json({ error:'UPLOAD_ERROR', message: err.message });
      }
      next();
    });
  } else { next(); }
}

const router = Router();
const ALLOW_DEGRADED = process.env.ALLOW_INVALID_DB === 'true';

function buildLogoVariants(logoPath){
  if (!logoPath) return null;
  if (!logoPath.startsWith('/uploads/brand-logos/')) return { original: logoPath };
  const base = logoPath.replace(/\.[^.]+$/, '');
  return {
    original: logoPath,
    thumb: base + '_thumb.webp',
    medium: base + '_md.webp'
  };
}

function mapBrand(b){
  const variants = buildLogoVariants(b.logo);
  return {
    id: b.id,
    slug: b.slug,
    name: { ar: b.nameAr, en: b.nameEn },
    description: { ar: b.descriptionAr, en: b.descriptionEn },
    logo: b.logo,
    logoVariants: variants,
    productCount: b._count?.products || 0,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt
  };
}

router.get('/', async (_req,res) => {
  try {
    const list = await prisma.brand.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { products: true } } } });
    res.json(list.map(mapBrand));
  } catch (e) {
    if (ALLOW_DEGRADED) {
      res.setHeader('x-fallback', 'degraded');
      return res.json([]);
    }
    res.status(500).json({ error:'FAILED_LIST_BRANDS', message: e.message });
  }
});

router.get('/slug/:slug', async (req,res) => {
  try {
    const b = await prisma.brand.findUnique({ where: { slug: req.params.slug } });
    if (!b) return res.status(404).json({ error:'NOT_FOUND' });
    res.json(mapBrand(b));
  } catch (e) {
    if (ALLOW_DEGRADED) return res.status(404).json({ error: 'NOT_FOUND' });
    res.status(500).json({ error:'FAILED_GET_BRAND', message:e.message });
  }
});

router.post('/', requireAdmin, brandUploadMiddleware, async (req,res) => {
  try {
    const body = req.body || {};
    if (!body.slug) body.slug = 'brand-' + Date.now();
    let logoPath = body.logo || null;
    if (req.file) {
      logoPath = '/uploads/brand-logos/' + req.file.filename;
      // generate variants (square-ish center crop to transparent background preserved via webp)
      try {
        const full = req.file.path;
        const baseNoExt = full.replace(/\.[^.]+$/, '');
        await sharp(full).resize(120,120,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(full).resize(320,180,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(baseNoExt + '_md.webp');
      } catch {}
    }
    const created = await prisma.brand.create({ data: {
      slug: body.slug,
      nameAr: body.nameAr || body.name?.ar || 'علامة',
      nameEn: body.nameEn || body.name?.en || 'Brand',
      descriptionAr: body.descriptionAr || body.description?.ar || null,
      descriptionEn: body.descriptionEn || body.description?.en || null,
      logo: logoPath
    }, include: { _count: { select: { products: true } } }});
    audit({ action:'brand.create', entity:'Brand', entityId: created.id, userId: req.user?.id, meta:{ slug: created.slug } });
    res.status(201).json(mapBrand(created));
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error:'SLUG_EXISTS' });
    res.status(400).json({ error:'FAILED_CREATE_BRAND', message:e.message });
  }
});

router.put('/:id', requireAdmin, brandUploadMiddleware, async (req,res) => {
  try {
    const body = req.body || {};
    let logoPath = body.logo;
    if (req.file) {
      logoPath = '/uploads/brand-logos/' + req.file.filename;
      try {
        const full = req.file.path;
        const baseNoExt = full.replace(/\.[^.]+$/, '');
        await sharp(full).resize(120,120,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(full).resize(320,180,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(baseNoExt + '_md.webp');
      } catch {}
    }
    const updated = await prisma.brand.update({ where:{ id:req.params.id }, data:{
      slug: body.slug,
      nameAr: body.nameAr || body.name?.ar,
      nameEn: body.nameEn || body.name?.en,
      descriptionAr: body.descriptionAr || body.description?.ar,
      descriptionEn: body.descriptionEn || body.description?.en,
      logo: logoPath
    }, include: { _count: { select: { products: true } } }});
    audit({ action:'brand.update', entity:'Brand', entityId: updated.id, userId: req.user?.id });
    res.json(mapBrand(updated));
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error:'NOT_FOUND' });
    if (e.code === 'P2002') return res.status(409).json({ error:'SLUG_EXISTS' });
    res.status(400).json({ error:'FAILED_UPDATE_BRAND', message:e.message });
  }
});

router.delete('/:id', requireAdmin, async (req,res) => {
  try {
    // Fetch brand and product count
    const existing = await prisma.brand.findUnique({ where:{ id:req.params.id }, include: { _count: { select: { products: true } } } });
    if (!existing) return res.status(404).json({ error:'NOT_FOUND' });
    const hasProducts = (existing._count?.products || 0) > 0;
    const force = String(req.query.force||'') === '1' || String(req.query.force||'').toLowerCase() === 'true';
    const reassignTo = req.query.reassignTo ? String(req.query.reassignTo) : null;
    if (hasProducts && !force && !reassignTo) {
      return res.status(409).json({ error:'BRAND_IN_USE', message:'Brand has products. Use force=1 to unassign or provide reassignTo brandId.' });
    }

    const removed = await prisma.$transaction(async (tx) => {
      if (hasProducts) {
        if (reassignTo) {
          const target = await tx.brand.findUnique({ where: { id: reassignTo } });
          if (!target) throw Object.assign(new Error('REASSIGN_TARGET_NOT_FOUND'), { code:'REASSIGN_TARGET_NOT_FOUND' });
          await tx.product.updateMany({ where: { brandId: existing.id }, data: { brandId: reassignTo } });
        } else if (force) {
          await tx.product.updateMany({ where: { brandId: existing.id }, data: { brandId: null } });
        }
      }
      const del = await tx.brand.delete({ where:{ id: existing.id }, include: { _count: { select: { products: true } } } });
      return del;
    });

    // Attempt filesystem cleanup (original + variants) if local upload path
    if (existing.logo && existing.logo.startsWith('/uploads/brand-logos/')) {
      const abs = path.join(process.cwd(), existing.logo.replace(/^\//,''));
      const baseNoExt = abs.replace(/\.[^.]+$/, '');
      for (const f of [abs, baseNoExt + '_thumb.webp', baseNoExt + '_md.webp']) {
        try { fs.unlinkSync(f); } catch {}
      }
    }
    audit({ action:'brand.delete', entity:'Brand', entityId: removed.id, userId: req.user?.id, meta: { forced: hasProducts && (force || !!reassignTo), reassignTo } });
    res.json({ ok:true, removed: mapBrand(removed) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error:'NOT_FOUND' });
    res.status(400).json({ error:'FAILED_DELETE_BRAND', message:e.message });
  }
});

export default router;

// ---- Maintenance Utilities ----
router.get('/maintenance/scan', requireAdmin, async (_req, res) => {
  try {
    const list = await prisma.brand.findMany({ include: { _count: { select: { products: true } } } });
  const normalize = (s) => (s||'').toString().trim().toLowerCase().replace(/[\s_/-]+/g,' ').replace(/[\u064B-\u0652]/g,'');
    const byNameKey = new Map();
    for (const b of list) {
      const key = normalize(b.nameAr || b.nameEn || b.slug);
      const arr = byNameKey.get(key) || []; arr.push(b); byNameKey.set(key, arr);
    }
    const duplicateNames = Array.from(byNameKey.entries()).filter(([,arr]) => arr.length > 1).map(([key, arr]) => ({ key, ids: arr.map(x=>x.id), slugs: arr.map(x=>x.slug) }));
    const noLogo = list.filter(b => !b.logo);
    const zeroProducts = list.filter(b => (b._count?.products || 0) === 0);
    // Missing logo variants (only check if local uploads path and variants absent)
    const missingLogoVariants = [];
    for (const b of list) {
      const v = buildLogoVariants(b.logo);
      if (b.logo && b.logo.startsWith('/uploads/brand-logos/') && v?.thumb && v?.medium) {
        const absThumb = path.join(process.cwd(), v.thumb.replace(/^\//,''));
        const absMd = path.join(process.cwd(), v.medium.replace(/^\//,''));
        const okThumb = fs.existsSync(absThumb);
        const okMd = fs.existsSync(absMd);
        if (!okThumb || !okMd) missingLogoVariants.push({ id: b.id, slug: b.slug, logo: b.logo });
      }
    }
    res.json({ ok: true, issues: { duplicateNames, noLogo: noLogo.map(mapBrand), zeroProducts: zeroProducts.map(mapBrand), missingLogoVariants } });
  } catch (e) {
    res.status(500).json({ ok:false, error:'MAINTENANCE_SCAN_FAILED', message: e.message });
  }
});

router.post('/maintenance/regen-logos', requireAdmin, async (req, res) => {
  try {
    const { brandId } = req.body || {};
    const where = brandId ? { id: String(brandId) } : {};
    const list = await prisma.brand.findMany({ where });
    let regenerated = 0;
    for (const b of list) {
      if (!b.logo || !b.logo.startsWith('/uploads/brand-logos/')) continue;
      const abs = path.join(process.cwd(), b.logo.replace(/^\//,''));
      const baseNoExt = abs.replace(/\.[^.]+$/, '');
      try {
        await sharp(abs).resize(120,120,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(abs).resize(320,180,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(baseNoExt + '_md.webp');
        regenerated++;
      } catch {}
    }
    res.json({ ok:true, regenerated });
  } catch (e) {
    res.status(500).json({ ok:false, error:'REGEN_LOGOS_FAILED', message:e.message });
  }
});

router.post('/maintenance/merge', requireAdmin, async (req, res) => {
  try {
    const { targetId, sourceIds } = req.body || {};
    if (!targetId || !Array.isArray(sourceIds) || !sourceIds.length) {
      return res.status(400).json({ ok:false, error:'INVALID_INPUT', message:'Provide targetId and sourceIds[]' });
    }
    const target = await prisma.brand.findUnique({ where: { id: String(targetId) } });
    if (!target) return res.status(404).json({ ok:false, error:'TARGET_NOT_FOUND' });
    const sources = await prisma.brand.findMany({ where: { id: { in: sourceIds.map(String) } } });
    const foundIds = new Set(sources.map(s=>s.id));
    const missing = sourceIds.filter(id => !foundIds.has(String(id)));
    if (missing.length) return res.status(404).json({ ok:false, error:'SOURCES_NOT_FOUND', missing });
    await prisma.$transaction(async (tx) => {
      for (const s of sources) {
        await tx.product.updateMany({ where: { brandId: s.id }, data: { brandId: target.id } });
        await tx.brand.delete({ where: { id: s.id } });
      }
    });
    audit({ action:'brand.merge', entity:'Brand', entityId: target.id, userId: req.user?.id, meta: { sources: sourceIds } });
    res.json({ ok:true, targetId, merged: sourceIds.length });
  } catch (e) {
    res.status(400).json({ ok:false, error:'MERGE_FAILED', message:e.message });
  }
});

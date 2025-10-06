import { Router } from 'express';
import prisma from '../db/client.js';
import { requireAdmin } from '../middleware/auth.js';
import { audit } from '../utils/audit.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const router = Router();

// ---- Banner Image Upload ----
const bannersDir = path.join(process.cwd(), 'uploads', 'marketing-banners');
if (!fs.existsSync(bannersDir)) { try { fs.mkdirSync(bannersDir, { recursive: true }); } catch {} }
const bannerStorage = multer.diskStorage({
  destination: (_req,_file,cb) => cb(null, bannersDir),
  filename: (_req,file,cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';
    cb(null, 'banner_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext);
  }
});
const bannerUpload = multer({
  storage: bannerStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req,file,cb) => {
    const allowed = ['image/png','image/jpeg','image/webp','image/svg+xml'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('UNSUPPORTED_FILE_TYPE'));
    cb(null,true);
  }
});
function bannerUploadMiddleware(req,res,next){
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) {
    bannerUpload.single('image')(req,res,(err)=>{
      if (err){
        if (err.message==='UNSUPPORTED_FILE_TYPE') return res.status(400).json({ error:'UNSUPPORTED_FILE_TYPE', message:'Allowed: PNG/JPEG/WEBP/SVG' });
        if (err.code==='LIMIT_FILE_SIZE') return res.status(400).json({ error:'FILE_TOO_LARGE', message:'Max 3MB' });
        return res.status(400).json({ error:'UPLOAD_ERROR', message: err.message });
      }
      next();
    });
  } else next();
}

const mapFeature = f => ({ id:f.id, title:{ ar:f.titleAr, en:f.titleEn }, body:{ ar:f.bodyAr, en:f.bodyEn }, icon:f.icon, sort:f.sort, active:f.active });
function buildBannerVariants(image){
  if (!image) return null;
  if (!image.startsWith('/uploads/marketing-banners/')) return { original: image };
  const base = image.replace(/\.[^.]+$/, '');
  return {
    original: image,
    thumb: base + '_thumb.webp',
    medium: base + '_md.webp',
    large: base + '_lg.webp'
  };
}
const mapBanner = b => ({ id:b.id, location:b.location, title:{ ar:b.titleAr, en:b.titleEn }, body:{ ar:b.bodyAr, en:b.bodyEn }, image:b.image, imageVariants: buildBannerVariants(b.image), linkUrl:b.linkUrl, sort:b.sort, active:b.active });
const mapAppLink = a => ({ id:a.id, platform:a.platform, url:a.url, label:{ ar:a.labelAr, en:a.labelEn }, active:a.active });

router.get('/features', async (_req,res) => {
  try { const list = await prisma.marketingFeature.findMany({ orderBy:[{ active:'desc' },{ sort:'asc' }] }); res.json(list.map(mapFeature)); }
  catch(e){ res.status(500).json({ error:'FAILED_LIST_FEATURES', message:e.message }); }
});
router.post('/features', requireAdmin, async (req,res) => {
  try { const b=req.body||{}; const created = await prisma.marketingFeature.create({ data:{
    titleAr:b.titleAr||b.title?.ar||'ميزة', titleEn:b.titleEn||b.title?.en||'Feature', bodyAr:b.bodyAr||b.body?.ar||null, bodyEn:b.bodyEn||b.body?.en||null, icon:b.icon||null, sort:Number.isFinite(+b.sort)?+b.sort:0, active:b.active===false?false:true
  }}); audit({ action:'marketing.feature.create', entity:'MarketingFeature', entityId: created.id, userId: req.user?.id }); res.status(201).json(mapFeature(created)); } catch(e){ res.status(400).json({ error:'FAILED_CREATE_FEATURE', message:e.message }); }
});
router.patch('/features/:id', requireAdmin, async (req,res) => {
  try { const b=req.body||{}; const updated = await prisma.marketingFeature.update({ where:{ id:req.params.id }, data:{
    titleAr:b.titleAr||b.title?.ar, titleEn:b.titleEn||b.title?.en, bodyAr:b.bodyAr||b.body?.ar, bodyEn:b.bodyEn||b.body?.en, icon:b.icon, sort:Number.isFinite(+b.sort)?+b.sort:undefined, active: b.active===true||b.active===false?b.active:undefined
  }}); audit({ action:'marketing.feature.update', entity:'MarketingFeature', entityId: updated.id, userId: req.user?.id }); res.json(mapFeature(updated)); } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_UPDATE_FEATURE', message:e.message }); }
});
router.delete('/features/:id', requireAdmin, async (req,res) => {
  try { const removed = await prisma.marketingFeature.delete({ where:{ id:req.params.id } }); audit({ action:'marketing.feature.delete', entity:'MarketingFeature', entityId: removed.id, userId: req.user?.id }); res.json({ ok:true, removed: mapFeature(removed) }); } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_DELETE_FEATURE', message:e.message }); }
});

router.get('/banners', async (_req,res) => {
  try { const list = await prisma.marketingBanner.findMany({ orderBy:[{ active:'desc' },{ sort:'asc' }] }); res.json(list.map(mapBanner)); }
  catch(e){ res.status(500).json({ error:'FAILED_LIST_BANNERS', message:e.message }); }
});
router.post('/banners', requireAdmin, bannerUploadMiddleware, async (req,res) => {
  try { const b=req.body||{}; let imagePath = req.file ? ('/uploads/marketing-banners/' + req.file.filename) : (b.image||null);
    if (req.file) {
      try {
        const full = req.file.path;
        const baseNoExt = full.replace(/\.[^.]+$/, '');
        await sharp(full).resize(320,160,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(full).resize(800,360,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
        await sharp(full).resize(1280,480,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
      } catch{}
    }
    const created = await prisma.marketingBanner.create({ data:{
      location:b.location||'homepage', titleAr:b.titleAr||b.title?.ar||null, titleEn:b.titleEn||b.title?.en||null, bodyAr:b.bodyAr||b.body?.ar||null, bodyEn:b.bodyEn||b.body?.en||null, image:imagePath, linkUrl:b.linkUrl||null, sort:Number.isFinite(+b.sort)?+b.sort:0, active:b.active===false?false:true
    }}); audit({ action:'marketing.banner.create', entity:'MarketingBanner', entityId: created.id, userId: req.user?.id }); res.status(201).json(mapBanner(created)); } catch(e){ res.status(400).json({ error:'FAILED_CREATE_BANNER', message:e.message }); }
});
router.patch('/banners/:id', requireAdmin, bannerUploadMiddleware, async (req,res) => {
  try { const b=req.body||{}; let imagePath = b.image;
    if (req.file) {
      imagePath = '/uploads/marketing-banners/' + req.file.filename;
      try {
        const full = req.file.path;
        const baseNoExt = full.replace(/\.[^.]+$/, '');
        await sharp(full).resize(320,160,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_thumb.webp');
        await sharp(full).resize(800,360,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_md.webp');
        await sharp(full).resize(1280,480,{ fit:'cover' }).toFormat('webp').toFile(baseNoExt + '_lg.webp');
      } catch{}
    }
    const data = {
      location:b.location, titleAr:b.titleAr||b.title?.ar, titleEn:b.titleEn||b.title?.en, bodyAr:b.bodyAr||b.body?.ar, bodyEn:b.bodyEn||b.body?.en, image:imagePath, linkUrl:b.linkUrl, sort:Number.isFinite(+b.sort)?+b.sort:undefined, active: b.active===true||b.active===false?b.active:undefined
    }; const updated = await prisma.marketingBanner.update({ where:{ id:req.params.id }, data }); audit({ action:'marketing.banner.update', entity:'MarketingBanner', entityId: updated.id, userId: req.user?.id }); res.json(mapBanner(updated)); } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_UPDATE_BANNER', message:e.message }); }
});
router.delete('/banners/:id', requireAdmin, async (req,res) => {
  try {
    const existing = await prisma.marketingBanner.findUnique({ where:{ id:req.params.id } });
    if (!existing) return res.status(404).json({ error:'NOT_FOUND' });
    const removed = await prisma.marketingBanner.delete({ where:{ id:req.params.id } });
    // Cleanup files for image & variants
    if (existing.image && existing.image.startsWith('/uploads/marketing-banners/')) {
      const abs = path.join(process.cwd(), existing.image.replace(/^\//,''));
      const baseNoExt = abs.replace(/\.[^.]+$/, '');
      for (const f of [abs, baseNoExt + '_thumb.webp', baseNoExt + '_md.webp', baseNoExt + '_lg.webp']) {
        try { fs.unlinkSync(f); } catch {}
      }
    }
    audit({ action:'marketing.banner.delete', entity:'MarketingBanner', entityId: removed.id, userId: req.user?.id });
    res.json({ ok:true, removed: mapBanner(removed) });
  } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_DELETE_BANNER', message:e.message }); }
});

router.get('/app-links', async (_req,res) => {
  try { const list = await prisma.appLink.findMany({ orderBy:[{ platform:'asc' }] }); res.json(list.map(mapAppLink)); }
  catch(e){ res.status(500).json({ error:'FAILED_LIST_APP_LINKS', message:e.message }); }
});
router.post('/app-links', requireAdmin, async (req,res) => {
  try { const b=req.body||{}; const created = await prisma.appLink.create({ data:{
    platform:b.platform||'web', url:b.url||'https://example.com', labelAr:b.labelAr||b.label?.ar||null, labelEn:b.labelEn||b.label?.en||null, active:b.active===false?false:true
  }}); audit({ action:'marketing.applink.create', entity:'AppLink', entityId: created.id, userId: req.user?.id }); res.status(201).json(mapAppLink(created)); } catch(e){ res.status(400).json({ error:'FAILED_CREATE_APP_LINK', message:e.message }); }
});
router.patch('/app-links/:id', requireAdmin, async (req,res) => {
  try { const b=req.body||{}; const updated = await prisma.appLink.update({ where:{ id:req.params.id }, data:{
    platform:b.platform, url:b.url, labelAr:b.labelAr||b.label?.ar, labelEn:b.labelEn||b.label?.en, active: b.active===true||b.active===false?b.active:undefined
  }}); audit({ action:'marketing.applink.update', entity:'AppLink', entityId: updated.id, userId: req.user?.id }); res.json(mapAppLink(updated)); } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_UPDATE_APP_LINK', message:e.message }); }
});
router.delete('/app-links/:id', requireAdmin, async (req,res) => {
  try { const removed = await prisma.appLink.delete({ where:{ id:req.params.id } }); audit({ action:'marketing.applink.delete', entity:'AppLink', entityId: removed.id, userId: req.user?.id }); res.json({ ok:true, removed: mapAppLink(removed) }); } catch(e){ if (e.code==='P2025') return res.status(404).json({ error:'NOT_FOUND' }); res.status(400).json({ error:'FAILED_DELETE_APP_LINK', message:e.message }); }
});

// Lightweight click tracking endpoint (no new table; stored via AuditLog only for now)
router.post('/track', async (req,res) => {
  try {
    const b = req.body || {};
    const type = b.type; // 'banner' | 'appLink' | 'feature'
    const id = b.id;
    if (!type || !id) return res.status(400).json({ error:'MISSING_FIELDS' });
    const allowed = ['banner','appLink','feature'];
    if (!allowed.includes(type)) return res.status(400).json({ error:'INVALID_TYPE' });
    audit({ action:`marketing.click.${type}`, entity:'MarketingInteraction', entityId: id, userId: req.user?.id, meta:{ type } });
    res.json({ ok:true });
  } catch(e){ res.status(400).json({ error:'FAILED_TRACK', message:e.message }); }
});

// --- Metrics / Aggregation (click counts) ---
router.get('/metrics', async (req,res) => {
  try {
    const days = Math.min(180, Math.max(1, parseInt(req.query.days || '30', 10)));
    const from = new Date(Date.now() - days*24*60*60*1000);
    const actions = ['marketing.click.banner','marketing.click.appLink','marketing.click.feature'];
    // group by action + entityId
    const rows = await prisma.auditLog.groupBy({
      by: ['action','entityId'],
      where: { action: { in: actions }, createdAt: { gte: from } },
      _count: { _all: true }
    });
    const bucket = { banner: [], appLink: [], feature: [] };
    for (const r of rows) {
      const t = r.action.split('.').pop(); // banner | appLink | feature
      if (bucket[t]) bucket[t].push({ id: r.entityId, count: r._count._all });
    }
    // Enrich names (batch fetch)
    const enrich = async () => {
      if (bucket.banner.length) {
        const ids = bucket.banner.map(b=>b.id);
        const banners = await prisma.marketingBanner.findMany({ where:{ id:{ in: ids } }, select:{ id:true, titleAr:true, titleEn:true } });
        const map = Object.fromEntries(banners.map(b=>[b.id,b]));
        bucket.banner = bucket.banner.map(b => ({ ...b, titleAr: map[b.id]?.titleAr || null, titleEn: map[b.id]?.titleEn || null }));
      }
      if (bucket.appLink.length) {
        const ids = bucket.appLink.map(a=>a.id);
        const appLinks = await prisma.appLink.findMany({ where:{ id:{ in: ids } }, select:{ id:true, platform:true, labelAr:true, labelEn:true } });
        const map = Object.fromEntries(appLinks.map(a=>[a.id,a]));
        bucket.appLink = bucket.appLink.map(a => ({ ...a, platform: map[a.id]?.platform || null, labelAr: map[a.id]?.labelAr || null, labelEn: map[a.id]?.labelEn || null }));
      }
      if (bucket.feature.length) {
        const ids = bucket.feature.map(f=>f.id);
        const features = await prisma.marketingFeature.findMany({ where:{ id:{ in: ids } }, select:{ id:true, titleAr:true, titleEn:true } });
        const map = Object.fromEntries(features.map(f=>[f.id,f]));
        bucket.feature = bucket.feature.map(f => ({ ...f, titleAr: map[f.id]?.titleAr || null, titleEn: map[f.id]?.titleEn || null }));
      }
    };
    await enrich();
    // Sort descending by count
    for (const k of Object.keys(bucket)) bucket[k] = bucket[k].sort((a,b)=> b.count - a.count);
    res.json({ period:{ from: from.toISOString(), to: new Date().toISOString(), days }, ...bucket });
  } catch(e){ res.status(400).json({ error:'FAILED_METRICS', message:e.message }); }
});

export default router;

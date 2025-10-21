import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = express.Router();

// Resolve Prisma delegate for settings (handle schema naming drift: StoreSetting vs storesetting)
const getSettingsDelegate = () => (prisma.storeSetting || prisma.storesetting || null);

// Ensure settings table exists (lightweight bootstrap to avoid migration issues)
let SETTINGS_TABLE_ENSURED = false;
async function ensureSettingsTable() {
  if (SETTINGS_TABLE_ENSURED) return;
  try {
    // Create table if not exists (MySQL)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS StoreSetting (
        id VARCHAR(191) NOT NULL PRIMARY KEY,
        siteNameAr VARCHAR(191) NULL,
        siteNameEn VARCHAR(191) NULL,
        logo TEXT NULL,
        colorPrimary VARCHAR(32) NULL,
        colorSecondary VARCHAR(32) NULL,
        colorAccent VARCHAR(32) NULL,
        taxNumber VARCHAR(64) NULL,
        supportPhone VARCHAR(64) NULL,
        supportMobile VARCHAR(64) NULL,
        supportWhatsapp VARCHAR(64) NULL,
        supportEmail VARCHAR(128) NULL,
        supportHours VARCHAR(128) NULL,
        footerAboutAr TEXT NULL,
        footerAboutEn TEXT NULL,
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    // Ensure new columns exist even if table pre-existed
    const alters = [
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS taxNumber VARCHAR(64) NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS supportPhone VARCHAR(64) NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS supportMobile VARCHAR(64) NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS supportWhatsapp VARCHAR(64) NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS supportEmail VARCHAR(128) NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS supportHours VARCHAR(128) NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS footerAboutAr TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS footerAboutEn TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS linkBlog TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS linkSocial TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS linkReturns TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS linkPrivacy TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS appStoreUrl TEXT NULL",
      "ALTER TABLE StoreSetting ADD COLUMN IF NOT EXISTS playStoreUrl TEXT NULL"
    ];
    for (const sql of alters) {
      try { await prisma.$executeRawUnsafe(sql); } catch { /* ignore if not supported */ }
    }
    // Ensure singleton row
    await prisma.$executeRawUnsafe(`
      INSERT IGNORE INTO StoreSetting (id, siteNameAr, siteNameEn) VALUES ('singleton','شركة منفذ اسيا التجارية','My Store');
    `);
    SETTINGS_TABLE_ENSURED = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[SETTINGS] ensure table failed (may already exist):', e.message);
    SETTINGS_TABLE_ENSURED = true; // avoid spamming
  }
}

// Simple admin guard (expects attachUser before)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin only' });
  }
  next();
};

// Ensure uploads dir
const uploadsDir = path.join(process.cwd(), 'uploads', 'settings');
if (!fs.existsSync(uploadsDir)) { try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch { /* ignore */ } }

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const name = 'logo_' + Date.now() + ext.toLowerCase();
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!/^image\//.test(file.mimetype)) return cb(new Error('IMAGE_ONLY'));
    cb(null, true);
  }
});

// GET current settings (public)
router.get('/', async (_req, res) => {
  try {
    await ensureSettingsTable();
    const M = getSettingsDelegate();
    let setting = null;
    if (M && typeof M.findUnique === 'function') {
      setting = await M.findUnique({ where: { id: 'singleton' } });
    } else {
      try {
        const rows = await prisma.$queryRawUnsafe('SELECT * FROM StoreSetting WHERE id = "singleton" LIMIT 1');
        setting = Array.isArray(rows) && rows.length ? rows[0] : null;
      } catch {}
    }
    return res.json({ ok: true, setting: setting || null });
  } catch (e) {
    // Degraded fallback: provide sane defaults to keep the UI working in dev
    const fallbackEnabled = (
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_INVALID_DB === 'true' ||
      /Database|DB|connect/i.test(e?.message || '')
    );
    if (fallbackEnabled) {
      const defaultSetting = {
        id: 'singleton',
        siteNameAr: 'شركة منفذ اسيا التجارية',
        siteNameEn: 'My Store',
  logo: '/images/site-logo.png',
        colorPrimary: '#69be3c',
        colorSecondary: '#1f2937',
        colorAccent: '#ef4444',
        taxNumber: null,
        supportPhone: null,
        supportMobile: null,
        supportWhatsapp: null,
        supportEmail: null,
        supportHours: null,
        footerAboutAr: null,
        footerAboutEn: null,
        linkBlog: null,
        linkSocial: null,
        linkReturns: null,
        linkPrivacy: null,
        appStoreUrl: null,
        playStoreUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      res.setHeader('x-fallback', 'default-settings');
      return res.json({ ok: true, setting: defaultSetting });
    }
    return res.status(500).json({ ok: false, error: 'FAILED_GET', message: e.message });
  }
});

// PATCH update settings (admin)
router.patch('/', attachUser, requireAdmin, async (req, res) => {
  await ensureSettingsTable();
  const { siteNameAr, siteNameEn, colorPrimary, colorSecondary, colorAccent,
    taxNumber, supportPhone, supportMobile, supportWhatsapp, supportEmail, supportHours,
    footerAboutAr, footerAboutEn,
    linkBlog, linkSocial, linkReturns, linkPrivacy, appStoreUrl, playStoreUrl } = req.body || {};
  try {
    const data = {};
    if (siteNameAr !== undefined) data.siteNameAr = siteNameAr || null;
    if (siteNameEn !== undefined) data.siteNameEn = siteNameEn || null;
    if (colorPrimary !== undefined) data.colorPrimary = colorPrimary || null;
    if (colorSecondary !== undefined) data.colorSecondary = colorSecondary || null;
    if (colorAccent !== undefined) data.colorAccent = colorAccent || null;
    if (taxNumber !== undefined) data.taxNumber = taxNumber || null;
    if (supportPhone !== undefined) data.supportPhone = supportPhone || null;
    if (supportMobile !== undefined) data.supportMobile = supportMobile || null;
    if (supportWhatsapp !== undefined) data.supportWhatsapp = supportWhatsapp || null;
    if (supportEmail !== undefined) data.supportEmail = supportEmail || null;
    if (supportHours !== undefined) data.supportHours = supportHours || null;
    if (footerAboutAr !== undefined) data.footerAboutAr = footerAboutAr || null;
    if (footerAboutEn !== undefined) data.footerAboutEn = footerAboutEn || null;
  if (linkBlog !== undefined) data.linkBlog = linkBlog || null;
  if (linkSocial !== undefined) data.linkSocial = linkSocial || null;
  if (linkReturns !== undefined) data.linkReturns = linkReturns || null;
  if (linkPrivacy !== undefined) data.linkPrivacy = linkPrivacy || null;
  if (appStoreUrl !== undefined) data.appStoreUrl = appStoreUrl || null;
  if (playStoreUrl !== undefined) data.playStoreUrl = playStoreUrl || null;
    const now = new Date();
    const M = getSettingsDelegate();
    if (M && typeof M.upsert === 'function') {
      const updated = await M.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', ...data, updatedAt: now },
        update: { ...data, updatedAt: now }
      });
      return res.json({ ok: true, setting: updated });
    }
    // Fallback: raw SQL
    const fields = Object.keys(data);
    if (!fields.length) {
      const rows = await prisma.$queryRawUnsafe('SELECT * FROM StoreSetting WHERE id = "singleton" LIMIT 1');
      const setting = Array.isArray(rows) && rows.length ? rows[0] : null;
      return res.json({ ok: true, setting });
    }
    const sets = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => data[k]);
    // Ensure row exists
    await prisma.$executeRawUnsafe('INSERT IGNORE INTO StoreSetting (id) VALUES ("singleton")');
    // Apply update
    await prisma.$executeRawUnsafe(`UPDATE StoreSetting SET ${sets}, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = "singleton"`, ...values);
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM StoreSetting WHERE id = "singleton" LIMIT 1');
    const setting = Array.isArray(rows) && rows.length ? rows[0] : null;
    return res.json({ ok: true, setting });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'UPDATE_FAILED', message: e.message });
  }
});

// POST upload logo (admin, multipart)
router.post('/logo', attachUser, requireAdmin, (req, res) => {
  upload.single('logo')(req, res, async function(err) {
    if (err) return res.status(400).json({ ok:false, error:'UPLOAD_ERROR', message: err.message });
    try {
      await ensureSettingsTable();
      const file = req.file;
      if (!file) return res.status(400).json({ ok:false, error:'NO_FILE' });
      // create webp optimized copy (skip for SVG), non-fatal on failure
      const ext = (path.extname(file.filename) || '').toLowerCase();
      const isSvg = /\.svg$/.test(ext) || /image\/svg\+xml/i.test(file.mimetype || '');
      let rel = '/uploads/settings/' + file.filename;
      if (!isSvg) {
        try {
          const base = file.filename.slice(0, -ext.length);
          const webpName = base + '.webp';
          const webpPath = path.join(uploadsDir, webpName);
          await sharp(file.path)
            .resize(300, 300, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .toFormat('webp')
            .toFile(webpPath);
          if (fs.existsSync(webpPath)) {
            rel = '/uploads/settings/' + webpName;
          }
        } catch (e) {
          try { console.warn('[SETTINGS] sharp conversion failed, using original file:', e?.message || e); } catch {}
        }
      }

      // Try Prisma upsert first; fall back to raw SQL; if both fail, return ok with a warning
      let setting = null;
      try {
        const M = getSettingsDelegate();
        if (M && typeof M.upsert === 'function') {
          const updated = await M.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton', logo: rel, updatedAt: new Date() },
            update: { logo: rel, updatedAt: new Date() }
          });
          setting = updated;
        } else {
          await prisma.$executeRawUnsafe('INSERT IGNORE INTO StoreSetting (id) VALUES ("singleton")');
          await prisma.$executeRawUnsafe('UPDATE StoreSetting SET logo = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = "singleton"', rel);
          const rows = await prisma.$queryRawUnsafe('SELECT * FROM StoreSetting WHERE id = "singleton" LIMIT 1');
          setting = Array.isArray(rows) && rows.length ? rows[0] : null;
        }
        return res.json({ ok:true, logo: rel, setting });
      } catch (dbErr) {
        try { console.error('[SETTINGS] Failed to persist logo in DB:', dbErr); } catch {}
        // Graceful fallback: return success with warning so UI can continue
        return res.status(200).json({ ok: true, logo: rel, warning: 'DB_SAVE_FAILED', message: dbErr?.message || String(dbErr) });
      }
    } catch (e) {
      // Log full error for diagnostics
      try { console.error('[SETTINGS] LOGO upload failed:', e); } catch {}
      const payload = { ok:false, error:'LOGO_FAILED', message: e.message };
      if (process.env.DEBUG_ERRORS === 'true' && e?.stack) payload.stack = e.stack;
      res.status(500).json(payload);
    }
  });
});

export default router;

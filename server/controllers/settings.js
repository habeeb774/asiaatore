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
        /* UI customization fields (previewable via admin Settings) */
        ui_button_radius VARCHAR(64) NULL,
        ui_button_shadow TEXT NULL,
        ui_input_radius VARCHAR(64) NULL,
        ui_font_family VARCHAR(191) NULL,
        ui_base_font_size VARCHAR(32) NULL,
        ui_sidebar_hover_preview TINYINT(1) NULL,
        ui_sidebar_collapsed_default TINYINT(1) NULL,
        ui_spacing_scale VARCHAR(32) NULL,
        ui_theme_default VARCHAR(32) NULL,
        createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    `);
    // Column creation is now handled by Prisma migrations/db push.
    // Older MySQL versions don't support "ADD COLUMN IF NOT EXISTS" and would spam errors here.
    // We intentionally skip best-effort ALTERs to keep logs clean; the Prisma schema defines all columns.
    // Ensure singleton row
    await prisma.$executeRawUnsafe(`
      INSERT INTO StoreSetting (id, siteNameAr, siteNameEn) VALUES ('singleton','شركة منفذ اسيا التجارية','My Store')
      ON CONFLICT (id) DO NOTHING;
    `);
    SETTINGS_TABLE_ENSURED = true;
  } catch (e) {
     
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
    // In dev, if a local dev settings file exists, merge it over DB values (helps when DB lacks columns)
    const devOverlayEnabled = (process.env.NODE_ENV !== 'production' || process.env.ALLOW_INVALID_DB === 'true');
    if (devOverlayEnabled) {
      try {
        const devFile = path.join(uploadsDir, 'local-dev-settings.json');
        if (fs.existsSync(devFile)) {
          const raw = fs.readFileSync(devFile, 'utf-8');
          const overlay = JSON.parse(raw || '{}');
          if (overlay && typeof overlay === 'object') {
            setting = { ...(setting || {}), ...overlay };
          }
        }
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
  logo: '/images/site-logo.svg',
        colorPrimary: '#69be3c',
        colorSecondary: '#1f2937',
        colorAccent: '#ef4444',
        // hero & top-strip fallbacks
        heroBackgroundImage: 'https://picsum.photos/seed/hero/1600/900',
        heroBackgroundGradient: 'linear-gradient(90deg,#69be3c 0%, #0ea5e9 100%)',
        heroCenterImage: null,
        heroAutoplayInterval: 6000,
        topStripEnabled: true,
        topStripAutoscroll: true,
        topStripBackground: '#fde68a',
        // shipping & payments fallbacks
        shippingBase: 10,
        shippingPerKm: 0.7,
        shippingMin: 15,
        shippingMax: 60,
        shippingFallback: 25,
        originLat: 24.7136,
        originLng: 46.6753,
        payPaypalEnabled: false,
        payStcEnabled: true,
        payCodEnabled: true,
        payBankEnabled: true,
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
    companyNameAr, companyNameEn, commercialRegNo, addressAr, addressEn,
    linkBlog, linkSocial, linkReturns, linkPrivacy, appStoreUrl, playStoreUrl,
    // new visual fields
    logo, heroBackgroundImage, heroBackgroundGradient, heroCenterImage, heroAutoplayInterval,
    topStripEnabled, topStripAutoscroll, topStripBackground,
    // shipping config
    shippingBase, shippingPerKm, shippingMin, shippingMax, shippingFallback, originLat, originLng,
    // payments toggles
    payPaypalEnabled, payStcEnabled, payCodEnabled, payBankEnabled,
    // messaging toggle
    whatsappEnabled,
    // shipping providers
    aramexEnabled, aramexApiUrl, aramexApiKey, aramexApiUser, aramexApiPass, aramexWebhookSecret,
    smsaEnabled, smsaApiUrl, smsaApiKey, smsaWebhookSecret
  } = req.body || {};

  // ui_* visual fields (optional)
  const {
    ui_button_radius, ui_button_shadow, ui_input_radius, ui_font_family, ui_base_font_size,
    ui_sidebar_hover_preview, ui_sidebar_collapsed_default, ui_spacing_scale, ui_theme_default
  } = req.body || {};

  // Helpers
  const toBool = (v) => {
    if (v === null) return null;
    if (v === undefined) return undefined;
    const s = String(v).toLowerCase();
    if (v === true || s === 'true' || s === '1' || s === 'on' || s === 'yes') return true;
    if (v === false || s === 'false' || s === '0' || s === 'off' || s === 'no') return false;
    return !!v;
  };
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
  if (companyNameAr !== undefined) data.companyNameAr = companyNameAr || null;
  if (companyNameEn !== undefined) data.companyNameEn = companyNameEn || null;
  if (commercialRegNo !== undefined) data.commercialRegNo = commercialRegNo || null;
  if (addressAr !== undefined) data.addressAr = addressAr || null;
  if (addressEn !== undefined) data.addressEn = addressEn || null;
  // visual fields
  if (logo !== undefined) data.logo = logo || null;
  if (heroBackgroundImage !== undefined) data.heroBackgroundImage = heroBackgroundImage || null;
  if (heroBackgroundGradient !== undefined) data.heroBackgroundGradient = heroBackgroundGradient || null;
  if (heroCenterImage !== undefined) data.heroCenterImage = heroCenterImage || null;
  if (heroAutoplayInterval !== undefined) data.heroAutoplayInterval = heroAutoplayInterval || null;
  if (topStripEnabled !== undefined) data.topStripEnabled = toBool(topStripEnabled);
  if (topStripAutoscroll !== undefined) data.topStripAutoscroll = toBool(topStripAutoscroll);
  if (topStripBackground !== undefined) data.topStripBackground = topStripBackground || null;
  // UI customization
  if (ui_button_radius !== undefined) data.ui_button_radius = ui_button_radius || null;
  if (ui_button_shadow !== undefined) data.ui_button_shadow = ui_button_shadow || null;
  if (ui_input_radius !== undefined) data.ui_input_radius = ui_input_radius || null;
  if (ui_font_family !== undefined) data.ui_font_family = ui_font_family || null;
  if (ui_base_font_size !== undefined) data.ui_base_font_size = ui_base_font_size || null;
  if (ui_sidebar_hover_preview !== undefined) data.ui_sidebar_hover_preview = toBool(ui_sidebar_hover_preview);
  if (ui_sidebar_collapsed_default !== undefined) data.ui_sidebar_collapsed_default = toBool(ui_sidebar_collapsed_default);
  if (ui_spacing_scale !== undefined) data.ui_spacing_scale = ui_spacing_scale || null;
  if (ui_theme_default !== undefined) data.ui_theme_default = ui_theme_default || null;
  // messaging toggle
  if (whatsappEnabled !== undefined) data.whatsappEnabled = toBool(whatsappEnabled);
  // shipping config
  if (shippingBase !== undefined) data.shippingBase = shippingBase === '' ? null : Number(shippingBase);
  if (shippingPerKm !== undefined) data.shippingPerKm = shippingPerKm === '' ? null : Number(shippingPerKm);
  if (shippingMin !== undefined) data.shippingMin = shippingMin === '' ? null : Number(shippingMin);
  if (shippingMax !== undefined) data.shippingMax = shippingMax === '' ? null : Number(shippingMax);
  if (shippingFallback !== undefined) data.shippingFallback = shippingFallback === '' ? null : Number(shippingFallback);
  if (originLat !== undefined) data.originLat = originLat === '' ? null : Number(originLat);
  if (originLng !== undefined) data.originLng = originLng === '' ? null : Number(originLng);
  // payments toggles
  if (payPaypalEnabled !== undefined) data.payPaypalEnabled = toBool(payPaypalEnabled);
  if (payStcEnabled !== undefined) data.payStcEnabled = toBool(payStcEnabled);
  if (payCodEnabled !== undefined) data.payCodEnabled = toBool(payCodEnabled);
  if (payBankEnabled !== undefined) data.payBankEnabled = toBool(payBankEnabled);
  // shipping providers
  if (aramexEnabled !== undefined) data.aramexEnabled = toBool(aramexEnabled);
  if (aramexApiUrl !== undefined) data.aramexApiUrl = aramexApiUrl || null;
  if (aramexApiKey !== undefined) data.aramexApiKey = aramexApiKey || null;
  if (aramexApiUser !== undefined) data.aramexApiUser = aramexApiUser || null;
  if (aramexApiPass !== undefined) data.aramexApiPass = aramexApiPass || null;
  if (aramexWebhookSecret !== undefined) data.aramexWebhookSecret = aramexWebhookSecret || null;
  if (smsaEnabled !== undefined) data.smsaEnabled = toBool(smsaEnabled);
  if (smsaApiUrl !== undefined) data.smsaApiUrl = smsaApiUrl || null;
  if (smsaApiKey !== undefined) data.smsaApiKey = smsaApiKey || null;
  if (smsaWebhookSecret !== undefined) data.smsaWebhookSecret = smsaWebhookSecret || null;
  if (linkBlog !== undefined) data.linkBlog = linkBlog || null;
  if (linkSocial !== undefined) data.linkSocial = linkSocial || null;
  if (linkReturns !== undefined) data.linkReturns = linkReturns || null;
  if (linkPrivacy !== undefined) data.linkPrivacy = linkPrivacy || null;
  if (appStoreUrl !== undefined) data.appStoreUrl = appStoreUrl || null;
  if (playStoreUrl !== undefined) data.playStoreUrl = playStoreUrl || null;
  try {
    const now = new Date();
    const M = getSettingsDelegate();
    if (M && typeof M.upsert === 'function') {
      try {
        const updated = await M.upsert({
          where: { id: 'singleton' },
          create: { id: 'singleton', ...data, updatedAt: now },
          update: { ...data, updatedAt: now }
        });
        return res.json({ ok: true, setting: updated });
      } catch (e) {
        // Prisma may throw if schema lacks some columns (e.g., new toggles). Fallback to raw SQL path.
      }
    }
    // Fallback: raw SQL
    // Discover available columns to avoid "Unknown column" errors on drifted DBs
    let availableCols = [];
    try {
      const rows = await prisma.$queryRawUnsafe(
        "SELECT COLUMN_NAME as name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'StoreSetting'"
      );
      availableCols = Array.isArray(rows) ? rows.map(r => r.name || r.COLUMN_NAME).filter(Boolean) : [];
    } catch {}
    const allFields = Object.keys(data);
    const fields = availableCols.length ? allFields.filter(k => availableCols.includes(k)) : allFields;
    if (!fields.length) {
      const rows = await prisma.$queryRawUnsafe('SELECT * FROM StoreSetting WHERE id = "singleton" LIMIT 1');
      const setting = Array.isArray(rows) && rows.length ? rows[0] : null;
      return res.json({ ok: true, setting });
    }
  const sets = fields.map(k => `${k} = ?`).join(', ');
  // For raw SQL path, convert booleans to 0/1 to match TINYINT(1) columns
  const values = fields.map(k => typeof data[k] === 'boolean' ? (data[k] ? 1 : 0) : data[k]);
    // Ensure row exists
    await prisma.$executeRawUnsafe('INSERT IGNORE INTO StoreSetting (id) VALUES ("singleton")');
    // Apply update
    await prisma.$executeRawUnsafe(`UPDATE StoreSetting SET ${sets}, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = "singleton"`, ...values);
    const rows = await prisma.$queryRawUnsafe('SELECT * FROM StoreSetting WHERE id = "singleton" LIMIT 1');
    const setting = Array.isArray(rows) && rows.length ? rows[0] : null;
    return res.json({ ok: true, setting });
  } catch (e) {
    // Dev-friendly fallback when DB is unavailable or schema is incompatible
    const fallbackEnabled = (
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_INVALID_DB === 'true'
    );
    if (fallbackEnabled) {
      try {
        const devFile = path.join(uploadsDir, 'local-dev-settings.json');
        let current = {};
        try {
          if (fs.existsSync(devFile)) {
            const raw = fs.readFileSync(devFile, 'utf-8');
            current = JSON.parse(raw || '{}');
          }
        } catch {}
        const merged = { ...(current || {}), ...data, id: 'singleton', updatedAt: new Date().toISOString() };
        fs.writeFileSync(devFile, JSON.stringify(merged, null, 2));
        return res.json({ ok: true, setting: merged, warning: 'DEV_FALLBACK', message: 'Saved to local-dev-settings.json' });
      } catch (e2) {
        return res.status(400).json({ ok: false, error: 'UPDATE_FAILED', message: e.message + ' | fallback:' + (e2?.message || String(e2)) });
      }
    }
    return res.status(400).json({ ok: false, error: 'UPDATE_FAILED', message: e.message });
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

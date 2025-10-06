import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = express.Router();

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
        createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    // Ensure singleton row
    await prisma.$executeRawUnsafe(`
      INSERT IGNORE INTO StoreSetting (id, siteNameAr, siteNameEn) VALUES ('singleton','متجري','My Store');
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
  await ensureSettingsTable();
  const setting = await prisma.storeSetting.findUnique({ where: { id: 'singleton' } }).catch(()=>null);
  res.json({
    ok: true,
    setting: setting || null
  });
});

// PATCH update settings (admin)
router.patch('/', attachUser, requireAdmin, async (req, res) => {
  await ensureSettingsTable();
  const { siteNameAr, siteNameEn, colorPrimary, colorSecondary, colorAccent } = req.body || {};
  try {
    const data = {};
    if (siteNameAr !== undefined) data.siteNameAr = siteNameAr || null;
    if (siteNameEn !== undefined) data.siteNameEn = siteNameEn || null;
    if (colorPrimary !== undefined) data.colorPrimary = colorPrimary || null;
    if (colorSecondary !== undefined) data.colorSecondary = colorSecondary || null;
    if (colorAccent !== undefined) data.colorAccent = colorAccent || null;
    const updated = await prisma.storeSetting.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', ...data },
      update: data
    });
    res.json({ ok: true, setting: updated });
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
      // create webp optimized copy
      const ext = path.extname(file.filename);
      const base = file.filename.slice(0, -ext.length);
      const webpName = base + '.webp';
      const webpPath = path.join(uploadsDir, webpName);
      await sharp(file.path).resize(300,300,{ fit:'contain', background:{ r:255,g:255,b:255,alpha:0 } }).toFormat('webp').toFile(webpPath).catch(()=>null);
      const rel = '/uploads/settings/' + (fs.existsSync(webpPath) ? webpName : file.filename);
      const updated = await prisma.storeSetting.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', logo: rel },
        update: { logo: rel }
      });
      res.json({ ok:true, logo: rel, setting: updated });
    } catch (e) {
      res.status(500).json({ ok:false, error:'LOGO_FAILED', message: e.message });
    }
  });
});

export default router;

import express from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../db/client.js';
import { attachUser } from '../middleware/auth.js';

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads', 'ui-settings');
if (!fs.existsSync(uploadsDir)) { try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {} }

// GET current user's UI settings
router.get('/', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    // Prefer Prisma model if available
    if (prisma.uiSetting && typeof prisma.uiSetting.findUnique === 'function') {
      const row = await prisma.uiSetting.findUnique({ where: { userId: req.user.id } });
      return res.json({ ok: true, setting: row ? row.data : null });
    }
  } catch (e) {
    // ignore and fall through to file fallback
  }

  // Fallback: read from local file per-user
  try {
    const file = path.join(uploadsDir, `${req.user.id}.json`);
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      return res.json({ ok: true, setting: parsed });
    }
    return res.json({ ok: true, setting: null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'FAILED_READ', message: e.message });
  }
});

// POST save current user's settings (create/update)
router.post('/', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    const payload = req.body || {};
    // Try prisma upsert if delegate exists
    if (prisma.uiSetting && typeof prisma.uiSetting.upsert === 'function') {
      const rec = await prisma.uiSetting.upsert({
        where: { userId: req.user.id },
        create: { userId: req.user.id, data: payload },
        update: { data: payload }
      });
      return res.json({ ok: true, setting: rec.data });
    }
  } catch (e) {
    // swallow and fallback
    console.warn('[UI_SETTINGS] prisma upsert failed, falling back to file storage:', e?.message || e);
  }

  // Fallback: write local file
  try {
    const file = path.join(uploadsDir, `${req.user.id}.json`);
    fs.writeFileSync(file, JSON.stringify(req.body || {}, null, 2), 'utf-8');
    return res.json({ ok: true, setting: req.body || {} });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'FAILED_WRITE', message: e.message });
  }
});

// GET export (download) user's settings as JSON
router.get('/export', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
    let setting = null;
    if (prisma.uiSetting && typeof prisma.uiSetting.findUnique === 'function') {
      const row = await prisma.uiSetting.findUnique({ where: { userId: req.user.id } });
      setting = row ? row.data : null;
    }
    if (!setting) {
      const file = path.join(uploadsDir, `${req.user.id}.json`);
      if (fs.existsSync(file)) {
        setting = JSON.parse(fs.readFileSync(file, 'utf-8') || '{}');
      }
    }
    const out = JSON.stringify(setting || {}, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ui-settings-${req.user.id}.json"`);
    return res.send(out);
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'FAILED_EXPORT', message: e.message });
  }
});

export default router;

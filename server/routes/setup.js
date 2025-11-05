import express from 'express';
import prisma from '../db/client.js';

// Minimal setup routes. Intentionally unauthenticated but guarded to only allow when no users exist.
const router = express.Router();

async function noUsersExist() {
  try {
    const cnt = await prisma.user.count();
    return Number(cnt) === 0;
  } catch {
    // If DB not available, disallow to be safe
    return false;
  }
}

router.get('/ping', (_req, res) => res.json({ ok: true }));

router.post('/create-admin', async (req, res) => {
  try {
    if (!(await noUsersExist())) return res.status(403).json({ ok: false, error: 'ALREADY_INITIALIZED' });
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
    const created = await prisma.user.create({ data: { email, passwordHash: password, role: 'admin', name: name || 'Administrator' } });
    return res.json({ ok: true, userId: created.id });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'SETUP_FAILED', message: e.message });
  }
});

export default router;

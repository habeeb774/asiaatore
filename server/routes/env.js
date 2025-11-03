import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { attachUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

// Determine env file locations
function getPaths() {
  const root = process.cwd();
  const serverEnv = path.join(root, '.env');
  const clientLocal = path.join(root, 'client', '.env.local');
  const clientDev = path.join(root, 'client', '.env.development');
  const clientEnv = fs.existsSync(clientLocal) ? clientLocal : clientDev;
  return { serverEnv, clientEnv };
}

// Allowed keys for safety
const SERVER_KEYS = new Set([
  'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME',
  'ALLOW_INVALID_DB', 'QUICK_START_DB', 'ALLOW_DEV_HEADERS', 'CORS_ORIGIN',
  'WHATSAPP_PROVIDER', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID',
  'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'
]);

const CLIENT_KEYS = new Set([
  'VITE_PROXY_TARGET', 'VITE_API_URL', 'VITE_API_TIMEOUT_MS'
]);

const SECRET_KEYS = new Set(['DB_PASS', 'WHATSAPP_ACCESS_TOKEN', 'TWILIO_AUTH_TOKEN']);

function readEnvFile(file) {
  try {
    if (!fs.existsSync(file)) return {};
    const txt = fs.readFileSync(file, 'utf8');
    return { txt, obj: dotenv.parse(txt) };
  } catch {
    return { txt: '', obj: {} };
  }
}

function writeEnvFile(file, updates) {
  // Update or append keys in-place to preserve comments and unrelated lines
  const { txt } = readEnvFile(file);
  let out = txt || '';
  const lines = out.split(/\r?\n/);
  const map = new Map();
  lines.forEach((line, idx) => {
    const m = /^(\s*#.*|\s*)$/.test(line) ? null : line.match(/^(\w+)\s*=.*$/);
    if (m) map.set(m[1], idx);
  });
  Object.entries(updates || {}).forEach(([k, v]) => {
    if (!map.has(k)) {
      // Append
      out += (out.endsWith('\n') || out.length === 0 ? '' : '\n') + `${k}=${escapeEnvValue(v)}\n`;
    } else {
      const idx = map.get(k);
      lines[idx] = `${k}=${escapeEnvValue(v)}`;
      out = lines.join('\n');
    }
  });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out, 'utf8');
  return true;
}

function escapeEnvValue(v) {
  if (v == null) return '';
  const s = String(v);
  // Quote if contains spaces or #
  if (/\s|#/.test(s)) return JSON.stringify(s);
  return s;
}

function maskValue(key, val) {
  if (!val) return '';
  if (SECRET_KEYS.has(key)) return '********';
  // mask password in DATABASE_URL
  if (key === 'DATABASE_URL') {
    try {
      const u = new URL(val);
      if (u.password) return `${u.protocol}//${u.username ? u.username + ':' : ''}********@${u.host}${u.pathname}`;
    } catch {}
  }
  return val;
}

// GET /api/env — return whitelisted envs from both server and client files
router.get('/', attachUser, requireAdmin, (_req, res) => {
  const { serverEnv, clientEnv } = getPaths();
  const srv = readEnvFile(serverEnv).obj;
  const cli = readEnvFile(clientEnv).obj;
  const server = {};
  const client = {};
  SERVER_KEYS.forEach((k) => { if (srv[k] != null) server[k] = maskValue(k, srv[k]); });
  CLIENT_KEYS.forEach((k) => { if (cli[k] != null) client[k] = cli[k]; });
  return res.json({ ok: true, files: { serverEnv, clientEnv }, env: { server, client }, prod: isProd });
});

// PATCH /api/env — update entries in chosen scope (server|client)
router.patch('/', attachUser, requireAdmin, (req, res) => {
  if (isProd && process.env.ALLOW_ENV_EDIT !== 'true') {
    return res.status(403).json({ ok: false, error: 'FORBIDDEN', message: 'Editing env in production is disabled' });
  }
  const { scope, entries } = req.body || {};
  if (!scope || typeof entries !== 'object') return res.status(400).json({ ok: false, error: 'INVALID_BODY' });
  const { serverEnv, clientEnv } = getPaths();
  const file = scope === 'server' ? serverEnv : clientEnv;
  const allow = scope === 'server' ? SERVER_KEYS : CLIENT_KEYS;
  const updates = {};
  Object.entries(entries).forEach(([k, v]) => {
    if (!allow.has(k)) return; // skip unknown
    if (typeof v !== 'string') v = v == null ? '' : String(v);
    // If secret placeholder passed back, skip to preserve existing secret
    if (SECRET_KEYS.has(k) && v === '********') return;
    updates[k] = v;
  });
  try {
    writeEnvFile(file, updates);
    return res.json({ ok: true, file, updatedKeys: Object.keys(updates) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'ENV_WRITE_FAILED', message: e.message });
  }
});

// POST /api/env/db/test — test DB connection with provided url or parts
router.post('/db/test', attachUser, requireAdmin, async (req, res) => {
  const { databaseUrl, host, port, user, pass, name } = req.body || {};
  let url = databaseUrl;
  if (!url) {
    if (!host || !user || !name) return res.status(400).json({ ok: false, error: 'MISSING_DB_FIELDS' });
    const p = port ? String(port) : '3306';
    const safePass = pass != null ? encodeURIComponent(String(pass)) : '';
    url = `mysql://${encodeURIComponent(String(user))}${safePass ? ':' + safePass : ''}@${host}:${p}/${name}`;
  }
  try {
    const conn = await mysql.createConnection(url);
    const [rows] = await conn.query('SELECT VERSION() as version');
    await conn.end();
    return res.json({ ok: true, databaseUrl: maskValue('DATABASE_URL', url), version: rows?.[0]?.version || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'DB_CONNECT_FAILED', message: e.message });
  }
});

export default router;

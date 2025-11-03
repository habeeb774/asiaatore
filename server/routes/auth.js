import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/client.js';
import { signAccessToken, signRefreshToken, verifyToken, randomToken, sha256 } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';
import { requireAdmin, attachUser } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import { audit } from '../utils/audit.js';
import { sendSms } from '../utils/sms.js';

const router = Router();

// Feature-detection: not all databases include Session/AuthToken models.
// When the Prisma client does not expose these models (e.g., older schema),
// avoid calling their methods directly to prevent runtime TypeErrors.
const HAS_PRISMA_SESSION = !!prisma.session && typeof prisma.session.create === 'function';
const HAS_PRISMA_AUTHTOKEN = !!prisma.authToken && typeof prisma.authToken.create === 'function';

// Helper to set/clear refresh cookie
const REFRESH_COOKIE = 'rt';
// Compute cookie options per request to handle cross-site scenarios correctly
function cookieOpts(req) {
  const env = process.env.NODE_ENV || 'development';
  const wantNone = (process.env.CROSS_SITE_COOKIES === 'true') || (process.env.COOKIE_SAMESITE || '').toLowerCase() === 'none';
  // Detect HTTPS behind proxy
  const xfProto = (req.headers['x-forwarded-proto'] || '').toString().toLowerCase();
  const isHttps = req.secure || xfProto === 'https';
  const secure = env === 'production' ? true : isHttps;
  const sameSite = process.env.COOKIE_SAMESITE || (wantNone ? 'none' : 'lax');
  // When SameSite=None, browsers require Secure
  const finalSecure = sameSite.toLowerCase() === 'none' ? true : secure;
  return {
    httpOnly: true,
    secure: finalSecure,
    sameSite,
    path: '/api/auth',
  };
}

// Dev-mode login fallback (no DB) — enabled when DEBUG_LOGIN=1 or ALLOW_INVALID_DB=true
const DEV_AUTH_ENABLED = process.env.DEBUG_LOGIN === '1' || process.env.ALLOW_INVALID_DB === 'true';
const DEV_USERS = [
  {
    email: (process.env.DEV_ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
    pass: process.env.DEV_ADMIN_PASSWORD || 'admin123',
    role: 'admin', id: 'dev-admin', name: 'Dev Admin'
  },
  {
    email: (process.env.DEV_USER_EMAIL || 'user@example.com').toLowerCase(),
    pass: process.env.DEV_USER_PASSWORD || 'user123',
    role: 'user', id: 'dev-user', name: 'Dev User'
  }
];

// Login route using bcrypt password comparison
const loginSchema = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase()),
  password: z.string().min(1, 'MISSING_PASSWORD')
});
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body || {});
    if (!parsed.success) {
      // Align with frontend expectation for missing/invalid credentials
      return res.status(400).json({ ok:false, error: 'MISSING_CREDENTIALS', fields: parsed.error.flatten() });
    }
    const { email, password } = parsed.data;

    // Fast-path: allow dev login without DB when enabled
    if (DEV_AUTH_ENABLED) {
      const dev = DEV_USERS.find(u => u.email === email && u.pass === password);
      if (dev) {
        const accessToken = signAccessToken({ id: dev.id, role: dev.role, email: dev.email });
        // In dev fallback, skip issuing refresh cookies (no DB session). Client can keep access token in memory.
        return res.json({ ok:true, devFallback: true, accessToken, user: { id: dev.id, role: dev.role, email: dev.email, name: dev.name } });
      }
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (process.env.DEBUG_LOGIN === '1') console.warn('[LOGIN] Email not found:', email);
      const detailed = process.env.DEBUG_ERRORS === 'true' || process.env.NODE_ENV !== 'production';
      return res.status(401).json({ ok:false, error: detailed ? 'USER_NOT_FOUND' : 'INVALID_LOGIN' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      if (process.env.DEBUG_LOGIN === '1') console.warn('[LOGIN] Bad password for:', email);
      const detailed = process.env.DEBUG_ERRORS === 'true' || process.env.NODE_ENV !== 'production';
      return res.status(401).json({ ok:false, error: detailed ? 'WRONG_PASSWORD' : 'INVALID_LOGIN' });
    }
    // Access + Refresh (session-backed)
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });
    const rawRefresh = randomToken(48);
    const tokenHash = sha256(rawRefresh);
    const ttlMs = Number(process.env.REFRESH_TOKEN_TTL_MS || 1000*60*60*24*30);
    const expiresAt = new Date(Date.now() + ttlMs);
    const userAgent = req.headers['user-agent'] || null;
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString();
    // Create or reuse a session per device; here we always create a new session for simplicity
    try {
      if (HAS_PRISMA_SESSION) {
        await prisma.session.create({ data: { userId: user.id, refreshHash: tokenHash, userAgent, ip, expiresAt } });
      } else {
        if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session model missing; skipping session.create');
      }
    } catch (e) {
      // sessions table might not exist yet — fallback to legacy token
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session.create failed; falling back to AuthToken refresh:', e.message);
    }
    // Also keep legacy AuthToken for migrations/backward compatibility (optional)
    if (HAS_PRISMA_AUTHTOKEN) {
      await prisma.authToken.create({ data: { userId: user.id, type: 'refresh', tokenHash, expiresAt, userAgent, ip } }).catch(() => {});
    } else {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] authToken model missing; skipping authToken.create');
    }
    // Set HTTP-only cookie
  res.cookie(REFRESH_COOKIE, rawRefresh, { ...cookieOpts(req), maxAge: ttlMs });
    return res.json({ ok:true, accessToken, user: { id: user.id, role: user.role, email: user.email, name: user.name } });
  } catch (e) {
    const msg = e?.message || '';
    const isDbErr = e?.code === 'DB_DISABLED' || /Database|ECONNREFUSED|does not exist|connect/i.test(msg) || (e?.code && /^P\d+/.test(e.code));
    try { req.log?.error({ err: e, code: e?.code, message: e?.message }, 'LOGIN route error'); } catch {}
    if (process.env.DEBUG_LOGIN === '1' || process.env.NODE_ENV !== 'production') {
       
      console.error('[LOGIN] Error', { message: msg, code: e.code });
    }
    if (isDbErr) {
      return res.status(503).json({ ok:false, error: 'DB_UNAVAILABLE', devFallback: !!DEV_AUTH_ENABLED, message: 'Database offline. Use dev credentials if enabled.' });
    }
    return res.status(401).json({ ok:false, error: 'INVALID_LOGIN' });
  }
});

// Register new user
const registerSchema = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase()),
  password: z.string().min(6, 'WEAK_PASSWORD'),
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional()
});
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ ok:false, error:'MISSING_FIELDS', fields: parsed.error.flatten() });
    }
    const { email, password, name, phone } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ ok:false, error: 'EMAIL_EXISTS' });
    const hashed = await bcrypt.hash(password, 10);
    // Be resilient to DBs missing some columns (e.g., role/phone). Probe columns and insert only supported fields.
    let created;
    try {
      let columns = null;
      try {
        columns = await prisma.$queryRawUnsafe('SHOW COLUMNS FROM `User`');
      } catch {
        // If probe fails, fall back to full shape and let Prisma handle errors
      }
      const allowed = new Set(Array.isArray(columns) ? columns.map(c => String(c.Field || c.COLUMN_NAME || '').toLowerCase()) : []);
      const data = { email, password: hashed };
      if (!allowed.size || allowed.has('name')) data.name = name || null;
      if (!allowed.size || allowed.has('role')) data.role = 'user';
      if (!allowed.size || allowed.has('phone')) data.phone = phone || null;
      created = await prisma.user.create({ data });
    } catch (e) {
      // Retry with minimal required fields if we hit a column error
      const msg = e?.message || '';
      if (/Unknown column|ER_BAD_FIELD_ERROR|doesn't exist in table|Unknown argument `?phone`?/i.test(msg)) {
        created = await prisma.user.create({ data: { email, password: hashed, name: name || null } });
      } else {
        throw e;
      }
    }
    // Send email verification link (optional in dev)
    const emailToken = randomToken(24);
    const emailHash = sha256(emailToken);
    const emailExpiresAt = new Date(Date.now() + 1000*60*60*24); // 24h
    try {
      if (HAS_PRISMA_AUTHTOKEN) {
        await prisma.authToken.create({ data: { userId: created.id, type: 'email_verify', tokenHash: emailHash, expiresAt: emailExpiresAt } });
      } else if (process.env.DEBUG_ERRORS === 'true') {
        console.warn('[AUTH] authToken model missing; skipping email verification token');
      }
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] email_verify token create failed; proceeding without token:', e.message);
    }
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.headers.host}`;
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(emailToken)}&email=${encodeURIComponent(created.email)}`;
    try {
      await sendEmail({ to: created.email, subject: 'Verify your email', text: `Verify: ${verifyUrl}` });
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] sendEmail failed (verify); continuing:', e.message);
    }
    const accessToken = signAccessToken({ id: created.id, role: created.role, email: created.email });
    const rawRefresh = randomToken(48);
  const ttlMs = Number(process.env.REFRESH_TOKEN_TTL_MS || 1000*60*60*24*30);
  const sessionExpiresAt = new Date(Date.now() + ttlMs);
  const tokenHash = sha256(rawRefresh);
    try {
      if (HAS_PRISMA_SESSION) {
        await prisma.session.create({ data: { userId: created.id, refreshHash: tokenHash, expiresAt: sessionExpiresAt, userAgent: req.headers['user-agent'] || null, ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString() } });
      } else if (process.env.DEBUG_ERRORS === 'true') {
        console.warn('[AUTH] session model missing; skipping session.create in register');
      }
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session.create (register) failed; fallback:', e.message);
    }
    if (HAS_PRISMA_AUTHTOKEN) {
      await prisma.authToken.create({ data: { userId: created.id, type: 'refresh', tokenHash, expiresAt: sessionExpiresAt } }).catch(() => {});
    } else if (process.env.DEBUG_ERRORS === 'true') {
      console.warn('[AUTH] authToken model missing; skipping refresh token record on register');
    }
    res.cookie(REFRESH_COOKIE, rawRefresh, { ...cookieOpts(), maxAge: ttlMs });
    return res.status(201).json({ ok:true, accessToken, user: { id: created.id, role: created.role, email: created.email, name: created.name } });
  } catch (e) {
    // Structured log for debugging (captured by pino-http). Does not leak to client.
    try { req.log?.error({ err: e, code: e?.code, message: e?.message }, 'REGISTER route error'); } catch {}
    const msg = e?.message || '';
    // Prisma unique constraint -> email already exists (race condition between check and insert)
    if (e?.code === 'P2002') {
      return res.status(409).json({ ok:false, error: 'EMAIL_EXISTS', alias: 'EMAIL_ALREADY_EXISTS', message: 'Email already registered.' });
    }
    // Prisma validation / enum / invalid data
    if (e?.code && /^P20\d{2}$/.test(e.code)) {
      return res.status(400).json({ ok:false, error: e.code, message: 'Invalid data.' });
    }
    const isDbConn = /Database|ECONNREFUSED|does not exist|connect|timeout/i.test(msg);
    if (process.env.DEBUG_ERRORS === 'true' || process.env.NODE_ENV !== 'production') {
       
      console.error('[REGISTER] Error', { message: msg, code: e.code, stack: e.stack });
    }
    if (isDbConn) {
      return res.status(503).json({ ok:false, error: 'DB_UNAVAILABLE', message: 'Database offline. Try again later.' });
    }
    return res.status(500).json({ ok:false, error: 'REGISTER_FAILED', message: msg || 'Unexpected error' });
  }
});

// Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
  try {
    if (DEV_AUTH_ENABLED) {
      // In dev fallback, we don't manage sessions; just reject refresh to force re-login or return a transient token
      const anonToken = signAccessToken({ id: 'dev-anon', role: 'user', email: null }, { expiresIn: '10m' });
      return res.status(200).json({ ok: true, accessToken: anonToken, devFallback: true });
    }
    // Prefer cookie; fallback to body for backward compatibility
    const cookieRt = req.cookies?.[REFRESH_COOKIE];
    const bodyRt = (req.body || {}).refreshToken;
    const refreshToken = cookieRt || bodyRt;
    if (!refreshToken) return res.status(400).json({ ok:false, error:'MISSING_REFRESH' });
    const tokenHash = sha256(refreshToken);
    // Try sessions first
    let session = null;
    try {
      if (HAS_PRISMA_SESSION) {
        session = await prisma.session.findFirst({ where: { refreshHash: tokenHash, revokedAt: null, expiresAt: { gt: new Date() } } });
      } else {
        if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session model missing; skipping session.findFirst');
      }
    } catch (e) {
      if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session.findFirst failed; using legacy path:', e.message);
    }
    let userId = session?.userId;
    if (!session) {
      // fallback to legacy AuthToken
      let legacy = null;
      if (HAS_PRISMA_AUTHTOKEN) {
        legacy = await prisma.authToken.findFirst({ where: { type: 'refresh', tokenHash, consumedAt: null, expiresAt: { gt: new Date() } } });
      } else {
        if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] authToken model missing; skipping authToken.findFirst');
      }
      if (legacy) userId = legacy.userId;
      if (!userId) return res.status(401).json({ ok:false, error:'INVALID_REFRESH' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ ok:false, error:'USER_NOT_FOUND' });
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email });
    // Rotate refresh token: update current session hash or convert legacy to a new session
    const newRaw = randomToken(48);
    const newHash = sha256(newRaw);
    const ttlMs = Number(process.env.REFRESH_TOKEN_TTL_MS || 1000*60*60*24*30);
    const newExp = new Date(Date.now() + ttlMs);
      if (session) {
      try {
        if (HAS_PRISMA_SESSION) {
          await prisma.session.update({ where: { id: session.id }, data: { refreshHash: newHash, lastUsedAt: new Date(), expiresAt: newExp } });
        } else {
          if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session model missing; cannot update session');
        }
      } catch (e) {
        if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] session.update failed; converting to legacy path:', e.message);
        session = null;
      }
    }
    if (!session) {
      // legacy path: mark token consumed and create session
      try {
        const tx = [];
        if (HAS_PRISMA_AUTHTOKEN) tx.push(prisma.authToken.updateMany({ where: { type: 'refresh', tokenHash }, data: { consumedAt: new Date() } }));
        if (HAS_PRISMA_SESSION) tx.push(prisma.session.create({ data: { userId, refreshHash: newHash, expiresAt: newExp, userAgent: req.headers['user-agent'] || null, ip: (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString() } }));
        if (tx.length) {
          await prisma.$transaction(tx);
        } else {
          // If neither model exists, fallback to creating a new authToken record if possible
          if (HAS_PRISMA_AUTHTOKEN) {
            await prisma.authToken.create({ data: { userId, type: 'refresh', tokenHash: newHash, expiresAt: newExp } }).catch(()=>{});
          } else {
            if (process.env.DEBUG_ERRORS === 'true') console.warn('[AUTH] No session or authToken model available; cannot rotate refresh token');
          }
        }
      } catch (e) {
        // If session.create fails, at least rotate legacy token
        if (HAS_PRISMA_AUTHTOKEN) await prisma.authToken.create({ data: { userId, type: 'refresh', tokenHash: newHash, expiresAt: newExp } }).catch(()=>{});
      }
    }
  res.cookie(REFRESH_COOKIE, newRaw, { ...cookieOpts(req), maxAge: ttlMs });
    res.json({ ok: true, accessToken });
  } catch (e) {
    res.status(500).json({ ok:false, error:'REFRESH_FAILED', message: e.message });
  }
});

// Logout: revoke current refresh token
router.post('/logout', async (req, res) => {
  try {
    const cookieRt = req.cookies?.[REFRESH_COOKIE];
    const bodyRt = (req.body || {}).refreshToken;
    const refreshToken = cookieRt || bodyRt;
    if (refreshToken) {
      const tokenHash = sha256(refreshToken);
      try { await prisma.session.updateMany({ where: { refreshHash: tokenHash, revokedAt: null }, data: { revokedAt: new Date() } }); } catch {}
      await prisma.authToken.updateMany({ where: { type: 'refresh', tokenHash, consumedAt: null }, data: { consumedAt: new Date() } });
    }
    // Clear cookie
  res.clearCookie(REFRESH_COOKIE, { ...cookieOpts(req), maxAge: 0 });
    res.json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true }); // don't leak errors on logout
  }
});

// Current user profile
router.get('/me', attachUser, async (req, res) => {
  try {
    const DEGRADED = process.env.ALLOW_INVALID_DB === 'true';
    // In dev or degraded mode, return a stable user without touching DB when unauthenticated
    if (!req.user) {
      if (DEV_AUTH_ENABLED || DEGRADED) {
        const dev = DEV_USERS.find(u => u.role === 'user') || DEV_USERS[0];
        return res.json({ ok: true, devFallback: true, user: { id: dev.id, email: dev.email, role: dev.role, name: dev.name } });
      }
      return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
    }

    // If DB is disabled, respond with claims-based user right away
    if (DEGRADED) {
      const claimsUser = {
        id: req.user.id || (DEV_USERS.find(x=>x.role==='user')?.id ?? 'dev-user'),
        email: req.user.email || (DEV_USERS.find(x=>x.role==='user')?.email ?? 'user@example.com'),
        role: req.user.role || 'user',
        name: req.user.name || (DEV_USERS.find(x=>x.role==='user')?.name ?? 'Dev User')
      };
      return res.json({ ok: true, devFallback: true, user: claimsUser });
    }

    const u = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!u) {
      // If a dev token (e.g., id like 'dev-*') or DB missing user, return claims-based user in dev
      if (DEV_AUTH_ENABLED) {
        const fallback = {
          id: req.user.id || 'dev-user',
          email: req.user.email || (DEV_USERS.find(x=>x.role==='user')?.email ?? 'user@example.com'),
          role: req.user.role || 'user',
          name: DEV_USERS.find(x=>x.role==='user')?.name || 'Dev User'
        };
        return res.json({ ok: true, devFallback: true, user: fallback });
      }
      return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    }
    const user = {
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      phone: u.phone || null,
      emailVerifiedAt: u.emailVerifiedAt,
      phoneVerifiedAt: u.phoneVerifiedAt
    };
    res.json({ ok: true, user });
  } catch (e) {
    // Degraded mode: return a safe fallback user instead of 500
    if (process.env.ALLOW_INVALID_DB === 'true' || DEV_AUTH_ENABLED) {
      const dev = DEV_USERS.find(u => u.role === 'user') || DEV_USERS[0];
      return res.json({ ok: true, devFallback: true, user: { id: req.user?.id || dev.id, email: req.user?.email || dev.email, role: req.user?.role || dev.role, name: req.user?.name || dev.name } });
    }
    res.status(500).json({ ok:false, error:'ME_FAILED', message: e.message });
  }
});

// Update current user profile (name/phone)
router.patch('/me', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
  const { name, phone } = req.body || {};
  const data = {};
  if (name !== undefined) data.name = String(name);
  if (phone !== undefined) data.phone = phone ? String(phone).trim() : null;
    if (!Object.keys(data).length) return res.status(400).json({ ok:false, error:'NO_FIELDS' });
    const updated = await prisma.user.update({ where: { id: req.user.id }, data });
    return res.json({ ok: true, user: { id: updated.id, email: updated.email, role: updated.role, name: updated.name, phone: updated.phone, emailVerifiedAt: updated.emailVerifiedAt, phoneVerifiedAt: updated.phoneVerifiedAt } });
  } catch (e) {
    if (e?.code === 'P2002') return res.status(409).json({ ok:false, error:'PHONE_EXISTS' });
    res.status(500).json({ ok:false, error:'UPDATE_ME_FAILED', message: e.message });
  }
});

// Email verification request (re-send)
router.post('/verify-email/request', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
    const me = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!me) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    if (me.emailVerifiedAt) return res.json({ ok:true, alreadyVerified: true });
    const token = randomToken(24);
    const hash = sha256(token);
    const expiresAt = new Date(Date.now() + 1000*60*60*24);
    await prisma.authToken.create({ data: { userId: me.id, type: 'email_verify', tokenHash: hash, expiresAt } });
    const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.headers.host}`;
    const url = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(me.email)}`;
    await sendEmail({ to: me.email, subject: 'Verify your email', text: `Verify: ${url}` });
    res.json({ ok: true, sent: true });
  } catch (e) { res.status(500).json({ ok:false, error:'VERIFY_EMAIL_REQUEST_FAILED', message: e.message }); }
});

// Email verification callback
router.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query || {};
    if (!token || !email) return res.status(400).json({ ok:false, error:'MISSING_PARAMS' });
    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) return res.status(404).json({ ok:false, error:'USER_NOT_FOUND' });
    const record = await prisma.authToken.findFirst({ where: { userId: user.id, type: 'email_verify', tokenHash: sha256(String(token)), consumedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) return res.status(400).json({ ok:false, error:'INVALID_TOKEN' });
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
      prisma.authToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    ]);
    audit({ action: 'user.email_verified', entity: 'User', entityId: user.id, userId: user.id });
    res.json({ ok: true, verified: true });
  } catch (e) { res.status(500).json({ ok:false, error:'VERIFY_EMAIL_FAILED', message: e.message }); }
});

// Forgot password: send reset link
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok:false, error:'MISSING_EMAIL' });
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (user) {
      const token = randomToken(24);
      const hash = sha256(token);
      const expiresAt = new Date(Date.now() + 1000*60*30); // 30m
      await prisma.authToken.create({ data: { userId: user.id, type: 'password_reset', tokenHash: hash, expiresAt } });
      const baseUrl = process.env.APP_BASE_URL || `${req.protocol}://${req.headers.host}`;
      const url = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(user.email)}`;
      await sendEmail({ to: user.email, subject: 'Reset your password', text: `Reset link: ${url}` });
    }
    // Always respond ok (avoid email enumeration)
    res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (e) { res.status(500).json({ ok:false, error:'FORGOT_FAILED', message: e.message }); }
});

// Reset password with token
router.post('/reset', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body || {};
    if (!email || !token || !newPassword) return res.status(400).json({ ok:false, error:'MISSING_FIELDS' });
    if (newPassword.length < 6) return res.status(400).json({ ok:false, error:'WEAK_PASSWORD' });
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    const record = await prisma.authToken.findFirst({ where: { userId: user.id, type: 'password_reset', tokenHash: sha256(String(token)), consumedAt: null, expiresAt: { gt: new Date() } } });
    if (!record) return res.status(400).json({ ok:false, error:'INVALID_TOKEN' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.authToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    ]);
    res.json({ ok: true, message: 'PASSWORD_RESET_OK' });
  } catch (e) { res.status(500).json({ ok:false, error:'RESET_FAILED', message: e.message }); }
});

// Phone verification request (send code)
router.post('/verify-phone/request', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
    const me = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!me) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    if (!me.phone) return res.status(400).json({ ok:false, error:'NO_PHONE' });
    if (me.phoneVerifiedAt) return res.json({ ok:true, alreadyVerified: true });
    const code = ('' + Math.floor(100000 + Math.random()*900000)); // 6-digit
    const expiresAt = new Date(Date.now() + 1000*60*10); // 10m
    await prisma.authToken.create({ data: { userId: me.id, type: 'phone_verify', code, expiresAt, meta: { phone: me.phone } } });
    await sendSms({ to: me.phone, message: `رمز التحقق: ${code}` });
    res.json({ ok: true, sent: true });
  } catch (e) { res.status(500).json({ ok:false, error:'VERIFY_PHONE_REQUEST_FAILED', message: e.message }); }
});

// Phone verification submit
router.post('/verify-phone/confirm', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ ok:false, error:'MISSING_CODE' });
    const me = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!me) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    const record = await prisma.authToken.findFirst({ where: { userId: me.id, type: 'phone_verify', code: String(code), consumedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!record) return res.status(400).json({ ok:false, error:'INVALID_CODE' });
    await prisma.$transaction([
      prisma.user.update({ where: { id: me.id }, data: { phoneVerifiedAt: new Date() } }),
      prisma.authToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } })
    ]);
    audit({ action: 'user.phone_verified', entity: 'User', entityId: me.id, userId: me.id });
    res.json({ ok: true, verified: true });
  } catch (e) { res.status(500).json({ ok:false, error:'VERIFY_PHONE_FAILED', message: e.message }); }
});

// Create a new admin (must be called by an existing admin). Prevent privilege escalation by normal users.
// Body: { email, password, name }
router.post('/create-admin', attachUser, requireAdmin, async (req, res) => {
  try {
    let { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok:false, error:'MISSING_FIELDS' });
    email = String(email).trim().toLowerCase();
    if (password.length < 8) return res.status(400).json({ ok:false, error:'WEAK_PASSWORD', message:'Password must be at least 8 chars' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ ok:false, error:'EMAIL_EXISTS' });
    const hashed = await bcrypt.hash(password, 12);
    const created = await prisma.user.create({ data: { email, password: hashed, role: 'admin', name: name || 'System Admin' } });
    return res.status(201).json({ ok:true, admin: { id: created.id, email: created.email, role: created.role, name: created.name } });
  } catch (e) {
    return res.status(500).json({ ok:false, error:'ADMIN_CREATE_FAILED', message: e.message });
  }
});

export default router;

// Sessions management endpoints (optional)
router.get('/sessions', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
    const sessions = await prisma.session.findMany({ where: { userId: req.user.id, revokedAt: null }, orderBy: { createdAt: 'desc' } });
    const map = sessions.map(s => ({ id: s.id, createdAt: s.createdAt, lastUsedAt: s.lastUsedAt, userAgent: s.userAgent, ip: s.ip, expiresAt: s.expiresAt }));
    res.json({ ok: true, sessions: map });
  } catch (e) { res.status(500).json({ ok:false, error:'SESSIONS_LIST_FAILED', message: e.message }); }
});

router.delete('/sessions/:id', attachUser, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok:false, error:'UNAUTHENTICATED' });
    const { id } = req.params;
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.userId !== req.user.id) return res.status(404).json({ ok:false, error:'NOT_FOUND' });
    await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
    res.json({ ok: true, revoked: true });
  } catch (e) { res.status(500).json({ ok:false, error:'SESSION_REVOKE_FAILED', message: e.message }); }
});

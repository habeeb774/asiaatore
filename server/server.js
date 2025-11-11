// Enhanced security & hardening for Express server
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { z } from 'zod';
import prisma from './db/client.js';
import authRoutes from './routes/auth.js';

dotenv.config({ override: true });

const app = express();
const PORT = Number(process.env.PORT) || 8829;
const isProd = process.env.NODE_ENV === 'production';

// --- Security Middleware ---
app.use(helmet({
  contentSecurityPolicy: isProd ? {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", 'data:', 'https://*'],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  } : false
}));

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: (origin, cb) => {
  if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
  return cb(new Error('Not allowed by CORS'));
}, credentials: true }));

app.use(compression({ threshold: 1024 }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rate Limiting ---
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: 'Too many requests' } });
app.use('/api/auth', authLimiter);

// --- Logging ---
const logger = pino({ level: isProd ? 'info' : 'debug' });
app.use(pinoHttp({ logger }));

// --- HTTPS Enforcement ---
if (process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// --- DB Guard Middleware ---
const requireDb = async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch {
    res.status(503).json({ error: 'DB_UNAVAILABLE', message: 'Database not reachable' });
  }
};

// --- Zod Validation Example for Register ---
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1)
});

app.post('/api/auth/register', requireDb, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    // Hash password (example: bcrypt) before saving
    const user = await prisma.user.create({ data });
    res.json({ ok: true, userId: user.id });
  } catch (e) {
    res.status(400).json({ error: 'VALIDATION_FAILED', message: e.errors || e.message });
  }
});

// --- Basic Health Check ---
app.get('/_health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'degraded' });
  }
});

app.listen(PORT, () => console.log(`Secure server listening on http://localhost:${PORT}`));
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import paypalRoutes from './paypal.js';
import stcRoutes from './stc.js';
import bankRoutes from './bank.js';
import { audit } from './utils/audit.js';
// Simple COD enable route (inline lightweight) - could be split later
import path from 'path';
import productsRoutes from './routes/products.js';
import brandsRoutes from './routes/brands.js';
import marketingRoutes from './routes/marketing.js';
import tierPricesRoutes from './routes/tierPrices.js';
import ordersRoutes from './routes/orders.js';
import adminAuditRoutes from './routes/adminAudit.js';
import adminUsersRoutes from './routes/adminUsers.js';
import categoriesRoutes from './routes/categories.js';
import adminStatsRoutes from './routes/adminStats.js';
import wishlistRoutes from './routes/wishlist.js';
import cartRoutes from './routes/cart.js';
import reviewsRoutes from './routes/reviews.js';
import searchRoutes from './routes/search.js';
import settingsRoutes from './routes/settings.js';
import sellersRoutes from './routes/sellers.js';
import invoicesRoutes from './routes/invoices.js';
import authRoutes from './routes/auth.js';
import deliveryRoutes from './routes/delivery.js';
import adminDeliveryRoutes from './routes/adminDelivery.js';
import { attachUser } from './middleware/auth.js';
import { registerSse, setupWebSocket } from './utils/realtimeHub.js';
import fs from 'fs';
import crypto from 'crypto';
import { quoteShipping } from './utils/shipping.js';
// Centralized Prisma client (singleton) to prevent multiple instantiations & ESM warnings
import prisma from './db/client.js';
import typeDefs from './graphql/typeDefs.js';
import resolvers from './graphql/resolvers.js';

// Force override so a stale system/global DATABASE_URL (e.g. old file:./dev.db) does not block the .env value
const dotenvResult = dotenv.config({ override: true });
if (dotenvResult.error) {
  console.warn('[ENV] Failed to load .env:', dotenvResult.error.message);
} else if (process.env.DATABASE_URL?.startsWith('file:')) {
  console.warn('[ENV] DATABASE_URL still points to a file: URL. Update .env to a mysql:// URL. Current=', process.env.DATABASE_URL);
}

// Aliases support (roadmap compatibility): DB_URL -> DATABASE_URL, BASE_URL -> APP_BASE_URL
if (!process.env.DATABASE_URL && process.env.DB_URL) {
  process.env.DATABASE_URL = process.env.DB_URL;
  console.log('[ENV] Using DB_URL as DATABASE_URL');
}
if (!process.env.APP_BASE_URL && process.env.BASE_URL) {
  process.env.APP_BASE_URL = process.env.BASE_URL;
  console.log('[ENV] Using BASE_URL as APP_BASE_URL');
}

// NEW: ensure .env.example exists (guidance for user)
(() => {
  const examplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(examplePath)) {
    const template = `# Example environment configuration
# Direct URL (preferred)
DATABASE_URL="mysql://user:pass@localhost:3306/my_store"

# Or parts (server will assemble if DATABASE_URL missing/invalid)
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASS=pass
DB_NAME=my_store

# Developer helpers (DO NOT use in production):
# QUICK_START_DB=1          # auto inject local default URL if missing
# ALLOW_INVALID_DB=true     # run in degraded mode without valid DB
`;
    try { fs.writeFileSync(examplePath, template); } catch { /* ignore */ }
  }
})();

const app = express();
let PORT = Number(process.env.PORT) || 4000;

// Trust proxy (needed when behind reverse proxy)
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// Security middleware (Helmet)
// By default, disable CSP to avoid breaking dev; allow enabling minimal CSP via HELMET_CSP=true
const useCsp = process.env.HELMET_CSP === 'true';
app.use(helmet({
  contentSecurityPolicy: useCsp ? {
    useDefaults: true,
    directives: {
      // Minimal safe defaults; adjust if you serve SPA from same origin
      "default-src": ["'self'"],
      "img-src": ["'self'", 'data:', 'blob:'],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "connect-src": ["'self'", '*']
    }
  } : false,
  crossOriginEmbedderPolicy: false, // avoid issues with third-party iframes/assets in dev
  referrerPolicy: { policy: 'no-referrer-when-downgrade' }
}));

// Compression (gzip/deflate)
const compressionThreshold = Number(process.env.COMPRESSION_THRESHOLD || 1024);
app.use(compression({
  threshold: compressionThreshold,
  filter: (req, res) => {
    if (req.headers['x-no-compress']) return false;
    // Avoid compressing Server-Sent Events
    const ct = res.getHeader('Content-Type') || '';
    if (typeof ct === 'string' && ct.includes('text/event-stream')) return false;
    return compression.filter(req, res);
  }
}));

const isProd = process.env.NODE_ENV === 'production';

// CORS allowlist (prod) or permissive (dev)
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = isProd && allowedOrigins.length
  ? {
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }
  : {
      origin: true, // dev: allow all
      credentials: true,
    };

// Security headers (keep single Helmet usage)
app.use(
  helmet({
    // Keep CSP simple; disable in dev to avoid blocking Vite HMR (can enable via HELMET_CSP=true above)
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  })
);

// CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse cookies and request bodies (needed for JSON login payloads)
app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiters (configurable via env)
const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 60_000),
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many auth requests, try again later.' },
});
const payLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_PAY_WINDOW_MS || 300_000),
  max: Number(process.env.RATE_LIMIT_PAY_MAX || 5),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many payment requests, try again later.' },
});
app.use('/api/auth', authLimiter);
app.use('/api/pay', payLimiter);
// Apply same limiter to legacy /auth alias
app.use('/auth', authLimiter);

// Optional: serve built client (SPA) from dist in production if enabled
if (process.env.SERVE_CLIENT === 'true') {
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
  }
}

// GraphQL (optional) using @apollo/server
async function setupGraphQL() {
  try {
    const { ApolloServer } = await import('@apollo/server');
    const { ApolloServerPluginLandingPageLocalDefault } = await import('@apollo/server/plugin/landingPage/default');
    const { expressMiddleware } = await import('@apollo/server/express4');
    const serverGql = new ApolloServer({ typeDefs, resolvers, plugins: [ApolloServerPluginLandingPageLocalDefault()] });
    await serverGql.start();
    app.use('/api/graphql', expressMiddleware(serverGql, {
      context: async ({ req }) => ({ user: req.user || null, prisma })
    }));
    console.log('[GraphQL] Mounted at /api/graphql');
  } catch (e) {
    console.warn('[GraphQL] Skipped:', e.message);
  }
}
await setupGraphQL();

// Request ID middleware (before logger)
app.use((req, res, next) => {
  req.id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Request logger (morgan)
morgan.token('id', (req) => req.id);
const morganFormat = process.env.MORGAN_FORMAT || ':remote-addr :method :url :status :res[content-length] - :response-time ms reqId=:id';
app.use(morgan(morganFormat));

// Optional: force HTTPS
if (process.env.FORCE_HTTPS === 'true') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    const host = req.headers.host;
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  });
}

// Validate / build DATABASE_URL for Prisma mysql provider
const DB_PROVIDER = 'mysql';

// Helper to mask password in logs
const maskDbUrl = (url) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    return `mysql://${u.username || 'user'}:***@${u.hostname}${u.port ? ':' + u.port : ''}${u.pathname}`;
  } catch {
    return 'INVALID_URL';
  }
};

// NEW: try to normalize shorthand (e.g., user:pass@host:3306/db or host:3306/db)
const normalizeDbUrl = (raw) => {
  if (!raw) return raw;
  // Remove BOM + all leading control / zero-width characters
  // eslint-disable-next-line no-control-regex, no-misleading-character-class
  let cleaned = raw.replace(/^[\uFEFF\u200B\u200C\u200D\u2060\u0000-\u001F\u007F]+/, '');
  // Trim and strip wrapping quotes
  cleaned = cleaned.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  // If the string contains mysql:// but not at start (due to accidental paste), salvage from there
  const idx = cleaned.toLowerCase().indexOf('mysql://');
  if (idx > 0) cleaned = cleaned.slice(idx);
  if (cleaned.startsWith('mysql://')) return cleaned;
  // Promote common shorthands (user:pass@host:port/db etc.)
  if (/^[^:\s@]+(:[^@\s]+)?@[^/\s:]+(:\d+)?\/[^/\s]+$/.test(cleaned) ||
      /^[^/\s:]+(:\d+)?\/[^/\s]+$/.test(cleaned)) {
    return 'mysql://' + cleaned;
  }
  return cleaned; // may still be invalid; caller will validate
};

// Attempt to build url from parts if missing/invalid
const buildDbUrlFromParts = () => {
  const { DB_HOST, DB_PORT = '3306', DB_USER, DB_PASS, DB_NAME } = process.env;
  if (DB_HOST && DB_USER && DB_NAME) {
    const passSeg = DB_PASS ? `:${encodeURIComponent(DB_PASS)}` : '';
    return `mysql://${encodeURIComponent(DB_USER)}${passSeg}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  }
  return null;
};

let DB_URL_VALID = true;
let DB_INVALID_REASON = '';
let dbUrl = process.env.DATABASE_URL;
let DB_REBUILT = false;
let DB_QUICK_START = false;

if (dbUrl) {
  const normalized = normalizeDbUrl(dbUrl);
  // Accept protocol case-insensitively
  if (normalized.toLowerCase().startsWith('mysql://') && !normalized.startsWith('mysql://')) {
    dbUrl = 'mysql://' + normalized.slice(8);
  } else {
    dbUrl = normalized;
  }
  if (process.env.DATABASE_URL !== dbUrl) {
    console.log('[DB] Normalized DATABASE_URL shorthand/protocol.');
    process.env.DATABASE_URL = dbUrl;
  }
}

if (!dbUrl || !dbUrl.toLowerCase().startsWith('mysql://')) {
  DB_URL_VALID = false;
  DB_INVALID_REASON = !dbUrl ? 'DATABASE_URL_MISSING' : 'DATABASE_URL_PROTOCOL_INVALID';
  const rebuilt = buildDbUrlFromParts();
  if (rebuilt) {
    dbUrl = rebuilt;
    process.env.DATABASE_URL = rebuilt;
    DB_URL_VALID = true;
    DB_INVALID_REASON = '';
    DB_REBUILT = true;
    console.log('[DB] Rebuilt DATABASE_URL from parts:', maskDbUrl(rebuilt));
  }
} else {
  try {
    const u = new URL(dbUrl);
    if (!u.hostname || !u.pathname || u.pathname === '/') {
      DB_URL_VALID = false;
      DB_INVALID_REASON = 'DATABASE_URL_INCOMPLETE';
    }
  } catch {
    DB_URL_VALID = false;
    DB_INVALID_REASON = 'DATABASE_URL_PARSE_ERROR';
  }
}

// Collect missing parts (only for diagnostics)
const diagMissingParts = [];
['DB_HOST','DB_USER','DB_NAME'].forEach(k => { if (!process.env[k]) diagMissingParts.push(k); });

// Allow typo fallback + flag
const allowInvalidDb =
  process.env.ALLOW_INVALID_DB === 'true' ||
  process.env.ALLOW_INVALID_DBB === 'true';

// NEW: Quick start fallback (developer convenience)
if (!DB_URL_VALID && process.env.QUICK_START_DB === '1') {
  const fallback = 'mysql://root:root@localhost:3306/my_store';
  process.env.DATABASE_URL = fallback;
  dbUrl = fallback;
  DB_URL_VALID = true;
  DB_INVALID_REASON = '';
  DB_QUICK_START = true;
  console.warn('[DB] QUICK_START_DB=1 applied. Using fallback URL:', maskDbUrl(fallback));
}

if (!DB_URL_VALID) {
  console.error('[DB] Invalid configuration:', {
    reason: DB_INVALID_REASON,
    missingParts: diagMissingParts,
    providedUrl: !!dbUrl
  });
  if (dbUrl) {
    const preview = [...dbUrl.slice(0, 20)].map(ch => ch.charCodeAt(0)).join(',');
    console.error('[DB] Raw dbUrl preview chars:', preview, 'len=', dbUrl.length, 'value=', dbUrl);
  }
  if (diagMissingParts.length) {
    console.warn('[DB] Missing parts:', diagMissingParts.join(', '));
  }
}

if (!DB_URL_VALID && process.env.ALLOW_INVALID_DBB === 'true') {
  console.warn('[DB] Found misspelled ALLOW_INVALID_DBB (use ALLOW_INVALID_DB). Continuing degraded.');
}

// NEW: دالة تلميح إعداد
const printDbHelp = () => {
  console.error(`[DB] مثال إعداد .env:
# صيغة مباشرة
DATABASE_URL="mysql://user:pass@localhost:3306/my_store"

# أو باستخدام الأجزاء (سيتم تركيبها تلقائياً):
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASS=pass
DB_NAME=my_store

# لتجاوز الفحص مؤقتاً (لا يُنصح في الإنتاج):
ALLOW_INVALID_DB=true
`);
};

if (!DB_URL_VALID && !allowInvalidDb) {
  console.error('[DB] Configuration invalid. Provide a proper mysql:// URL or the required parts.');
  printDbHelp();
  process.exit(1);
} else if (!DB_URL_VALID && allowInvalidDb) {
  console.warn('[DB] جاري التشغيل بدون اتصال قاعدة بيانات صالح (وضع متدهور). بعض المسارات ستُرجع DB_UNAVAILABLE.');
}

// Guard middleware to short-circuit requests needing the DB
const requireValidDb = (req, res, next) => {
  if (!DB_URL_VALID) {
    return res.status(503).json({
      error: 'DB_UNAVAILABLE',
      message: 'Database configuration invalid (check DATABASE_URL)',
      retry: true
    });
  }
  if (!dbConnected) {
    return res.status(503).json({
      error: 'DB_NOT_CONNECTED',
      message: 'Database not connected',
      retry: true
    });
  }
  next();
};

// NEW: Admin authorization guard
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin only' });
  }
  next();
};

// Replace existing simple health endpoint with enriched one
app.get('/_health', (req, res) => {
  res.json({
    status: DB_URL_VALID && dbConnected ? 'ok' : (DB_URL_VALID ? 'degraded' : 'invalid-config'),
    db: {
      provider: 'mysql',
      validUrl: DB_URL_VALID,
      connected: dbConnected,
      reason: DB_URL_VALID
        ? (dbConnected ? null : (dbLastError?.message || 'NOT_CONNECTED'))
        : DB_INVALID_REASON,
      rebuilt: DB_REBUILT,
      quickStart: DB_QUICK_START
    },
    effectiveUrlMasked: DB_URL_VALID ? maskDbUrl(process.env.DATABASE_URL) : null,
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString()
  });
});

// مسار فحص مباشر يدوي
app.get('/_db_ping', async (req, res) => {
  if (!DB_URL_VALID) {
    return res.status(400).json({ error: 'INVALID_CONFIG', message: DB_INVALID_REASON });
  }
  if (!prisma) {
    return res.status(503).json({ error: 'NO_CLIENT', message: 'Prisma client not initialized' });
  }
  const started = Date.now();
  try {
    const [row] = await prisma.$queryRaw`SELECT VERSION() AS version`;
    const ms = Date.now() - started;
    res.json({
      ok: true,
      latencyMs: ms,
      version: row?.version || null
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Update /_db_status with new flags
app.get('/_db_status', (req, res) => {
  res.json({
    valid: DB_URL_VALID,
    reason: DB_URL_VALID ? null : DB_INVALID_REASON,
    maskedUrl: process.env.DATABASE_URL ? maskDbUrl(process.env.DATABASE_URL) : null,
    missingParts: diagMissingParts,
    rebuilt: DB_REBUILT,
    quickStart: DB_QUICK_START,
    allowInvalidDb
  });
});

// Minimal OpenAPI-like JSON (hand-crafted summary) and Redoc-like HTML
app.get('/api/docs.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: { title: 'My Store API', version: '1.0.0' },
    servers: [{ url: `${req.protocol}://${req.headers.host}` }],
    paths: {
      '/api/auth/login': { post: { summary: 'Login', tags: ['auth'] } },
  '/api/auth/refresh': { post: { summary: 'Refresh access token', tags: ['auth'] } },
  '/api/auth/logout': { post: { summary: 'Logout (revoke refresh)', tags: ['auth'] } },
  '/api/auth/me': { get: { summary: 'Current user profile', tags: ['auth'] }, patch: { summary: 'Update current user profile', tags: ['auth'] } },
  '/api/auth/register': { post: { summary: 'Register user', tags: ['auth'] } },
  '/api/auth/forgot': { post: { summary: 'Forgot password', tags: ['auth'] } },
  '/api/auth/reset': { post: { summary: 'Reset password with token', tags: ['auth'] } },
  '/api/auth/verify-email/request': { post: { summary: 'Send email verification', tags: ['auth'] } },
  '/api/auth/verify-email': { get: { summary: 'Verify email callback', tags: ['auth'] } },
  '/api/auth/verify-phone/request': { post: { summary: 'Send phone verification code', tags: ['auth'] } },
  '/api/auth/verify-phone/confirm': { post: { summary: 'Confirm phone verification code', tags: ['auth'] } },
      '/api/products': { get: { summary: 'List products' }, post: { summary: 'Create product (admin)' } },
      '/api/orders': { get: { summary: 'List orders' }, post: { summary: 'Create order' } },
      '/api/orders/{id}': { get: { summary: 'Get order' }, patch: { summary: 'Update order' } },
      '/api/shipping/quote': { post: { summary: 'Shipping quote (no DB)' } },
  '/api/invoices': { get: { summary: 'List invoices (admin)' }, post: { summary: 'Create invoice from order' } },
  '/api/invoices/{id}': { get: { summary: 'Get invoice by id' } },
  '/api/invoices/{id}/pdf': { get: { summary: 'Invoice PDF' } },
  '/api/invoices/{id}/status': { post: { summary: 'Update invoice status (admin)' } },
      '/api/events': { get: { summary: 'Realtime events (SSE)' } }
    }
  });
});

app.get('/api/docs', (req, res) => {
  const url = `${req.protocol}://${req.headers.host}/api/docs.json`;
  res.type('html').send(`<!doctype html><meta charset="utf-8"><title>API Docs</title>
  <style>body{font-family:system-ui;padding:24px;line-height:1.5} pre{background:#f7f7f7;padding:12px;border-radius:8px;overflow:auto}</style>
  <h1>My Store API</h1>
  <p>OpenAPI JSON: <a href="${url}">${url}</a></p>
  <p>Realtime events (SSE): <code>GET /api/events</code></p>
  <h3>Auth</h3>
  <pre>POST /api/auth/login\n{ "email": "user@example.com", "password": "..." }</pre>
  <h3>Orders</h3>
  <pre>POST /api/orders\n{ "items": [ { "productId": "...", "quantity": 1 } ] }</pre>
  `);
});

// root informational page to avoid default 'Cannot GET /' in browser
app.get('/', (req, res) => {
  const acceptsText = req.accepts(['html','text']) === 'text';
  if (acceptsText) {
    return res.type('text').send(
`Payment stub server
This is an API server for local testing of payment flows.

Health: GET /_health
PayPal: POST /api/pay/paypal/create-order
PayPal Capture: POST /api/pay/paypal/capture/:paypalOrderId
Local PayPal Order: GET /api/pay/paypal/local/:id
Orders: GET /api/orders
Create Order: POST /api/orders
Get Order: GET /api/orders/:id
Invoice HTML: GET /api/orders/:id/invoice
Auth Login: POST /api/auth/login
Admin Panel (JSON): GET /api/admin/panel`
    );
  }
  res.type('html').send(`
    <!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><title>Payment Stub Server</title></head>
      <body style="font-family:system-ui,Segoe UI,Roboto,Arial;line-height:1.4;padding:24px;">
        <h1>Payment stub server</h1>
        <p>This is an API server for local testing of payment flows.</p>
        <ul>
          <li><a href="/_health">/_health</a> — health check (JSON)</li>
          <li>PayPal create order — POST <code>/api/pay/paypal/create-order</code></li>
          <li>PayPal capture — POST <code>/api/pay/paypal/capture/:paypalOrderId</code></li>
          <li>Local order lookup — GET <code>/api/pay/paypal/local/:id</code></li>
          <li>List Orders — GET <code>/api/orders</code></li>
          <li>Create Order — POST <code>/api/orders</code></li>
          <li>Get Order — GET <code>/api/orders/:id</code></li>
          <li>Invoice HTML — GET <code>/api/orders/:id/invoice</code></li>
          <li>Auth Login — POST <code>/api/auth/login</code></li>
          <li>Admin Panel JSON — GET <code>/api/admin/panel</code></li>
        </ul>
        <p>To view the frontend run the client dev server (Vite): <code>npm run dev</code> and open <a href="http://localhost:5173">http://localhost:5173</a>.</p>
      </body>
    </html>
  `);
});

// New: .env template helper
if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_ENV_TEMPLATE === 'true') app.get('/_env_template', (req, res) => {
  const masked = DB_URL_VALID ? maskDbUrl(process.env.DATABASE_URL) : 'غير متوفر / invalid';
  const tpl =
`# --- Example .env template (generated) ---
# Direct full URL (preferred)
DATABASE_URL="mysql://user:pass@localhost:3306/my_store"

# Or let the server assemble from parts:
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASS=pass
DB_NAME=my_store

# Temporary bypass (NOT for production):
# ALLOW_INVALID_DB=true

# Current status:
# provider=${DB_PROVIDER}
# validUrl=${DB_URL_VALID}
# effectiveUrlMasked=${masked}
`;
  res.type('text').send(tpl);
});

// Auth routes (login) - no need for attachUser before them
// 405 guidance for any non-POST to /api/auth/login (must be before authRoutes)
app.all('/api/auth/login', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      expected: 'POST',
      message: 'Use POST /api/auth/login with JSON body: { "email": "...", "password": "..." }'
    });
  }
  next(); // let POST fall through to authRoutes
});
// Legacy alias: 405 guidance for /auth/login
app.all('/auth/login', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      expected: 'POST',
      message: 'Use POST /auth/login or /api/auth/login with JSON body: { "email": "...", "password": "..." }'
    });
  }
  next();
});

// Mount auth routes under both /api/auth and legacy /auth
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

// attach user context (reads JWT if present)
app.use(attachUser);

// Apply DB guard to routes that rely on the database
app.use(
  [
    '/api/products',
    '/api/orders',
    '/api/admin',
    '/api/pay',
    '/api/brands',
    '/api/marketing',
    '/api/settings',
    '/api/cart',
    '/api/sellers',
    '/api/invoices',
  ],
  requireValidDb
);

// Mount API routers
app.use('/api/products', productsRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/tierPrices', tierPricesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin/audit', adminAuditRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin/delivery', adminDeliveryRoutes);

// Payments
app.use('/api/pay/paypal', paypalRoutes);
app.use('/api/pay/stc', stcRoutes);
app.use('/api/pay/bank', bankRoutes);

// Shipping quote (no DB required)
app.post('/api/shipping/quote', express.json(), (req, res) => {
  try {
    const result = quoteShipping(req.body || {});
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: 'QUOTE_FAILED', message: e.message });
  }
});

// Cash on Delivery enable route (fixed)
app.post('/api/pay/cod/enable', attachUser, requireValidDb, async (req, res) => {
  try {
    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ ok: false, error: 'MISSING_ORDER_ID' });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ ok: false, error: 'ORDER_NOT_FOUND' });

    if (order.userId !== (req.user?.id || 'guest') && req.user?.role !== 'admin') {
      return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    }

    // Idempotent update to COD
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'COD' },
    });

    await audit({
      action: 'PAY_COD_ENABLE',
      entity: 'Order',
      entityId: orderId,
      userId: req.user?.id || null,
      meta: { previousPaymentMethod: order.paymentMethod, next: 'COD' },
    });

    return res.json({ ok: true, orderId, paymentMethod: updated.paymentMethod });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'COD_ENABLE_FAILED', message: e.message });
  }
});

// Optional alias for bare /products -> /api/products
app.use('/products', (req, res) => {
  res.redirect(308, '/api/products' + (req.url || ''));
});

// Enhanced Error handler
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error('[API Error]', { id: req.id, path: req.originalUrl, err });

  if (res.headersSent) return next(err);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Unexpected server error';

  // Prisma error mapping (if Prisma is used in downstream routes)
  if (err && typeof err === 'object') {
    if (err.code && /^P20\d{2}$/.test(err.code)) {
      switch (err.code) {
        case 'P2002': // unique constraint
          status = 409;
          code = 'UNIQUE_CONSTRAINT';
          message = 'Resource already exists (unique constraint).';
          break;
        case 'P2025': // record not found
          status = 404;
          code = 'NOT_FOUND';
          message = 'Requested resource not found.';
          break;
        case 'P2003': // fk constraint
          status = 400;
          code = 'FK_CONSTRAINT';
          message = 'Foreign key constraint failed.';
          break;
        default:
          status = 400;
          code = err.code;
          message = 'Database operation failed.';
      }
    } else if (err.name === 'ValidationError') {
      status = 400;
      code = 'VALIDATION_ERROR';
      message = err.message || 'Invalid input.';
    }
  }

  const isProd = process.env.NODE_ENV === 'production';
  const debugEnabled = process.env.DEBUG_ERRORS === 'true';

  const payload = {
    error: code,
    message,
    requestId: req.id
  };

  if (!isProd && debugEnabled) {
    payload.debug = {
      originalMessage: err.message,
      stack: err.stack
    };
  }

  res.status(status).json(payload);
});

// Global unhandled promise rejection logging
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

// NEW: uncaught exception safeguard
process.on('uncaughtException', (error) => {
  console.error('[UNCAUGHT_EXCEPTION]', error);
  if (process.env.EXIT_ON_UNCAUGHT !== 'false') {
    process.exit(1);
  }
});

// ---- DB init & graceful shutdown block (kept) ----
let dbConnected = false;
let dbLastError = null;
const DB_CONNECT_TIMEOUT = Number(process.env.DB_CONNECT_TIMEOUT || 8000);

async function initDb() {
  if (!DB_URL_VALID) {
    console.warn('[DB] Skipping real connect (invalid URL).');
    return;
  }
  const timer = setTimeout(() => {
    if (!dbConnected) {
      dbLastError = new Error('DB connection timeout');
      console.error('[DB] Connection timeout.');
    }
  }, DB_CONNECT_TIMEOUT);
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    console.log('[DB] Connection OK.');
  } catch (e) {
    dbLastError = e;
    console.error('[DB] Connection failed:', e.message);
  } finally {
    clearTimeout(timer);
  }
}
await initDb();

// Graceful shutdown
async function graceful(exitCode = 0) {
  console.log('[APP] Shutting down...');
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('[DB] Disconnected.');
    } catch (e) {
      console.warn('[DB] Disconnect error:', e.message);
    }
  }
  process.exit(exitCode);
}
['SIGINT','SIGTERM'].forEach(sig => {
  process.on(sig, () => {
    console.log('[APP] Signal', sig);
    graceful(0);
  });
});

function listRoutes() {
  try {
    const routes = [];
  const stack = app._router.stack;
  const walk = (layer, prefix = '') => {
      if (layer.route && layer.route.path) {
        routes.push({ methods: Object.keys(layer.route.methods), path: prefix + layer.route.path });
      } else if (layer.name === 'router' && layer.handle?.stack) {
        const src = layer.regexp?.source || '';
        const base = src
          .replace(/^\^\\\//, '/')
          .replace(/\\\/?\(\?=\\\/(\|\$)\)/, '')
          .replace(/\(\?=\\\/(\|\$)\)/, '')
          .replace(/^\^/, '')
          .replace(/\$$/, '');
        layer.handle.stack.forEach(l => walk(l, base));
      }
    };
    stack.forEach(l => walk(l,''));
    console.log('[ROUTES]', routes);
  } catch (e) {
    console.warn('Failed to list routes', e.message);
  }
}

async function startServerWithRetry(maxRetries = 5) {
  let attempts = 0;
  while (attempts <= maxRetries) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(PORT, async () => {
          console.log(`Payment stub server listening on http://localhost:${PORT}`);
          // Optional WebSocket setup behind a flag
          if (process.env.REALTIME_WS === 'true') {
            await setupWebSocket(server);
          }
          resolve();
        });
        server.on('error', (err) => {
          if (err && err.code === 'EADDRINUSE') {
            server.close?.();
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      listRoutes();
      return; // started
    } catch (err) {
      if (err && err.code === 'EADDRINUSE' && attempts < maxRetries) {
        console.warn(`[PORT] ${PORT} in use, retrying on ${PORT + 1} ...`);
        PORT += 1;
        attempts += 1;
        continue;
      }
      throw err;
    }
  }
}

await startServerWithRetry();

// SPA fallback (if serving client) — after server starts
if (process.env.SERVE_CLIENT === 'true') {
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.get(/^(?!\/api\/).+/, (req, res) => {
      res.sendFile(indexHtml);
    });
  }
}

// Mount API routers (previously imported)
app.use('/api/products', productsRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/tier-prices', tierPricesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin/audit', adminAuditRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/invoices', invoicesRoutes);

// Optional alias: support bare /products by redirecting to /api/products
app.use('/products', (req, res) => {
  res.redirect(308, '/api/products' + (req.url || ''));
});

// Hardened Express API server (Prisma + MySQL) with logging, health, SSE, and optional SPA serving
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import { registerSse } from './utils/realtimeHub.js';
import path from 'path';
import fs from 'fs';

// IMPORTANT: Prepare DB env (DATABASE_URL) BEFORE importing prisma or any route that imports prisma
const isProd = process.env.NODE_ENV === 'production';
const allowDegraded = process.env.ALLOW_INVALID_DB === 'true';
if (!process.env.DATABASE_URL) {
    const fallback = 'mysql://root:AlvYFhUfDYXSCykrgHpncurIFgwffLmF@yamabiko.proxy.rlwy.net:23471/railway';
    const shouldQuickStart = process.env.QUICK_START_DB === '1' || (!isProd && process.env.QUICK_START_DB !== '0');
    // Do not force a fallback DB in degraded mode; allow routes that don't need DB to work
    if (shouldQuickStart && !allowDegraded) {
        process.env.DATABASE_URL = fallback;
         
        console.warn('[DB] QUICK_START_DB applied. Using fallback DATABASE_URL for dev.');
    }
}

// Defer prisma and route imports until after env is ready
let prisma; // will be set via dynamic import
let attachUser;
let authRoutes, productsRoutes, brandsRoutes, ordersRoutes, marketingRoutes, tierPricesRoutes, sellersRoutes, deliveryRoutes;
let inventoryRoutes, reportsRoutes, invoicesRoutes;
let settingsRoutes, categoriesRoutes, reviewsRoutes, addressesRoutes;
let envRoutes, endpointsRoutes;
let adminUsersRoutes, adminStatsRoutes, adminAuditRoutes, adminSellersRoutes;
let paypalRouter, bankRouter, stcRouter;
let wishlistRoutes, cartRoutes, searchRoutes, supportRoutes;
let setupRoutes;
let shippingRoutes, shippingWebhooksRoutes, smsaRoutes;
let DB_STATUS = { connected: false, lastPingMs: null, error: null };

const app = express();
let PORT = Number(process.env.PORT) || 4000;

// Structured logging
const rootLogger = pino({ level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'), base: { env: process.env.NODE_ENV || 'development' } });
// Separate namespaces for app vs api logs
const appLogger = rootLogger.child({ component: 'app' });
const apiLogger = rootLogger.child({ component: 'api' });

// Mount API request logger only for /api/* with request-id and sanitized headers
app.use('/api', pinoHttp({
    logger: apiLogger,
    genReqId: (req, res) => {
        const hdrId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
        const id = (typeof hdrId === 'string' && hdrId) || Math.random().toString(36).slice(2, 12);
        res.locals.requestId = id;
        return id;
    },
    serializers: {
        req(req) {
            const headers = { ...req.headers };
            if (headers.authorization) headers.authorization = '[redacted]';
            return { id: req.id, method: req.method, url: req.url, headers };
        },
        res(res) {
            return { statusCode: res.statusCode };
        }
    },
    customLogLevel: (res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
    }
}));

// Security headers (tailored CSP in prod)
app.use(helmet({
    contentSecurityPolicy: isProd ? {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", 'data:', 'https:', 'blob:'],
            "script-src": ["'self'", "'unsafe-inline'", 'https:'],
            "style-src": ["'self'", "'unsafe-inline'", 'https:'],
            "connect-src": ["'self'", 'https:', 'http:', 'ws:', 'wss:']
        }
    } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'sameorigin' },
}));

// Add explicit HSTS in production (ensure HTTPS in front of the app)
if (isProd) {
    try {
        app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
    } catch {}
}

// CORS: allow all in dev, STRICT allowlist in prod
let corsOptions;
if (!isProd) {
    corsOptions = { origin: '*', credentials: false };
} else {
    const allowlist = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);

    // In production, do NOT reflect arbitrary origins. If no allowlist provided, block cross-origin.
    if (allowlist.length === 0) {
        appLogger.warn('[CORS] No CORS_ORIGIN configured in production. Cross-origin requests will be blocked.');
        corsOptions = { origin: false, credentials: true };
    } else {
        corsOptions = {
            origin: (origin, cb) => {
                if (!origin) return cb(null, false); // same-origin/no Origin header
                try {
                    const o = String(origin).replace(/\/$/, '');
                    const ok = allowlist.includes(o);
                    return cb(null, ok ? true : false);
                } catch (e) {
                    return cb(null, false);
                }
            },
            credentials: true
        };
    }
}
app.use(cors(corsOptions));

// تأكد أن static للـ uploads بعد CORS مباشرة
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) { try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch { /* ignore */ } }
// Ensure compression runs early so static responses (including uploads) are compressed when appropriate
app.use(compression({ threshold: Number(process.env.COMPRESSION_THRESHOLD || 1024) }));

// Add a small middleware to set Cache-Control headers for uploads responses explicitly
app.use('/uploads', (req, res, next) => {
    try {
        if (isProd) {
            // 30 days caching for uploaded assets in production
            res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        } else {
            // short caching in dev to allow quick refreshes
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        }
    } catch (e) { /* ignore */ }
    next();
});

app.use('/uploads', express.static(uploadsDir, { maxAge: isProd ? '7d' : 0 }));

// Common middleware
app.use(cookieParser());
app.use(express.json({ limit: process.env.JSON_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy when behind a proxy (Railway/Render/etc.)
// Enable automatically in production unless explicitly disabled
if (isProd || process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// Rate limits (focused)
const authLimiter = rateLimit({ windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 60_000), max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10) });
const payLimiter = rateLimit({ windowMs: Number(process.env.RATE_LIMIT_PAY_WINDOW_MS || 300_000), max: Number(process.env.RATE_LIMIT_PAY_MAX || 5) });
if (process.env.RATE_LIMIT_AUTH_ENABLE === 'true') app.use('/api/auth', authLimiter);
if (process.env.RATE_LIMIT_PAY_ENABLE === 'true') app.use('/api/pay', payLimiter);

// Attach user (JWT from Authorization, with dev headers permitted in non-prod)
// Attach user (injected later after dynamic imports)
// Placeholder middleware until auth is loaded
app.use((req, _res, next) => next());


// Serve uploads statically (تم نقل التعريف بعد CORS)

// Serve client public icons/images for PWA assets when backend is accessed directly
try {
    const clientPublic = path.join(process.cwd(), 'client', 'public');
    const iconsDir = path.join(clientPublic, 'icons');
    const imagesDir = path.join(clientPublic, 'images');
    if (fs.existsSync(iconsDir)) app.use('/icons', express.static(iconsDir, { maxAge: isProd ? '30d' : 0 }));
    if (fs.existsSync(imagesDir)) app.use('/images', express.static(imagesDir, { maxAge: isProd ? '30d' : 0 }));
} catch {}

// Health endpoints and DB diagnostics
async function pingDb() {
    const start = Date.now();
    try {
        // prisma will be set after dynamic import; guard if missing
        if (!prisma) throw new Error('Prisma not initialized');
        await prisma.$queryRaw`SELECT 1`;
        DB_STATUS = { connected: true, lastPingMs: Date.now() - start, error: null };
    } catch (e) {
        DB_STATUS = { connected: false, lastPingMs: Date.now() - start, error: e.message };
    }
}
app.get('/_db_ping', async (_req, res) => { await pingDb(); res.json(DB_STATUS); });
app.get('/_health', async (_req, res) => { await pingDb(); res.json({ ok: true, db: DB_STATUS, pid: process.pid, time: new Date().toISOString() }); });
app.get('/api/health', async (_req, res) => { await pingDb(); res.json({ status: DB_STATUS.connected ? 'ok' : 'degraded', db: DB_STATUS }); });
// Compatibility alias mentioned in repo guide
app.get('/_db_status', async (_req, res) => { await pingDb(); res.json(DB_STATUS); });

// SEO endpoints: robots.txt and sitemap.xml
app.get('/robots.txt', (_req, res) => {
    const origins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const host = origins[0] || process.env.PUBLIC_BASE_URL || '';
    const lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        `Sitemap: ${host ? host.replace(/\/$/, '') : ''}/sitemap.xml`
    ].filter(Boolean);
    res.type('text/plain').send(lines.join('\n'));
});

app.get('/sitemap.xml', async (_req, res) => {
    const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const urls = new Set();
    // Core static pages
    ['/','/products','/offers','/brands','/cart','/checkout','/login','/register'].forEach(p => urls.add(p));
    // Try to include categories and recent products from DB (best-effort)
    try {
        if (prisma) {
            const [cats, prods] = await Promise.all([
                prisma.category?.findMany?.({ select: { slug: true, updatedAt: true }, take: 500 }).catch(() => []),
                prisma.product?.findMany?.({ select: { slug: true, updatedAt: true }, where: { status: 'ACTIVE' }, orderBy: { updatedAt: 'desc' }, take: 1000 }).catch(() => [])
            ]);
            (cats||[]).forEach(c => c?.slug && urls.add(`/category/${encodeURIComponent(c.slug)}`));
            (prods||[]).forEach(p => p?.slug && urls.add(`/products/${encodeURIComponent(p.slug)}`));
        }
    } catch {}

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...Array.from(urls).map(u => {
            const loc = base ? `${base}${u}` : u;
            return `  <url><loc>${loc}</loc></url>`;
        }),
        '</urlset>'
    ].join('\n');
    res.type('application/xml').send(xml);
});

// Holder to register SSE after auth middleware is mounted so req.user is available
function mountSseRoute() {
    // Simple SSE endpoint for app notifications (keep-alive)
    app.get('/api/events', (req, res) => {
        try {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            if (typeof res.flushHeaders === 'function') res.flushHeaders();
            // register client in unified realtime hub which manages heartbeats
            const sseClient = registerSse(res, req.user);
            if (!sseClient) {
                // If registration failed for any reason, return a clear error for easier debugging
                if (!res.headersSent) return res.status(500).json({ error: 'SSE_REGISTER_FAILED', message: 'Failed to register event listener' });
                try { res.end(); } catch (e) { /* ignore */ }
                return;
            }
            // initial hello
            try { res.write(`event: hello\n`); res.write(`data: ${JSON.stringify({ ok: true, t: Date.now() })}\n\n`); } catch(e) { /* ignore write errors */ }
        } catch (err) {
            // Log error and return a JSON error body for easier debugging
            apiLogger.error({ err, path: req.path, method: req.method }, 'SSE /api/events failed');
            if (!res.headersSent) {
                return res.status(500).json({ error: 'SSE_SETUP_FAILED', message: 'Failed to open event stream' });
            }
            try { res.end(); } catch (e) { /* ignore */ }
        }
    });
}

// Dynamically import prisma and routes, then mount them
async function loadModulesAndMount() {
    const prismaMod = await import('./db/client.js');
    prisma = prismaMod.default;
    const authMod = await import('./middleware/auth.js');
    attachUser = authMod.attachUser;
    const [authR, prodR, brandR, orderR, mktR, tierR, sellR, delivR, invR, repR, paypalR, bankR, stcR, settingsR, categoriesR, reviewsR, wishlistR, cartR, searchR, addressesR, supportR, adminUsersR, adminStatsR, adminAuditR, adsR, invoicesR, legalR, shippingR, shippingWebhooksR, setupR, smsaR, envR, endpointsR] = await Promise.all([
        import('./routes/auth.js'),
        import('./routes/products.js'),
        import('./routes/brands.js'),
        import('./routes/orders.js'),
        import('./routes/marketing.js'),
        import('./routes/tierPrices.js'),
        import('./routes/sellers.js'),
        import('./routes/delivery.js'),
        import('./routes/inventory.js'),
        import('./routes/reports.js'),
        import('./paypal.js'),
        import('./bank.js'),
        import('./stc.js'),
        import('./routes/settings.js'),
        import('./routes/categories.js'),
        import('./routes/reviews.js'),
        import('./routes/wishlist.js'),
        import('./routes/cart.js'),
        import('./routes/search.js'),
        import('./routes/addresses.js'),
        import('./routes/support.js'),
        import('./routes/adminUsers.js'),
        import('./routes/adminStats.js'),
        import('./routes/adminAudit.js'),
        import('./routes/ads.js'),
        import('./routes/invoices.js'),
        import('./routes/legal.js'),
        import('./routes/shipping.js'),
        import('./routes/shipping-webhooks.js'),
        import('./routes/setup.js'),
        import('./routes/smsa.js'),
        import('./routes/env.js'),
        import('./routes/endpoints.js'),
    ]);
    authRoutes = authR.default; productsRoutes = prodR.default; brandsRoutes = brandR.default; ordersRoutes = orderR.default;
    marketingRoutes = mktR.default; tierPricesRoutes = tierR.default; sellersRoutes = sellR.default; deliveryRoutes = delivR.default;
    inventoryRoutes = invR.default; reportsRoutes = repR.default; invoicesRoutes = invoicesR.default;
    paypalRouter = paypalR.default; bankRouter = bankR.default; stcRouter = stcR.default;
    settingsRoutes = settingsR.default; categoriesRoutes = categoriesR.default; reviewsRoutes = reviewsR.default; addressesRoutes = addressesR.default;
    envRoutes = envR.default; endpointsRoutes = endpointsR.default;
    supportRoutes = supportR.default;
    shippingRoutes = shippingR.default; shippingWebhooksRoutes = shippingWebhooksR.default;
    adminUsersRoutes = adminUsersR.default; adminStatsRoutes = adminStatsR.default; adminAuditRoutes = adminAuditR.default;
    // sellers module also exports an admin router for KYC
    adminSellersRoutes = sellR.adminSellersRouter;
    wishlistRoutes = wishlistR.default; cartRoutes = cartR.default; searchRoutes = searchR.default;
    setupRoutes = setupR.default;
    smsaRoutes = smsaR.default;
    // Now replace placeholder attachUser with real one by reordering middleware: remove last no-op? Not trivial; just use real middleware for subsequent routers.
    app.use(attachUser);
    // Mount SSE route AFTER auth so query/cookie/Bearer tokens populate req.user
    mountSseRoute();
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productsRoutes);
    app.use('/api/brands', brandsRoutes);
    app.use('/api/orders', ordersRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/reports', reportsRoutes);
    app.use('/api/invoices', invoicesRoutes);
    app.use('/api/marketing', marketingRoutes);
    app.use('/api/legal', legalR.default);
    app.use('/api/tier-prices', tierPricesRoutes);
    app.use('/api/sellers', sellersRoutes);
    app.use('/api/delivery', deliveryRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/env', envRoutes);
    app.use('/api/categories', categoriesRoutes);
    app.use('/api/reviews', reviewsRoutes);
    app.use('/api/addresses', addressesRoutes);
    // Shipping: quote + webhook receivers
    if (shippingRoutes) app.use('/api/shipping', shippingRoutes);
    if (shippingWebhooksRoutes) app.use('/api/shipping', shippingWebhooksRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/support', supportRoutes);
    // Setup (first admin creation): intentionally unauthenticated, guarded server-side to only allow when no users exist
    if (setupRoutes) app.use('/api/setup', setupRoutes);
    app.use('/api/pay/paypal', paypalRouter);
    app.use('/api/pay/bank', bankRouter);
    app.use('/api/pay/stc', stcRouter);
    app.use('/api/ads', adsR.default);
    app.use('/api/shipping/smsa', smsaRoutes);
    // Admin routes
    if (adminUsersRoutes) app.use('/api/admin/users', adminUsersRoutes);
    if (adminStatsRoutes) app.use('/api/admin/stats', adminStatsRoutes);
    if (adminAuditRoutes) app.use('/api/admin/audit', adminAuditRoutes);
    if (adminSellersRoutes) app.use('/api/admin/sellers', adminSellersRoutes);
    app.use('/api/endpoints', endpointsRoutes);
}
await loadModulesAndMount();

// Optional SPA serving (from client/dist)
if (process.env.SERVE_CLIENT === 'true') {
    const dist = path.join(process.cwd(), 'client', 'dist');
    if (fs.existsSync(dist)) {
        app.use(express.static(dist, { maxAge: isProd ? '7d' : 0 }));
        app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/')) return next();
            res.sendFile(path.join(dist, 'index.html'));
        });
    } else {
        appLogger.warn(`[SERVE_CLIENT] Enabled but folder not found: ${dist}`);
    }
}

// API 404 handler (structured JSON) before global error handler
app.use('/api', (req, res, next) => {
    if (!res.headersSent) {
        apiLogger.warn({ path: req.path, requestId: res.locals.requestId || req.id }, 'API route not found');
        return res.status(404).json({ error: 'NOT_FOUND', path: req.path, requestId: res.locals.requestId || req.id });
    }
    next();
});

// Global error handler: log full error internally, hide stack from clients
app.use((err, req, res, _next) => {
    const requestId = res.locals.requestId || req?.id || undefined;
    const log = req?.path?.startsWith('/api/') ? apiLogger : appLogger;
    log.error({ err, requestId, path: req?.path, method: req?.method }, 'Unhandled error');
    res.status(err.status || 500).json({ error: 'INTERNAL_ERROR', message: 'Internal Server Error', requestId });
});

// Start server (auto-increment port if busy)
function start(port, attempt = 0) {
    const server = app.listen(port, async () => {
        await pingDb();
        appLogger.info(`API listening on http://localhost:${port}`);
    });
    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE' && attempt < 5) {
            appLogger.warn(`[PORT] ${port} in use, retrying on ${port + 1} ...`);
            start(port + 1, attempt + 1);
        } else {
            appLogger.error(e, 'Server failed to start');
            process.exit(1);
        }
    });
}

start(PORT);

// Graceful shutdown
function shutdown(sig) {
    appLogger.warn(`[APP] Signal ${sig} received — shutting down.`);
    process.exit(0);
}
['SIGINT','SIGTERM'].forEach(s => process.on(s, () => shutdown(s)));
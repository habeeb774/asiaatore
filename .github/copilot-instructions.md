# AI Agent Guide for this Repo

Purpose: make you productive immediately on this codebase. Keep answers concrete and wired to this project’s patterns and scripts.

## Big picture
- Stack: React (Vite) SPA in `src/` + Express API in `server/` + Prisma (MySQL) in `prisma/`.
- Runtime: Node ESM ("type": "module"). Import paths use `import x from '...'`.
- Data access: single Prisma client at `server/db/client.js` (singleton). Do not instantiate a new PrismaClient per request.
- API entrypoint: `server/index.js` (not `server/server.js`). It boots Express, validates DB config, wires routes under `/api/*`, and provides health endpoints (`/_health`, `/_db_status`, `/_db_ping`).
- Key domain models: see `prisma/schema.prisma` (Product, Order, OrderItem, User, Review, Brand, ProductImage, Marketing*).
- Uploads/static: served from `/uploads` folder via Express.

## Local dev workflow
- Install: `npm install`.
- DB: use local MySQL or Docker (`docker compose up -d`). Connection via `DATABASE_URL` (mysql://...).
- Prisma: `npm run db:push` (dev sync) or `npx prisma migrate dev --name <msg>` (migrations). Generate client with `npm run db:generate`. Browse with `npm run db:studio`.
- Seed: `npm run db:seed` (creates demo data if script supports it).
- API server: `npm run dev:server` (runs `server/index.js`). If port 4000 is busy, it auto-increments.
- Frontend: `npm run dev` (Vite, default port 3000, proxies `/api` to backend). Open http://localhost:3000.
- Health checks: http://localhost:4000/_health and http://localhost:4000/_db_ping.

## Environment and config tips
- `.env` is loaded with override; ensure `DATABASE_URL` starts with `mysql://`. Shorthands like `user:pass@host:3306/db` are normalized.
- If `DATABASE_URL` is invalid or missing, the server can rebuild from parts: `DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME`.
- Dev-only helpers:
  - `QUICK_START_DB=1` injects `mysql://root:AlvYFhUfDYXSCykrgHpncurIFgwffLmF@yamabiko.proxy.rlwy.net:23471/railway` as a fallback.
  - `ALLOW_INVALID_DB=true` lets the API run in degraded mode (non-DB routes only).
  - `ALLOW_DEV_HEADERS=true` allows header-based fake auth (`x-user-id`, `x-user-role`).
  - `DEBUG_ERRORS=true` includes stack traces in JSON error responses (non-prod only).
- CORS: in production, set `CORS_ORIGIN` (comma-separated allowlist). In dev, CORS is permissive.

## Routing and middleware
- Auth: `server/middleware/auth.js`.
  - Use `attachUser` to populate `req.user` from `Authorization: Bearer <jwt>` (via `server/utils/jwt.js`).
  - Guard helpers: `requireAdmin`, `requireRole('role')`.
- DB guard: server’s `requireValidDb` blocks DB-backed routes when DB is down or misconfigured.
- Rate limiters: applied to `/api/auth` and `/api/pay`.
- Shipping quote: pure function at `server/utils/shipping.js`, exposed via `POST /api/shipping/quote` (no DB required).

## Notable APIs and patterns
- Orders: `server/routes/orders.js`.
  - Creating/updating orders computes totals via `server/utils/totals.js`.
  - Non-catalog items use `productId="custom"`; a placeholder product is upserted if needed.
  - Response mapping uses `mapOrder()`; keep shapes consistent (e.g., `grandTotal` and legacy alias `total`).
  - Admins can patch items; normal users can only modify pending own orders.
- Auth: `server/routes/auth.js` implements `/api/auth/login`, `/register`, simple reset endpoints. Passwords hashed with bcrypt.
- Payments: see top-level `README-PAYMENTS.md` and routes: `server/paypal.js`, `server/stc.js`, `server/bank.js` and the inline COD route `POST /api/pay/cod/enable`.
- Audit: `server/utils/audit.js` writes to `AuditLog`; call `audit({ action, entity, entityId, userId, meta })` for significant events.

## Frontend conventions
- Vite config proxies `/api` to `VITE_PROXY_TARGET` or `http://localhost:4000` by default (`vite.config.js`).
- SPA routes live in `src/pages` and `src/AppRoutes.jsx`. Components under `src/components/**`, contexts under `src/context/**`.
- React 19 setup with `@vitejs/plugin-react`, Tailwind 4 (`tailwind.config.js`, `postcss.config.cjs`).

## Project scripts (npm run ...)
- `dev` (Vite), `dev:server` (API), `build` (Vite build), `preview` (serve built SPA), `dev:debug` (API with extra debug env for login/products).
- Prisma: `db:push`, `db:generate`, `db:studio`, `db:seed`.
- Admin helpers in `server/scripts/*`: `admin:create`, `users:list`, `login:verify`, etc.
- PM2: `pm2:start`, `pm2:logs` using `ecosystem.config.js`.

## Data model hotspots
- `prisma/schema.prisma` uses `mysql` provider; key enums: `Role`, `ReviewStatus`, packaging/banners/platform enums.
- Indexing is defined on frequently queried fields (e.g., `Order.status`, `createdAt`). Preserve or extend indexes when adding queries.

## Common pitfalls (seen in this repo)
- Starting the API without a valid `DATABASE_URL` causes immediate exit unless `ALLOW_INVALID_DB=true` or `QUICK_START_DB=1`.
- Don’t create new PrismaClient instances per module; import the singleton from `server/db/client.js`.
- Some files like `server/server.js`, `server/app.js`, `server/routes/index.js` are placeholders—don’t wire new code there; use `server/index.js` and specific route files.

## Examples
- Mask DB URL in logs using the helper in `server/index.js` when adding diagnostics.
- Add a new admin-only endpoint:
  - In a route file: `router.get('/secure', requireAdmin, (req, res) => res.json({ ok:true }))`.
  - Ensure the route is mounted under the correct base path in `server/index.js`.

## When adding features
- Follow existing patterns: route module under `server/routes/`, import prisma singleton, reuse `audit()`, and respect guards.
- Update Prisma schema then run `npm run db:generate` and migrate/push. Reflect new fields in response mappers.
- Frontend: call APIs under `/api/*`; rely on Vite proxy in dev.


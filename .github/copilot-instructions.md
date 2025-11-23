## AI Agent Guide for this Repo — Copilot Instructions

Purpose: Give AI coding agents the minimal, essential knowledge to be productive quickly in this codebase.

--

Big picture
- Monorepo: `client/` (React + Vite + Tailwind) + `server/` (Express + Prisma + MySQL) + `prisma/` (schema & migrations).
- Runtime: Node ESM (`type: module`) — use `import`/`export`.
- API entrypoint: `server/index.js` — performs env validation, logging setup, deferred imports, mounts routes under `/api/*`, and offers health endpoints (`/_health`, `/_db_ping`).

Key patterns & conventions
- Prisma client singleton: `server/db/client.js` — **do not create new PrismaClient instances** elsewhere; import the singleton.
- Degraded DB mode: `ALLOW_INVALID_DB=true` exports a prisma stub that throws on DB access; `QUICK_START_DB=1` injects a fallback dev `DATABASE_URL` during dev.
- Routes: each route file under `server/controllers/` exports an Express router and is imported dynamically in `server/index.js`.
- Service layer: domain logic lives in `server/modules/*` or `server/services/*`; controllers should remain thin and delegate heavy logic to services.
- API responses: success -> `{ ok: true, resource: ... }`; errors -> `{ error, message, ... }`.
- Validation: use `zod` (v4) with `unknown()` and `catchall()` where needed for stable parsing.
- Totals & orders: use `server/utils/totals.js` and `mapOrder()` (`server/controllers/orders.js`, and `server/modules/orders/service.js`).
- Non-catalog product pattern: `productId: "custom"` — server upserts a placeholder product.
- Realtime: SSE endpoint at `GET /api/events`; `utils/realtimeHub.js` exposes `emitOrderEvent()` and client registration utilities.

Environment & runtime notes
- `DATABASE_URL`: required for DB-backed routes; if not present, the server may: 1) exit (production), or 2) run degraded (dev) depending on flags.
- Key flags:
  - `QUICK_START_DB=1` — sets a dev fallback `DATABASE_URL`.
  - `ALLOW_INVALID_DB=true` — run server in degraded mode without DB.
  - `ALLOW_DEV_HEADERS=true` — allow `x-user-id`/`x-user-role` fake auth headers for local development.
  - `DEBUG_ERRORS=true` — add stack traces and debug output in responses and logs.
  - `SERVE_CLIENT=true` — serve `client/dist` from backend (useful for single-host deployments).
  - `ENCRYPTION_KEY` — must be set for production; dev uses a fallback key.
  - `TRUST_PROXY=true` — trust reverse proxy headers (useful in cloud hosting).

Start-up and import order
- `server/index.js` intentionally delays imports of `prisma` and controllers until environment variables are validated — avoid importing `prisma` earlier (e.g., in shared modules or top-level files) to prevent startup failures.
- The server exports `createServer()` for serverless (Vercel) usage; when not serverless, it starts a listener and auto-increments the port if busy.

Developer workflows & scripts (common tasks)
- Install + run dev server & client
  - npm install
  - npm run dev:server (starts API, picks port 8829+) or `npm run dev:server:admin` (ALLOw_DEV_HEADERS)
  - npm run dev (client only via workspace)
- DB (prisma)
  - npm run db:generate
  - npm run db:push
  - npm run db:studio
  - npm run db:seed
- Seed / reset
  - npm run db:reset
- Tests & CI
  - Unit: npm run test:unit (client) / vitest
  - UI: npm run test:ui (Playwright)
  - API smoke: npm run test:api
  - Integration: npm run test:all / custom scripts
  - CI: npm run ci:verify
- Quick degraded start (no DB):
  - cross-env QUICK_START_DB=1 ALLOW_INVALID_DB=true node server/index.js

Key development tips and pitfalls
- Don’t import Prisma early—`server/index.js` sets up env-first and imports after validation.
- If the API fails to start due to missing DB in a non-degraded environment, use `QUICK_START_DB` or `ALLOW_INVALID_DB` for local testing.
- Use `ALLOW_DEV_HEADERS=true` + `npm run dev:server:admin` to simulate authenticated users via headers.
- Avoid editing `server/server.js` / `server/app.js` placeholders; the canonical startup is `server/index.js`.
- Puppeteer/Chromium is optional; PDF endpoints will return `501 PDF_NOT_AVAILABLE` in environments without Chromium.
- Keep response shapes consistent with `{ ok: true }` patterns for agent-generated routes.

Where to add/change behavior
- New public route: create `server/controllers/<resource>.js`, export `router`, and ensure it is imported in `server/index.js`’s dynamic list.
- New domain logic: add a module under `server/modules/<domain>/service.js` and reuse in the controller.
- New DB migration: update `prisma/schema.prisma`, run `npm run db:generate` & `npx prisma migrate dev --name <reason>`.

Examples & common commands
```
# Start API in degraded mode (no DB)
cross-env QUICK_START_DB=1 ALLOW_INVALID_DB=true node server/index.js

# Start API and client (dev)
npm run dev:server & npm run dev -w client

# Quick CI-like check
npm run ci:verify

# Dev with mocked auth headers (simulate users)
cross-env PORT=8829 ALLOW_DEV_HEADERS=true node server/index.js
```

Files to check before editing
- `server/index.js` — startup, security, dynamic imports, SSE mounting
- `server/db/client.js` — Prisma client singleton and degraded behavior
- `server/controllers/*.js` & `server/modules/**/service.js` — route -> service separation
- `client/` — SPA code; `src/pages` & `src/components` are main areas

Final notes for the AI agent
- Preserve and follow existing response shapes and validation patterns. Reuse helpers (e.g., `audit()`, `computeTotals()`, `mapOrder()`), obey `zod` schemas, and respect security guards (`requireAuth`, `requireAdmin`).
- When in doubt, reference existing controllers (e.g., `server/controllers/orders.js`) and follow their style (detailed error messages, `ok`-first responses, degraded mode handling).
## AI Agent Guide for this Repo — Copilot Instructions

Purpose: Make an AI coding agent immediately useful in this repository by highlighting the architecture, patterns, common workflows, and guardrails used by developers.

Big picture
- Monorepo: `client/` (React + Vite + Tailwind) + `server/` (Express + Prisma + MySQL) + `prisma/` (schema & migrations).
- Runtime is Node ESM (package.json `type: module`) — use `import`/`export`.
- API entrypoint: `server/index.js` (loads env, sets up logging, guards, dynamically imports prisma and routes, mounts routes under `/api/*`).

Key patterns & conventions
- Prisma client singleton: `server/db/client.js` — **do not instantiate** PrismaClient elsewhere; import the singleton.
- Controllers: `server/controllers/*` expose routers; mount under `/api/<resource>` in `server/index.js`.
- Services: business logic lives in `server/modules/*` and `server/services/*` — prefer service functions over controller logic for complex behavior.
- Responses: success responses commonly return `{ ok: true, <resource>: ... }`; errors follow `{ error, message, ... }`.
- Validation: `zod` is used for request validation; `zod v4` idioms (use `unknown`, `catchall`) appear in routes.
- Totals/order logic is centralized in `server/utils/totals.js` and mapped through `mapOrder()` (see `server/controllers/orders.js`).
- Non-catalog items: use `productId: "custom"` — the server upserts a placeholder product automatically.
- Realtime: SSE endpoint at `GET /api/events` and server side `emitOrderEvent(...)` in `server/utils/realtimeHub.js`.

Important environment flags & behaviors
- `DATABASE_URL` — required for DB-backed routes; when absent, the app can run in degraded mode if `ALLOW_INVALID_DB=true`.
- `QUICK_START_DB=1` — injects a fallback dev DATABASE_URL; used in local dev scripts.
- `ALLOW_INVALID_DB=true` — starts the API in degraded mode; PrismaClient is a stub that throws on DB calls.
- `ALLOW_DEV_HEADERS=true` — enables header-based fake auth (`x-user-id`, `x-user-role`) for development.
- `DEBUG_ERRORS=true` — enables extra diagnostic output in responses and server logs.
- `SERVE_CLIENT=true` — when set, `server/index.js` will serve static files from `client/dist` and fallback to `index.html`.
- `ENCRYPTION_KEY` — used for encrypting sensitive fields; must be set in production.

How the server starts (notable details)
- `server/index.js` delays importing `prisma` and all controller modules until env vars are validated — avoid importing prisma before env setup.
- Prisma logs and events are enabled in `server/db/client.js`. In degraded mode, the file exports a stub prisma that throws on access.
- `createServer()` is exported so the app can be used serverless (e.g., Vercel). When `VERCEL` is not set, the app starts a listener and auto-increments the port if in use.

Developer workflows & useful scripts
- Full dev (client + server): `npm run dev` (maps to `npm run dev -w client`).
- Start API (dev): `npm run dev:server` — runs `server/index.js`; port defaults to 8829 and auto-increments.
- Debug: `npm run dev:server:dbless` or `cross-env QUICK_START_DB=1 ALLOW_INVALID_DB=true node server/index.js`.
- Debug with dev headers (simulate users): `npm run dev:server:admin` which sets `ALLOW_DEV_HEADERS=true`.
- Generate/Push/Seed Prisma: `npm run db:generate`, `npm run db:push`, `npm run db:seed`.
- Tests:
  - Unit (client): `npm run test:unit` (runs Vitest for the `client` workspace).
  - UI: `npm run test:ui` (Playwright)
  - API smoke: `npm run test:api` (server scripts)
  - CI verification: `npm run ci:verify` (typecheck/build/prisma validate)

CI / Prettiness & Linting
- Root `lint` runs `eslint` across the repo. Client has its own `lint` script in `client/package.json`.
- The monorepo uses workspaces; to invoke a workspace script, add `-w <workspace>` or run the top-level scripts that already target workspaces (e.g., `npm run dev` -> client dev). 

Where to add new code
- New API routes: create a controller under `server/controllers/` and import it in `server/index.js` (the index dynamically imports controllers; adhere to the current import list style).
- New shared utilities: place in `server/utils` or `shared/` if both client and server need them.
- New database models: add to `prisma/schema.prisma`, then run `npm run db:generate` and `npm run db:push` and migration if needed.

Security & Operations
- Never log secrets (`DATABASE_URL`, `ENCRYPTION_KEY`, or JWT contents) — the server sanitizes authorization headers before logging.
- Respect `CORS_ORIGIN` in production; in dev CORS is permissive.
- Use `ALLOW_INVALID_DB` / degraded mode for quicker local iterations but be sure to test the DB-backed behaviors in an environment with a real DB instance.

Examples (commands)
```
# Start API (degraded) locally when you don't need DB
cross-env QUICK_START_DB=1 ALLOW_INVALID_DB=true node server/index.js

# Start full dev: server + client
npm run dev:server & npm run dev -w client

# Run UI tests with Playwright (integration: starts dev server on 4010)
npm run dev:server:test & timeout 3 > NUL & PLAYWRIGHT_BASE_URL=http://localhost:4010 npm run test:ui

# Quick check (CI-like): typecheck + build + prisma validate
npm run ci:verify
```

Key files to check before editing
- `server/index.js` — startup logic, dynamic imports, and security guards
- `server/db/client.js` — Prisma singleton & degraded mode stub
- `server/controllers/*.js` — route handlers; look for `zod` validation and `map*()` response mappers
- `server/utils/*` — totals, shipping, QR, SSF logic used across the app
- `client/` — SPA code; `src/pages` & `src/components` are the main areas for UI changes

If you are unsure
- Prefer minimal changes that match existing response shapes and logging patterns.
- Reuse existing helpers: `audit()`, `mapOrder()`, `computeTotals()`.
- If you need to debug flows quickly, enable `ALLOW_DEV_HEADERS=true` and run server with `dev:server:admin`.

Questions? Ask for an example change and the exact file to modify — I can produce a PR following these conventions.
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
- API server: `npm run dev:server` (runs `server/index.js`). If port 8829 is busy, it auto-increments.
- Frontend: `npm run dev` (Vite, default port 3000, proxies `/api` to backend). Open http://localhost:3000.
- Health checks: http://localhost:8829/_health and http://localhost:8829/_db_ping.

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
- Vite config proxies `/api` to `VITE_PROXY_TARGET` or `http://localhost:8829` by default (`vite.config.js`).
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


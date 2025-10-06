# 🧩 Developer Guide — Debug, API Shapes, and Internal Conventions

This document defines the key technical standards and helper sections for the `my-store` project.
AI coding agents (e.g., Copilot) should use this as a quick reference when generating or updating code.

---

## ⚙️ 1) Debug / Diagnostics (Windows PowerShell)

Common local issues and quick one-liners.

- Verify .env before anything: DATABASE_URL must start with `mysql://`.
  - Dev helpers: `QUICK_START_DB=1` (local fallback URL), `ALLOW_INVALID_DB=true` (degraded mode), `ALLOW_DEV_HEADERS=true` (header-based fake auth).
  - API health: http://localhost:4000/_health | DB ping: http://localhost:4000/_db_ping

### 🔧 Free a locked port (Vite at 3000 or API at 4000)
```powershell
# Find and kill the process using port 3000
netstat -ano | findstr :3000
# Then replace <PID> with the actual number
taskkill /PID <PID> /F

# For the API default port 4000
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### 🧹 Clean reinstall dependencies
```powershell
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### 🗄️ Reset Prisma schema / dev DB
```powershell
npx prisma migrate reset --force
```

### 🧪 Rebuild/run cleanly
```powershell
npm run build
npm run dev:server
npm run dev
```

> Tip: The API auto-increments the port if 4000 is busy. The Vite dev server uses port 3000 (see `vite.config.js`).

---

## 🔗 2) API Shapes Appendix (REST + Realtime + GraphQL)

Keep request/response formats consistent with current routes.

### Orders — Create
```
POST /api/orders
```
Request (minimal example):
```json
{
  "items": [ { "productId": "123", "quantity": 2 } ],
  "paymentMethod": "card",
  "paymentMeta": { "note": "optional meta" }
}
```
Response:
```json
{
  "ok": true,
  "order": {
    "id": "ord_123",
    "status": "pending",
    "currency": "SAR",
    "grandTotal": 89.99,
    "total": 89.99
  }
}
```
Notes:
- Non-catalog items may use `productId: "custom"`. A placeholder product will be upserted automatically.
- Totals are computed on the server (`server/utils/totals.js`).

### Orders — Patch (Update)
```
PATCH /api/orders/:id
```
Request (example):
```json
{ "status": "shipped" }
```
Response:
```json
{ "ok": true, "order": { "id": "ord_123", "status": "shipped" } }
```
Access rules:
- Admins can update any order (including items).
- Normal users can only update their own pending orders and cannot arbitrarily change sensitive fields.

### Auth — Login
```
POST /api/auth/login
```
Request:
```json
{ "email": "user@example.com", "password": "mypassword" }
```
Response:
```json
{
  "ok": true,
  "token": "<jwt>",
  "user": { "id": "u_001", "email": "user@example.com", "role": "user", "name": "John Doe" }
}
```

### Realtime — Server-Sent Events (SSE)
```
GET /api/events
```
Events:
- `order.created` — `{ type, orderId, userId, status, at }`
- `order.updated` — `{ type, orderId, userId, status, at }`
- `heartbeat` — keep-alive pings

Delivery rules:
- Sent to the order owner and to admins only.

### GraphQL (optional, if deps installed)
```
POST /api/graphql
```
Highlights:
- Query `products`, `product(id)`, `orders`, `order(id)`
- Mutations: `createOrder(input)`, `updateOrder(id, input)`
- Auth via `Authorization: Bearer <jwt>`; context exposes `{ user, prisma }`

---

## 🧱 3) Internal Conventions

### Naming
| Type              | Convention                   | Example             |
| ----------------- | ---------------------------- | ------------------- |
| React Components  | PascalCase                   | `OrderCard.jsx`     |
| Files / Folders   | kebab-case                   | `order-card/`       |
| Context Providers | PascalCase + Context suffix  | `OrdersContext.jsx` |
| API Routes        | lowercase kebab/dashes       | `/api/orders`       |

### Logging & Audit
- Use `console.info` for normal flow; `console.warn` for recoverable issues; `console.error` for critical errors.
- Use `audit({ action, entity, entityId, userId, meta })` for significant events (see `server/utils/audit.js`).

### Error payload conventions
- REST errors return `{ error, message, ... }` with meaningful HTTP status codes (Prisma codes mapped where possible).
- Happy paths typically return `{ ok: true, ... }` and the primary resource under a named key (e.g., `order`, `items`).

### Testing (status)
- No test framework is wired by default. If adding tests, place them next to code (e.g., `Component.test.jsx`) and cover at least:
  1) Happy path  2) Error handling  3) Edge case

### Formatting
- ESLint is configured (`eslint.config.js`). Prettier is optional.

---

## 📦 4) Project Setup Checklist

1) Install Node.js 18+ and npm 9+
2) Copy `.env.example` to `.env` and set:
   - `AUTH_SECRET` (or `JWT_SECRET`) — strong secret in production
   - `DATABASE_URL` — a valid MySQL URL like `mysql://user:pass@localhost:3306/my_store`
   - Optional Dev: `QUICK_START_DB=1`, `ALLOW_INVALID_DB=true`
3) Install & run:
```powershell
npm install
npm run dev:server
npm run dev
```
4) URLs:
- Frontend (Vite): http://localhost:3000
- API: http://localhost:4000 (auto-increments if busy)
- Health: /_health, /_db_status, /_db_ping
- Docs: /api/docs (HTML) and /api/docs.json (OpenAPI-lite)
- Realtime: /api/events

---

## 🧭 Optional Future Additions
- Add `CHANGELOG.md` for versioning
- Add “Mobile optimization checklist”
- Add performance profiling steps with React DevTools

---

> ✅ Agent Notes
>
> - Keep REST response shapes aligned with the patterns above (`{ ok: true, ... }` for success; `{ error, message }` for failures).
> - Reuse Prisma singleton from `server/db/client.js`. Do not create new clients.
> - When touching orders, recompute totals using `server/utils/totals.js` and preserve `mapOrder` shape.
> - For realtime UX, consider listening to `/api/events` and refetch affected resources on `order.*` events.

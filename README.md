# My Store (React + Vite + Express + Prisma)

Full‑stack demo store: React (Vite) frontend + Express API + Prisma (MySQL).

## Quick Start

1. Copy `.env.example` to `.env` and adjust credentials (or use Docker below).
2. Install deps:
	```powershell
	npm install
	```
3. (Optional) Start MySQL via Docker:
	```powershell
	docker compose up -d
	```
4. Push schema & generate client:
	```powershell
	npx prisma db push
	npm run db:generate
	```
5. Seed demo data (admin + products):
	```powershell
	npm run db:seed
	```
6. Start API server:
	```powershell
	npm run dev:server
	```
7. Start frontend (in a second terminal):
	```powershell
	npm run dev
	```
8. Open http://localhost:5173 (frontend) and http://localhost:4000/_health (API health).

Admin demo user (if seeded): `admin@example.com / Admin123!`


## Key Features

- **E-commerce**: Full product catalog, cart, checkout, orders, invoices
- **Multi-payment**: PayPal, STC Pay, Bank Transfer, Cash on Delivery
- **Admin Dashboard**: Products, users, orders, analytics, reports
- **Delivery Management**: Complete delivery worker system with GPS tracking (see [README-DELIVERY.md](./README-DELIVERY.md))
- **Real-time Updates**: SSE/WebSocket for live order and delivery status
- **Multi-language**: Arabic & English support
- **Marketing**: Banners, features, app links
- **Security**: JWT auth, role-based access, session management
## Production

- Use `.env.production.example` as a template and set CORS_ORIGIN to your domains.
- Build the client with Vite: `npm run build`.
- Start the server with PM2: `npm run pm2:start`.
- Health: `GET /_health`. Ensure DB status is ok.

## Environment Variables
`DATABASE_URL` (alias: `DB_URL`) must be a valid MySQL connection string, e.g.:
```
mysql://root:root@localhost:3306/my_store_db
```

If you used the provided Docker Compose, the above works (root/root). For a non‑root user:
```
mysql://store_user:StorePass123!@localhost:3306/my_store_db
```

## Useful Prisma Commands
```powershell
npx prisma studio       # Browse data UI
npx prisma migrate dev --name init   # Create migration (prod workflow)
npx prisma db push      # Push schema (dev quick sync)
npm run db:generate     # Generate updated Prisma client after schema changes
```

## API Health & Diagnostics
- `GET /_health` overall
- `GET /_db_status` DB config flags
- `GET /_db_ping` direct latency test

## Arabic Quick Guide (دليل سريع بالعربية)
### تشغيل المشروع بسرعة
1. انسخ ملف `.env.example` إلى `.env` وعدل `DATABASE_URL` إذا لزم.
2. لتشغيل قاعدة بيانات MySQL جاهزة:
	```powershell
	docker compose up -d
	```
3. ادفع المخطط (سكيمة Prisma):
	```powershell
	npx prisma db push
	```
4. أنشئ البيانات الأولية:
	```powershell
	npm run db:seed
	```
5. شغّل الخادم الخلفي:
	```powershell
	npm run dev:server
	```
6. شغّل الواجهة:
	```powershell
	npm run dev
	```

### بيانات تسجيل دخول الأدمن
`admin@example.com` كلمة المرور: `Admin123!`

### مشاكل شائعة
- خطأ DATABASE_URL: تأكد أن الصيغة تبدأ بـ `mysql://`.
- لا توجد جداول: نفّذ `npx prisma db push`.
- فشل الاتصال: تأكد أن الحاوية (Docker) تعمل: `docker ps`.

## Development Notes
The React app uses Vite + Tailwind + SCSS partials. Server is ESM ("type": "module").

## License
Internal demo (no explicit license set yet).

## Auth

JWT with Access + Refresh tokens is implemented in the API.

- POST /api/auth/register — create user. Responds with accessToken + refreshToken.
- POST /api/auth/login — login with email/password. Responds with accessToken + refreshToken.
- POST /api/auth/refresh — exchange refreshToken for new accessToken (rotates refresh).
- POST /api/auth/logout — revoke a refreshToken.
- POST /api/auth/forgot — send password reset link to email.
- POST /api/auth/reset — reset using `{ email, token, newPassword }`.
- POST /api/auth/verify-email/request — send verification email to current user.
- GET /api/auth/verify-email?token=...&email=... — verify email.
- POST /api/auth/verify-phone/request — send 6-digit code via SMS to current user.
- POST /api/auth/verify-phone/confirm — confirm code.

Roles: `user` (عميل), `seller` (بائع), `admin` (مدير). Use `requireRole('seller')` and `requireAdmin` middleware to protect routes.

### Email/SMS Providers
- Email (SendGrid): set `SENDGRID_API_KEY` and `SENDGRID_FROM` (or `EMAIL_FROM`) to enable real emails. If not set, emails are simulated and printed to the server logs.
- SMS (Twilio): set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM` (your Twilio phone number) to enable real SMS sends. If not set, SMS sends are simulated and logged.

## Server Middleware
- Security: `helmet`
- CORS: allowlist via `CORS_ORIGIN` (comma-separated) in production; permissive in dev
- Compression: `compression` is enabled by default
- Logging: `morgan` (format configurable via `MORGAN_FORMAT`)
- Trust proxy: set `TRUST_PROXY=true` when behind Nginx/Load Balancer
<<<<<<< HEAD
# asiaatore
=======
# My Store (React + Vite + Express + Prisma)

Full‑stack demo store: React (Vite) frontend + Express API + Prisma (MySQL).

## Quick Start

1. Copy `.env.example` to `.env` and adjust credentials (or use Docker below).
2. Install deps:
	```powershell
	npm install
	```
3. (Optional) Start MySQL via Docker:
	```powershell
	docker compose up -d
	```
4. Push schema & generate client:
	```powershell
	npx prisma db push
	npm run db:generate
	```
5. Seed demo data (admin + products):
	```powershell
	npm run db:seed
	```
6. Start API server:
	```powershell
	npm run dev:server
	```
7. Start frontend (in a second terminal):
	```powershell
	npm run dev
	```
8. Open http://localhost:5173 (frontend) and http://localhost:4000/_health (API health).

Admin demo user (if seeded): `admin@example.com / Admin123!`

## Production

- Use `.env.production.example` as a template and set CORS_ORIGIN to your domains.
- Build the client with Vite: `npm run build`.
- Start the server with PM2: `npm run pm2:start`.
- Health: `GET /_health`. Ensure DB status is ok.

## Environment Variables
`DATABASE_URL` (alias: `DB_URL`) must be a valid MySQL connection string, e.g.:
```
mysql://root:root@localhost:3306/my_store_db
```

If you used the provided Docker Compose, the above works (root/root). For a non‑root user:
```
mysql://store_user:StorePass123!@localhost:3306/my_store_db
```

## Useful Prisma Commands
```powershell
npx prisma studio       # Browse data UI
npx prisma migrate dev --name init   # Create migration (prod workflow)
npx prisma db push      # Push schema (dev quick sync)
npm run db:generate     # Generate updated Prisma client after schema changes
```

## API Health & Diagnostics
- `GET /_health` overall
- `GET /_db_status` DB config flags
- `GET /_db_ping` direct latency test

## Arabic Quick Guide (دليل سريع بالعربية)
### تشغيل المشروع بسرعة
1. انسخ ملف `.env.example` إلى `.env` وعدل `DATABASE_URL` إذا لزم.
2. لتشغيل قاعدة بيانات MySQL جاهزة:
	```powershell
	docker compose up -d
	```
3. ادفع المخطط (سكيمة Prisma):
	```powershell
	npx prisma db push
	```
4. أنشئ البيانات الأولية:
	```powershell
	npm run db:seed
	```
5. شغّل الخادم الخلفي:
	```powershell
	npm run dev:server
	```
6. شغّل الواجهة:
	```powershell
	npm run dev
	```

### بيانات تسجيل دخول الأدمن
`admin@example.com` كلمة المرور: `Admin123!`

### مشاكل شائعة
- خطأ DATABASE_URL: تأكد أن الصيغة تبدأ بـ `mysql://`.
- لا توجد جداول: نفّذ `npx prisma db push`.
- فشل الاتصال: تأكد أن الحاوية (Docker) تعمل: `docker ps`.

## Development Notes
The React app uses Vite + Tailwind + SCSS partials. Server is ESM ("type": "module").

## License
Internal demo (no explicit license set yet).

## Auth

JWT with Access + Refresh tokens is implemented in the API.

- POST /api/auth/register — create user. Responds with accessToken + refreshToken.
- POST /api/auth/login — login with email/password. Responds with accessToken + refreshToken.
- POST /api/auth/refresh — exchange refreshToken for new accessToken (rotates refresh).
- POST /api/auth/logout — revoke a refreshToken.
- POST /api/auth/forgot — send password reset link to email.
- POST /api/auth/reset — reset using `{ email, token, newPassword }`.
- POST /api/auth/verify-email/request — send verification email to current user.
- GET /api/auth/verify-email?token=...&email=... — verify email.
- POST /api/auth/verify-phone/request — send 6-digit code via SMS to current user.
- POST /api/auth/verify-phone/confirm — confirm code.

Roles: `user` (عميل), `seller` (بائع), `admin` (مدير). Use `requireRole('seller')` and `requireAdmin` middleware to protect routes.

### Email/SMS Providers
- Email (SendGrid): set `SENDGRID_API_KEY` and `SENDGRID_FROM` (or `EMAIL_FROM`) to enable real emails. If not set, emails are simulated and printed to the server logs.
- SMS (Twilio): set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM` (your Twilio phone number) to enable real SMS sends. If not set, SMS sends are simulated and logged.

## Server Middleware
- Security: `helmet`
- CORS: allowlist via `CORS_ORIGIN` (comma-separated) in production; permissive in dev
- Compression: `compression` is enabled by default
- Logging: `morgan` (format configurable via `MORGAN_FORMAT`)
- Trust proxy: set `TRUST_PROXY=true` when behind Nginx/Load Balancer
>>>>>>> 36234f7 (chore: initialize repo, add i18n setup, localization fixes, .gitignore, and uploads structure)

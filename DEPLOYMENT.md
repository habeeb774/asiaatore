# Deployment Guide

This guide helps you launch the store to production safely.

## Prerequisites
- Node.js 18+
- MySQL compatible DB (or Postgres if you've migrated; update `DATABASE_URL`)
- Reverse proxy (Nginx/Traefik) with HTTPS certificates
- Domain(s) for site and API

## 1) Environment variables
Copy `.env.production.example` to `.env` on the server and fill it:
- AUTH_SECRET=your_long_random_secret
- APP_BASE_URL=https://yourdomain.com

## 2) Install and build
On the server:
1. `npm ci`
2. `npx prisma migrate deploy`
3. Optional: `node server/db/seed.js` for initial content
4. Build client: `npm run build`

## 3) Start the server
With PM2:
- `pm2 start ecosystem.config.js` then `pm2 save`

Or directly:
- `NODE_ENV=production node server/index.js`

## 4) Proxy and HTTPS
Configure Nginx/Traefik to:
- Terminate TLS
- Proxy /api to the Node app (PORT from .env)
- Serve /uploads from the Node app
- Serve the SPA (if not served by Node) from the `dist/` directory or a CDN

## 5) Vite client configuration
If the SPA is hosted on a separate domain from the API:
- Set `VITE_API_URL` to the API origin before building
- Rebuild the client if `VITE_*` values change

## 6) Security hardening checklist
- CORS allowlist set via `CORS_ORIGIN`
- `ALLOW_DEV_HEADERS=false` in production
- Disable the env template endpoint (`ALLOW_ENV_TEMPLATE=false`)
- Helmet enabled (already wired)
- Rate limiting configured for auth/payment
- Strong `JWT_SECRET`

## 7) Payments (PayPal)
- Switch to live credentials and webhook ID
- Update return/cancel URLs to your domain
- Verify webhook reception in production

## 8) Monitoring and logs
- Use PM2 logs: `pm2 logs my-store-server`
- Add a log shipper (optional)

## 9) Backups
- Schedule regular DB backups
- Back up uploaded files in `/uploads` or move to object storage (S3) for durability

## 10) Smoke test
- Visit the site, login/logout
- Place a test order (with PayPal live in low-value mode)
- Check admin analytics and customers pages

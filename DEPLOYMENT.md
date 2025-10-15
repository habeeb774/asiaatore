# Deployment Guide

This guide helps you launch the store to production safely.

## Prerequisites
- Node.js 18+
- MySQL compatible DB (or Postgres if you've migrated; update `DATABASE_URL`)
- Reverse proxy (Nginx/Traefik) with HTTPS certificates
- Domain(s) for site and API

## 1) Environment variables
Copy `.env.example` to `.env` on the server and fill it:
- APP_BASE_URL=https://asiaatore-production.up.railway.app
- DATABASE_URL="mysql://root:VwYplbuZmtiXYZIkVbgvxBXaCuPDCKrP@crossover.proxy.rlwy.net:14084/railway"
- CORS_ORIGIN=https://manafadasiacompany.store,https://manafadasiacompany.store
- TRUST_PROXY=true (behind Nginx)
- FORCE_HTTPS=true (optional, if Nginx forwards X-Forwarded-Proto)

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
Use Nginx as reverse proxy with HTTPS via Let’s Encrypt (Certbot). Example server block:

```
server {
	listen 80;
	server_name yourdomain.com www.yourdomain.com;
	location /.well-known/acme-challenge/ { root /var/www/certbot; }
	location / { return 301 https://$host$request_uri; }
}

server {
	listen 443 ssl http2;
	server_name yourdomain.com www.yourdomain.com;

	ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
	ssl_protocols TLSv1.2 TLSv1.3;
	ssl_ciphers HIGH:!aNULL:!MD5;

	# Health check
	location /api/health { proxy_pass http://127.0.0.1:4000/api/health; proxy_set_header Host $host; }

	# API
	location /api {
		proxy_pass http://127.0.0.1:4000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Host $host;
	}

	# Static SPA (if served by Nginx)
	location / {
		root /var/www/my-store/dist;
		try_files $uri /index.html;
	}
}
```

Then obtain/renew certs with Certbot.

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
 - Behind Nginx, set `TRUST_PROXY=true` and optionally `FORCE_HTTPS=true`
 - Monitor `/api/health` in uptime checks

## 7) Payments (PayPal)
- Switch to live credentials and webhook ID
- Update return/cancel URLs to your domain
- Verify webhook reception in production

## 8) Monitoring and logs
- The server uses pino for structured logs. Control verbosity with `LOG_LEVEL` and enable pretty output locally with `PINO_PRETTY=true`.
- Use PM2 logs: `pm2 logs my-store-server`
- Add a log shipper (optional)

## 9) Backups
- Schedule regular DB backups
- Back up uploaded files in `/uploads` or move to object storage (S3) for durability

## 10) Smoke test
- Visit the site, login/logout
- Place a test order (with PayPal live in low-value mode)
- Check admin analytics and customers pages

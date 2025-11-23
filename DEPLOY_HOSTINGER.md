# Hostinger Deployment Guide

This document summarizes the steps to redeploy the project on a Hostinger Linux VPS.

## 1. Prerequisites
- Ubuntu/Debian based server
- Git installed (`sudo apt-get install -y git`)
- MySQL server running locally
- Existing database user & schema (`appuser` + `my_store_db`)
- Node.js v20 or later

## 2. Clone / Update Repository
```bash
cd /opt
# First time:
sudo rm -rf my_store
git clone https://github.com/habeeb774/asiaatore.git my_store
cd my_store
git checkout rescue/2025-11-03-recover-work
# Subsequent updates:
cd /opt/my_store
git fetch --all
git checkout rescue/2025-11-03-recover-work
git pull --rebase
```

## 3. Environment File (.env)
Create or edit `/opt/my_store/.env`:
```bash
cat > .env <<'EOF'
DATABASE_URL="mysql://appuser:AppPass_2025!@localhost:3306/my_store_db"
AUTH_SECRET="<64_hex_random>"
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"
SERVE_CLIENT=true
ALLOW_DEV_HEADERS=false
EOF
export $(grep -v '^#' .env | xargs)
```
Generate secrets:
```bash
openssl rand -hex 64 | head -c 64  # AUTH_SECRET
openssl rand -hex 16                # part of ENCRYPTION_KEY (needs 32 chars)
```

## 4. Node.js Upgrade (if <20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

## 5. Install Dependencies & Prisma
```bash
npm install
# Migrations or schema push
if [ -d prisma/migrations ] && [ "$(ls -A prisma/migrations | wc -l)" -gt 0 ]; then
  npx prisma migrate deploy || npx prisma db push
else
  npx prisma db push
fi
npx prisma generate
```

## 6. Build Frontend (if serving from backend)
```bash
npm run build -w client
```

## 7. Start Backend (PM2)
Install PM2 if needed:
```bash
npm install -g pm2
```
Start or restart:
```bash
pm2 start server/index.js --name my-store --time
pm2 save
pm2 status
```

## 8. Health Checks
```bash
curl -f http://localhost:8829/_health
curl -f http://localhost:8829/_db_ping
```

## 9. Frontend Local Dev Against Remote Backend
Edit `client/.env.development`:
```
VITE_BACKEND_HOST=http://YOUR_SERVER_IP:8829
```
Then:
```bash
npm run dev -w client
```

## 10. Optional Nginx Reverse Proxy
Basic server block:
```
server {
  server_name manfadasia.com www.manfadasia.com;
  location /api/ {
    proxy_pass http://127.0.0.1:8829/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
  location / {
    root /opt/my_store/client/dist;
    try_files $uri /index.html;
  }
}
```
Test and reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 11. Automated Script
You can run:
```bash
bash scripts/deploy-hostinger.sh
```
This performs checkout, Node upgrade, install, migrations, build, PM2 start, and health checks.

## 12. Troubleshooting
- Access denied (MySQL): Verify user/password and plugin (`mysql_native_password`).
- Node engine warnings: Upgrade Node to 20+.
- Health endpoint fails: Inspect logs `pm2 logs my-store`.
- Proxy issues: Confirm `VITE_BACKEND_HOST` in development or remove explicit host for production builds.

## 13. Security Notes
- Do not commit real secrets to Git.
- Rotate `AUTH_SECRET` and `ENCRYPTION_KEY` when moving to production.
- Use firewall (UFW) to allow only HTTP/HTTPS and block unused ports.

## 14. Next Steps
- Seed database if needed (`npm run db:seed` when script exists).
- Configure SSL (Let's Encrypt + Nginx).
- Set up automatic backups (MySQL dump daily).

---
Updated for dynamic proxy config and deployment script.

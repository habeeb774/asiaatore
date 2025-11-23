#!/usr/bin/env bash
# Hostinger deployment helper script
# Usage: bash scripts/deploy-hostinger.sh [branch]
# Default branch: rescue/2025-11-03-recover-work
set -euo pipefail
BRANCH="${1:-rescue/2025-11-03-recover-work}"

echo "[deploy] Branch: $BRANCH"

if [ ! -d .git ]; then
  echo "[deploy] ERROR: Must run inside cloned repo." >&2
  exit 1
fi

echo "[deploy] Fetching & checking out branch";
git fetch --all --quiet || true
git checkout "$BRANCH"
git pull --rebase

# Ensure Node 20+
REQUIRED_MAJOR=20
NODE_MAJOR=$(node -v | sed -E 's/v([0-9]+).*/\1/') || NODE_MAJOR=0
if [ "$NODE_MAJOR" -lt "$REQUIRED_MAJOR" ]; then
  echo "[deploy] Upgrading Node to 20.x via NodeSource";
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

# Install dependencies (full, allow dev for build phase)
echo "[deploy] Installing dependencies";
npm install

# Prisma migrations / schema push
if [ -d prisma/migrations ] && [ "$(ls -A prisma/migrations | wc -l)" -gt 0 ]; then
  echo "[deploy] Applying migrations";
  npx prisma migrate deploy || (echo "[deploy] migrate deploy failed, attempting db push"; npx prisma db push)
else
  echo "[deploy] No migrations folder or empty; performing db push";
  npx prisma db push
fi
npx prisma generate

# Build client assets if serving from backend
if grep -q 'SERVE_CLIENT=true' .env 2>/dev/null; then
  echo "[deploy] Building client assets";
  npm run build -w client
else
  echo "[deploy] Skipping client build (SERVE_CLIENT not true)";
fi

# Start/Restart PM2 process
if command -v pm2 >/dev/null 2>&1; then
  echo "[deploy] Restarting PM2 process";
  if pm2 describe my-store >/dev/null 2>&1; then
    pm2 restart my-store
  else
    pm2 start server/index.js --name my-store --time
  fi
  pm2 save
else
  echo "[deploy] Installing PM2 globally";
  npm install -g pm2
  pm2 start server/index.js --name my-store --time
  pm2 save
fi

# Health checks
PORT=${PORT:-8829}
set +e
curl -fsS http://localhost:${PORT}/_health && echo "\n[deploy] Health OK" || echo "[deploy] Health endpoint failed";
curl -fsS http://localhost:${PORT}/_db_ping && echo "\n[deploy] DB ping OK" || echo "[deploy] DB ping failed";
set -e

echo "[deploy] Done."
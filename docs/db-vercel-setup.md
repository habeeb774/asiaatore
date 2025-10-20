# Deprecated: Vercel/PlanetScale setup

This document described running the frontend on Vercel with a PlanetScale database. The project now targets Railway for the API and standard Node hosting with Nginx for the SPA. Vercel-specific steps are no longer maintained. Kept here for historical reference.

## 1) Create the database in Vercel

- In your Vercel project: Storage → Create Database
- Choose MySQL (PlanetScale)
- Attach to this Vercel project/environment (Production and/or Preview/Development)
- After creation, click “View Connection Details” and copy the Prisma/MySQL connection string
  - Typical format:
    - mysql://USER:PASS@HOST/DATABASE?sslaccept=strict

PlanetScale tip: It doesn’t enforce foreign keys. Prisma works with it using relationMode="prisma" (see notes below).

## 2) Configure environment variables

Set DATABASE_URL for the API (hosted on Railway in this stack):

- Option A (recommended): In Railway service → Variables, set DATABASE_URL to the PlanetScale URL.
- Option B (local dev): Put DATABASE_URL in your local `.env` to test.

If using PlanetScale, also set:
- PRISMA_RELATION_MODE=prisma (set this in your shell before Prisma commands)

## 3) Apply Prisma schema to the new DB

On Windows PowerShell, temporarily point to the new DB and push the schema:

```powershell
# Paste your PlanetScale DATABASE_URL here
$env:DATABASE_URL = "mysql://USERNAME:PASSWORD@HOST/DATABASE?sslaccept=strict"
# Recommended for PlanetScale
$env:PRISMA_RELATION_MODE = "prisma"

npm run db:generate
# For new/empty DBs in dev/staging
npm run db:push
# Optional: seed data if supported
npm run db:seed
```

For production migrations, prefer:

```powershell
npx prisma migrate deploy
```

## 4) Point the API to PlanetScale

- If backend stays on Railway: set DATABASE_URL there (PlanetScale URL), then redeploy/restart the service.
- For local API runs: ensure `.env` has the new DATABASE_URL; start with `npm run dev:server`.

In development, the Vite dev server proxies `/api/*` to your Railway API using `VITE_PROXY_TARGET`. In production, terminate TLS at Nginx and proxy `/api` to the Node server.

## 5) Verify

- Open `/_health` and `/_db_ping` on the API base.
- Hit `/api/products`, `/api/orders`, etc. from the SPA; no CORS expected in dev (client forces `/api`).

## Notes

- PlanetScale + Prisma
  - PlanetScale doesn’t enforce FKs; set `PRISMA_RELATION_MODE=prisma` when running Prisma commands.
  - You can also hardcode `relationMode = "prisma"` in `prisma/schema.prisma` if you want PlanetScale-only.
- Staying on Railway MySQL
  - You can keep the existing DATABASE_URL (as in `.env`), and everything continues to work.
- Secrets
  - Don’t commit DATABASE_URL. Keep it in Railway envs or local `.env` only.

If you want, I can switch the project to PlanetScale mode (update Prisma config, push schema, and adjust envs) automatically—just say the word.

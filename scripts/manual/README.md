# Manual API Utilities

Miscellaneous one-off scripts that are occasionally helpful during local debugging. None of these run as part of CI; they are ad-hoc tools you can invoke manually.

## Scripts

- `create-admin.js` – attempts common admin credentials and registers a fallback user.
- `create-admin-db.js` – seeds an admin user directly via Prisma if one does not exist.
- `debug-auth.js` – logs in and exercises a few authenticated endpoints.
- `test-admin-api.js` – quick smoke test for admin review endpoints.
- `test-auth.cjs` – low-level HTTP login test for environments without fetch.
- `update-admin.js` – resets the first admin user's password and validates access.

All scripts respect the `API_BASE` environment variable (default `http://localhost:8829`). Database scripts also load `.env` automatically via `dotenv`.

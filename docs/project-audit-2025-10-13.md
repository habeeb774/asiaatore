# Project Audit – My Store (2025-10-13)

## Executive Summary
- **Scope**: Full-stack e-commerce application consisting of a React (Vite) SPA frontend and an Express/Prisma backend targeting MySQL.
- **Health**: Codebase is feature-rich and follows modern practices (React 19, Prisma, Tailwind 4). Key gaps are in environment hygiene, database lifecycle management, observability, automated testing, and CI/CD.
- **Immediate priorities**: Stabilize local environment, harden authentication flows, and introduce automated smoke tests plus lint/type safety gates.

## Architecture Overview
- **Frontend**: React 19 SPA bootstrapped with Vite. Styling uses Tailwind CSS 4, MUI, and custom RTL support. State is coordinated via Zustand and TanStack React Query. PWA support enabled through `vite-plugin-pwa`.
- **Backend**: Express server (Node ESM) with Prisma ORM (MySQL). Routes organized by concern (`server/routes/*.js`). Delivery subsystem supports degraded mode. GraphQL server exposed via Apollo at `/api/graphql`.
- **Data Layer**: Prisma schema models comprehensive commerce entities (Products, Orders, Sellers, Delivery, Marketing, Audit, Chat). Seeds provide demo data and admin/seller accounts.
- **Infrastructure**: Environment configured through `.env`. Local MySQL via Docker Compose. No CI/CD pipeline defined. Logging provided by Pino, with SSE events for real-time updates.

## Findings
### Environment & Configuration
- `.env` had duplicated keys (`PAYPAL_API`) and outdated proxy targets, leading to inconsistent behavior. ✅ **Resolved** by normalizing the file.
- Backend automatically increments port when occupied, but associated frontend proxy required manual updates leading to 503s. **Recommendation**: automate discovery via service registry or document restart procedure explicitly.
- Prisma migrations hit "tablespace exists" if database not reset. Need repeatable database lifecycle scripts (drop/recreate, migration plans).

### Backend
- Robust route coverage but limited defensive checks when DB is unavailable; recent delivery/wishlist fallbacks mitigate user-facing crashes.
- Error responses are verbose in dev; production paths rely on env flags. Missing rate limiting on some admin endpoints.
- No centralized validation layer (e.g., Zod) on request payloads; manual checks exist but coverage varies.

### Frontend
- API client auto-falls back to Vite proxy and injects dev headers; useful but risks accidental elevation if left enabled outside dev.
- Authentication flows rely on local storage token plus cookie refresh; lack of refresh token rotation tests.
- Component library mix (MUI + Tailwind) increases bundle size; consider rationalizing UI systems.

### Data & Prisma
- Schema is extensive; indexes present for hot queries. No soft-delete enforcement utilities (developers must remember to filter `deletedAt` manually).
- Seeds provide deterministic demo data — good for onboarding.

### Security & Compliance
- Dev helpers (`ALLOW_INVALID_DB`, `ALLOW_DEV_HEADERS`, etc.) are powerful but risky if enabled in production; documentation should emphasize disabling.
- Password hashing via bcrypt is standard, but password reset tokens stored as SHA256 of random strings; ensure token invalidation flows are tested.
- No CSRF protection for cookie-authenticated routes.

### Observability & QA
- Pino logging is configured, but no log shipping or metrics integration.
- No automated tests (unit/integration) in repo; scripts exist for API smoke tests but are manual.
- No CI configuration (GitHub Actions, etc.) to enforce lint/build/test on pull requests.

### Developer Experience
- Scripts for data seeding, admin creation, and product imports are available. Running backend + frontend requires coordination (ports, env flags); documentation could better highlight pitfalls (port drift, dev logins).
- TypeScript is partially configured (JS project with type checking disabled); future TS adoption would improve safety.

## Actions Taken in This Audit
1. **Fixed `.env` duplication**: removed repeated `PAYPAL_API` declaration and ensured proxy points to the active backend port.
2. **Created this audit report** to capture architecture, findings, and recommendations for ongoing improvements.

## Recommended Next Steps
### High Priority (1-2 sprints)
- **Environment Guardrails**: Provide `.env.example` with clear dev/prod guidance; add startup scripts to detect port conflicts and surface consistent instructions.
- **Database Lifecycle**: Add scripts for `db:reset` (drop + push + seed) to avoid tablespace errors. Document MySQL Docker workflow.
- **Authentication Hardening**: Disable dev headers by default, enforce CSRF mitigation (e.g., same-site cookie + anti-CSRF token), and audit refresh-token rotation paths.
- **Automated Smoke Tests**: Wire `npm run test:api` to CI to cover login, product list, order flow.

### Medium Priority (Quarterly)
- **Type Safety**: Gradually migrate critical modules to TypeScript or enable `checkJs` with JSDoc types.
- **Request Validation**: Introduce Zod schemas on backend routes (starting with auth/orders) for consistent input validation.
- **Monitoring**: Integrate basic metrics (e.g., Prometheus or health checks via external monitoring) and structured log shipping.
- **UI Consistency**: Audit Tailwind vs. MUI usage and define design system guidelines to reduce bundle bloat.

### Long Term
- **CI/CD Pipeline**: Implement GitHub Actions to run lint/build/test and optionally deploy.
- **Modularization**: Consider splitting frontend and backend into separate packages or monorepo workspaces for clearer ownership.
- **Performance**: Add caching (e.g., Redis) for expensive queries (catalog summary, marketing metrics) once load warrants.
- **Security Audits**: Periodically review dependencies for vulnerabilities (`npm audit`), ensure Prisma migrations are version-controlled, and add role-based access tests.

## References & Helpful Commands
```bash
# Start local stack
npm install
npm run db:up       # docker-compose MySQL
npm run db:push
npm run db:seed
npm run dev:server
npm run dev         # Vite (check console for actual port)

# Prisma maintenance
npm run db:generate
npm run db:push
npm run db:seed

# API smoke tests (manual)
npm run test:api
```

---
*Generated on 2025-10-13 by the project audit assistant.*

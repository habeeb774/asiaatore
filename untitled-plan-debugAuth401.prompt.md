Plan: Debug 401 Unauthorized for /api/cart, /api/wishlist, /api/auth/refresh (local dev)

Objective
- Find the root cause of recurring 401 Unauthorized errors when the client (Vite) attempts to call endpoints like `/api/wishlist`, `/api/cart`, and `/api/auth/refresh` on dev at :5173.
- Implement targeted fixes so the local dev flow is functional and developer-friendly (e.g., use dev headers, refresh flow, or correct token storage).

Context & Observations
- Client logs show multiple 401 responses  (e.g. `/api/wishlist`, `/api/cart`, `/api/auth/refresh`).
- Stripe.js also logs an environment warning about HTTP only for testing — not related to 401s, just a reminder.
- SettingsContext logs load fine (`logo` and `colorPrimary`) — so some endpoints work (public ones).
- The order of observed behavior suggests that authenticated endpoints fail because the client doesn't have or doesn't send valid auth tokens.

High-level approach
1) Reproduce the issue and capture failing requests with headers
2) Inspect front-end code for token storage and HTTP client logic
3) Inspect server code for refresh endpoint and auth middleware expectations
4) Validate dev-auth helpers (ALLOW_DEV_HEADERS) and the refresh mechanism
5) Implement fix and test
6) Add regression tests and optional dev-ux improvements

Detailed Steps (checked / debug flow)
1. Reproduce & capture
  - Start the API server (with DB or degraded mode) — the repo has convenient tasks: `npm run dev:server` or run with quick-start flags.
  - Start client (`npm run dev -w client`) to reproduce errors.
  - Use browser devtools Network tab and inspect failing requests for: Method, URL, Request Headers (Authorization, x-user-id, x-user-role, Cookie), Response body.
  - Save a HAR (or copy sample failing request) for server-side replay.

2. Check client auth logic
  - Search client `src/` for `auth`, `refresh`, `useAuth`, or `SettingsContext` references (`client/src/context`, `client/src/hooks`, `client/src/utils/api`).
  - Verify the app stores tokens (access & refresh) in cookie/localStorage/sessionStorage and where they are read.
  - Look for the axios/fetch wrapper (common wrapper to set Authorization header). Confirm that Authorization header exists for authenticated endpoints.
  - Check the `auth/refresh` flow on the client: does it attempt to request `/api/auth/refresh` on 401s? Does it pass the right cookie or header? Is the refresh cookie `HttpOnly`? Refresh endpoints often expect cookie, so the call should include credentials.

3. Inspect server `api/auth` and middleware
  - Inspect `server` files: `server/index.js`, `server/controllers/auth.js` (or `server/controllers/*`), `server/middleware/auth.js` for token parsing and refresh.
  - Confirm the `/api/auth/refresh` implementation: how does it read the refresh token (cookie or header)? If cookie-based, ensure client calls include `credentials: 'include'` or axios config to attach cookies.
  - Confirm the `requireAuth` middleware behavior: does it return 401 in all unauthorized cases or 403 sometimes? Look for the exact errors sent to the client and logs.

4. Dev Auth Helpers & Config
  - Use `ALLOW_DEV_HEADERS=true` + `npm run dev:server:admin` or `cross-env` to enable dev headers for local testing (should bypass token checks when used).
  - Confirm `ALLOW_DEV_HEADERS` works: repeat the call with headers: `x-user-id`/`x-user-role` and verify success.
  - If server expects `Authorization: Bearer <token>`, verify tokens are created and included.

5. Fix common root causes and implement changes
  - Missing credentials: If refresh fails because the client doesn’t include cookies, update fetch/axios wrapper to set `withCredentials: true` and add in `vite` proxy config if cross-origin cookies are blocked (set `Vite` to use `proxy.cookie` or configure `dev` server proxy; ensure CORS includes credentials and `Access-Control-Allow-Credentials: true`).
  - Refresh flow: If the client requests refresh but the server tries to set cookies, ensure `SameSite` attributes and Docker/local host do not block cookie setting. For dev, `SameSite=None; Secure` requires HTTPS; fallback to local settings or change to an `Allow insecure` or cookie-less header flow for dev.
  - Token persistence: If client stores tokens incorrectly (e.g., localStorage only), ensure they are read properly. Consider using `allow dev headers` or `x-user-id` headers while testing.
  - Client token attach bug: Add `console.debug` logs in the axios interceptor to show whether Authorization header is present for failing requests.

6. Testing & Validation
  - Add an integration test with Playwright or a unit test simulating requests to `auth/refresh` and `/api/cart` with/without auth.
  - Use curl/HTTP client to test endpoints both with and without cookies/headers:
    - Example:
      curl -i -v -X GET "http://localhost:8829/api/cart" -H "Authorization: Bearer $TOKEN"
      curl -i -v -X POST "http://localhost:8829/api/auth/refresh" -b "refresh_token=..." --include

7. Edge cases & tooling
  - Check for `QUICK_START_DB` or `ALLOW_INVALID_DB` and run degraded server to see if behavior differs.
  - Confirm SSR paths or client code that calls endpoints early in boot (before auth is loaded) cause 401s. Detect and gate early calls (retry after auth loaded).
  - Update UI code to show a helpful message on `401` (not silently failing): e.g., show “please login” or trigger a login modal automatically.

8. Additional follow-ups (post-fix)
  - Add improved logging on server to show incoming headers on failed auth requests for faster debugging next time.
  - Add a small developer checklist to `DEVELOPER_GUIDE.md` for local auth testing and the dev environment flags.
  - Create a minimal reproducible test case and add to automated tests to prevent regressions.

Deliverable checklist
- Repro steps & HAR file
- Findings summary (what was wrong and why)
- Fixes (client/server changes, if more than one commit please separate):
  - Client set `withCredentials: true` and retry/refresh logic updated
  - Server accepts dev headers or precise cookie rules
  - Unit/integration tests added
- Post-mortem & PR with explanation and test instructions

Quick commands (local dev & debug)
```powershell
# Backend degraded for quick debug (no DB needed)
$env:PORT=8829; $env:QUICK_START_DB=1; $env:ALLOW_INVALID_DB='true'; node server/index.js
# Backend dev with dev headers
cross-env PORT=8829 ALLOW_DEV_HEADERS=true node server/index.js
# Client
npm run dev -w client
```

Notes
- On Windows, `SameSite=None` cookies still require HTTPS in many browsers; this can cause refresh cookies not to be set or sent. Use `ALLOW_DEV_HEADERS` or a non-cookie refresh flow for ease in development.
- The page logs you pasted show `Products.jsx` debug info unrelated to auth; main failures are 401s from `/api/cart`, `/api/wishlist`, `/api/auth/refresh`.

Next steps
- Please confirm whether you want this plan saved under a specific name or if `debugAuth401` is fine as the `camelCaseName` to build from.
- I can now proceed to follow the plan and start investigating (run servers, reproduce, and resolve) if you want me to implement changes directly.
# Development helpers for the client

This file documents a couple of small developer conveniences used when running the app locally.

## Dev headers (server)

The API server (in `server/`) can allow fake auth headers for local development. To enable this behaviour start the server with the environment variable:

- `ALLOW_DEV_HEADERS=true`

When enabled, the server will accept `x-user-id` and `x-user-role` headers as a development authentication mechanism. This is useful for local testing without performing the full auth flow.

Example in PowerShell (project root):

```powershell
$env:PORT=8842; $env:ALLOW_DEV_HEADERS='true'; node server/index.js
```

There are VS Code tasks in the workspace that start the server with this flag; you can use them from the Run/Tasks UI.

## Simulate a logged-in dev user (client)

When running the client in development mode (Vite), the client API wrapper will send `x-user-id` and `x-user-role` if no real token is present and `import.meta.env.DEV` is true.

To set a fake dev user in the browser console, run:

```js
localStorage.setItem('my_store_user', JSON.stringify({ id: 'dev-admin', role: 'admin' }));
```

Then refresh the page. The client will include those dev headers and the server (when `ALLOW_DEV_HEADERS=true`) will accept them.

If you have a real token you can store it directly in localStorage:

```js
localStorage.setItem('my_store_token', '<your-token-here>');
```

## Local image fallbacks

To avoid failures when external placeholder services are unreachable (DNS blocked, offline), the app uses a local fallback image at `/images/product-fallback.svg` whenever an external image fails to load.

The `SafeImage` component (src/components/common/SafeImage.jsx) implements this behaviour.

## Notes

- Do not enable `ALLOW_DEV_HEADERS` in production. It's strictly for local development and testing.
- The fake user stored in localStorage is only read in DEV mode by the client API helper; it does not replace real authentication for deployed environments.

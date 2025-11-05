# my-store-client-theme

This theme wraps the existing React/Vite `client` app build into a Salla Twilight theme.

How it works

- Build the client app (creates `client/dist`).
- The `prepare-theme` script copies `client/dist` into the theme `public/` folder.
- The Salla CLI preview can then serve the theme static assets from `public/`.

Usage

1. Install dependencies (pnpm recommended):

   pnpm install

2. Build the client and prepare the theme:

   pnpm run build-client
   pnpm run prepare-theme

3. Start preview (link-only recommended):

   salla theme preview -ol --with-editor

Notes & next steps

- This is a minimal wrapper. For tighter integration (theme components, Twig templates, live HMR), we can:
  - Convert client pages into Twig templates under `src/views/pages/`.
  - Add a proper `webpack` pipeline to build assets inside the theme.
  - Map theme `components` in `twilight.json` so the Salla editor shows elements.

If you want me to complete any of the above (convert routes to Twig, wire components into `twilight.json`, or add a webpack build), tell me which level of integration you want and I'll implement it.

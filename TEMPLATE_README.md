## Template packaging & customization

This document explains how to prepare the `my-store` theme template for distribution.

1. Prepare demo data
   - Use `npm run db:seed` in development to seed demo products and settings.

2. Build frontend assets
   - `npm run build -w client`
   - Ensure `client/dist` contains the built site assets.

3. Convert critical images to WebP/AVIF
   - `npm --prefix client run images:webp` (supports `--quality=80` flag)

4. Package the theme
   - Use the helper script `scripts/package-theme.js` which produces a ZIP of `themes/my-store-template` along with `README` and `seed` instructions.

5. Notes for buyers
   - Provide a `.env.example` with `DATABASE_URL`, `VITE_GA_ID`, and deploy docs.
   - Include a short video/gif showing RTL support and the admin theme editor.

For automation, use `node scripts/package-theme.js --src themes/my-store-template --out releases/my-store-template.zip`.

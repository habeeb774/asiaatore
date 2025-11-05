# Template customization quick guide

This document shows the minimal, common steps to customize a storefront theme in this repository.

1) Logo
  - Replace the store logo file used by the theme. Common locations:
    - `themes/<template>/assets/logo.png` or `themes/<template>/assets/logo.svg`
    - The client may load logos from `uploads/brand-logos/` for runtime settings.
  - After replacing the file, rebuild or restart the theme preview (eg. `pnpm run watch` or `npm run dev`).

2) Colors / Brand palettes
  - Many themes use Tailwind variables or CSS custom properties.
  - For the client app, update `tailwind.config.js` and the theme's CSS variables (look for `:root` or `--brand-` variables inside the theme CSS).
  - Rebuild assets (local dev often picks up CSS changes automatically with Vite).

3) Hero text and settings
  - The hero content is typically in `client/src/components/home/*` or the theme's `content` folder.
  - For site-wide configurable hero values (image, title, subtitle), check the admin/settings area or `server/config`.
  - To change the hero for a single template copy, edit the hero files in `themes/<template>/` or update settings in the admin UI.

4) Shipping settings
  - Shipping rules and providers are configured in the server routes and settings.
  - See `server/routes/shipping` (or `server/utils/shipping.js`) for integration points.
  - For demo purposes, shipping info pages are in `client/src/pages/delivery` and can be updated per-template by editing content files in `themes/<template>/content`.

5) Payment methods
  - Payment connectors live in `server/` (eg. `server/paypal.js`, `server/stc.js`, `server/bank.js`).
  - To enable/disable payment methods in a clone, update server config or environment variables and restart the API.

6) RTL support
  - Full RTL requires mirroring layout and verifying components that assume LTR direction.
  - For the Pro RTL-ready templates we include a `rtl/` stylesheet and sample overrides under `themes/pro-version/rtl/`.

7) Theme-specific README
  - Each template in `themes/` should include a README with theme-specific preview commands and customization hints—follow that README after cloning.

If you'd like, I can generate a checklist or interactive script to automate these steps for a chosen template.

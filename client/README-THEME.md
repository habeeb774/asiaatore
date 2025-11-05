Theme & UI Primitives

This document explains the unified design tokens and primitives introduced to the client.

Files added/changed
- `src/styles/_design-system.scss` — central CSS custom properties (tokens). Already present; use these variables in SCSS.
- `src/styles/_ui.scss` — component-level CSS variables and UI classes (`.ui-btn`, `.ui-card`, `.ui-input`, etc.).
- `src/components/ui/Button.jsx` — React Button primitive (maps to `.ui-btn` classes).
- `src/components/ui/Card.jsx` — Card primitive (maps to `.ui-card`).
- `src/components/ui/Input.jsx` — Input wrapper (maps to `.ui-input`).

How to use
- Buttons: import `{ Button }` from `src/components/ui/Button.jsx` and use:

  <Button variant="primary" size="md">Add to cart</Button>

  Supported variants: `primary`, `secondary`, `accent`, `outline`, `ghost`, `danger`, `success`.
  Supported sizes: `sm`, `md`, `lg`, `icon`.

- Card: import `Card` and wrap content:

  <Card variant="outline">...</Card>

- Input: import `Input` and provide props like `placeholder`, `name`, `value`:

  <Input name="email" placeholder="البريد الإلكتروني" />

Theme toggling
- The app uses `ThemeProvider` (already wired in `main.jsx`) which sets `data-theme` and `theme-` classes on `<html>`.
- Use `useTheme()` hook (`src/context/ThemeContext.jsx`) to toggle `light`/`dark`/`system`.

Migration notes
- Prefer the `Button` component instead of raw `<button className="btn-*">` or inline style buttons.
- Prefer `Input` wrapper or the `.ui-input` class for form elements.
- Prefer `Card` primitive for panels and cards.
- When editing SCSS, read tokens from `:root` variables in `_design-system.scss` instead of hardcoding colors or font-sizes.

Next steps
- Replace raw `<button>` elements and legacy `btn-*` classes incrementally across pages with `Button`.
- Migrate commonly used form controls to `Input`.
- Sweep components and pages to remove duplicate CSS and inline color values.

If you want, I can now start performing automated replacements on high-impact files (Navbar, ProductCard, Cart, Checkout) and run a `npm run build` in `client` to validate.

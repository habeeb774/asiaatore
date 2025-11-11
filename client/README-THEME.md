Theme & UI Primitives


# Theme & Design Tokens System

This document explains the unified design tokens and primitives introduced to the client, including the new runtime and CSS variable system.


## Files added/changed
- `src/styles/design-tokens.css` — **NEW**: CSS custom properties for all design tokens (colors, spacing, typography, motion, etc). Imported globally in `main.jsx`.
- `tailwind.config.js` — **UPDATED**: Tailwind color palette now references design token CSS variables (e.g. `var(--brand-primary)`).
- `src/styles/_design-system.scss` — central CSS custom properties (tokens). Already present; use these variables in SCSS.
- `src/styles/_ui.scss` — component-level CSS variables and UI classes (`.ui-btn`, `.ui-card`, `.ui-input`, etc.).
- `src/components/ui/Button.jsx` — React Button primitive (maps to `.ui-btn` classes).
- `src/components/ui/Card.jsx` — Card primitive (maps to `.ui-card`).
- `src/components/ui/Input.jsx` — Input wrapper (maps to `.ui-input`).


## How to use

- **Design tokens in CSS/JS**: Use CSS variables from `design-tokens.css` (e.g. `var(--brand-primary)`) in your styles, or reference them in Tailwind via the color keys (see `tailwind.config.js`).

- **Buttons**: import `{ Button }` from `src/components/ui/Button.jsx` and use:

  <Button variant="primary" size="md">Add to cart</Button>

  Supported variants: `primary`, `secondary`, `accent`, `outline`, `ghost`, `danger`, `success`.
  Supported sizes: `sm`, `md`, `lg`, `icon`.

- Card: import `Card` and wrap content:

  <Card variant="outline">...</Card>

- Input: import `Input` and provide props like `placeholder`, `name`, `value`:

  <Input name="email" placeholder="البريد الإلكتروني" />


## Theme toggling
- The app uses `ThemeProvider` (already wired in `main.jsx`) which sets `data-theme` and `theme-` classes on `<html>`.
- Use `useTheme()` hook (`src/context/ThemeContext.jsx`) to toggle `light`/`dark`/`system`.


## Runtime design tokens
- The new `DesignTokenProvider` (`src/context/DesignTokenContext.jsx`) exposes `useDesignTokens()` which returns `{ tokens, setTokens }`.
- Tokens map to CSS variables defined in `design-tokens.css`. Example keys:
  - `brand.primary` → `--brand-primary`
  - `brand.primaryAlt` → `--brand-primary-alt`
  - `brand.accent` → `--brand-accent`
  - `brand.gradient.primary` → `--brand-gradient-primary`
- To override tokens from a component or integration:

  ```jsx

  import { useDesignTokens } from '../context/DesignTokenContext';

  const Demo = () => {
    const { setTokens } = useDesignTokens();

    useEffect(() => {
      setTokens({ 'brand.primary': '#2563eb', 'brand.gradient.primary': 'linear-gradient(90deg,#2563eb,#1d4ed8)' });
    }, [setTokens]);

    return <div className="ui-card">Updated branding</div>;
  };

  ```

- `SettingsContext` updates these tokens automatically when `colorPrimary`, `colorSecondary`, or `colorAccent` are changed in the admin panel.


## Migration notes
- Prefer the `Button` component instead of raw `<button className="btn-*">` or inline style buttons.
- Prefer `Input` wrapper or the `.ui-input` class for form elements.
- Prefer `Card` primitive for panels and cards.
- When editing SCSS, read tokens from `:root` variables in `design-tokens.css` (or `_design-system.scss` for legacy) instead of hardcoding colors or font-sizes.


## Next steps
- Replace raw `<button>` elements and legacy `btn-*` classes incrementally across pages with `Button`.
- Migrate commonly used form controls to `Input`.
- Sweep components and pages to remove duplicate CSS and inline color values.
- Use the new design tokens in all new CSS and JS code for consistent theming.

If you want, I can now start performing automated replacements on high-impact files (Navbar, ProductCard, Cart, Checkout) and run a `npm run build` in `client` to validate.

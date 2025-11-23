# Styles directory guide

The stylesheet layer is split into a few tiers so we can reason about overrides without duplicating entire files:

| Folder | Purpose |
| --- | --- |
| `core/` | Low-level variables, mixins, and resets that every bundle consumes. |
| `components/`, `home/`, `modules/` | Feature-specific partials that map to React routes/sections. |
| `legacy/` | Centralised declarations for legacy layouts (hero sliders, Swiper product cards, etc.) so duplicated selectors live in one place. |
| standalone `.scss` | Route-focused bundles that are code-split (for example `HomePage.scss`). |

## Import order

`src/styles/index.scss` is the single entry that Vite pulls in from `main.jsx`. Keep new partials wired up there so they compile once and so other bundles can assume the utilities exist globally.

## Shared tokens & mixins

- `../theme/_tokens.scss` is the single source of CSS custom properties (layout spacing, surfaces, motion tokens, and the legacy `--brand-*` aliases). `_design-system.scss` simply forwards those tokens and includes header styles so existing imports keep working.
- `_variables.scss` re-exposes those tokens to SCSS (e.g. `$brand-primary`, `$shadow-card`).
- `_mixins.scss` ships reusable helpers:
	- `card-surface` – consistent background/border/shadow wrapper for cards.
	- `soft-shadow(level)` – quick shadow presets (`sm|md|lg`).
	- `focus-ring` – accessible outline tied to `--color-ring`.
	- `interactive-pill` – gradient badge/CTA styling with hover motion baked in.
	- `responsive-grid` and `glass-panel` – layout helpers for legacy hero blocks.

Please lean on these helpers before adding new bespoke declarations; it keeps the legacy layouts aligned with the modern system.

## Working with legacy files

Older hero/theme files (for example: `Hero.scss`, `HeroUnified.css`) used to copy/paste entire product card implementations. The former monolithic `reda-store-theme.css` has been migrated into component partials and removed. Those shared selectors now live under `legacy/`. When updating those components:

1. **Check the legacy partials first.** If the selector already exists there, extend it or tweak the shared version instead of duplicating styles.
2. **Prefer design-system tokens.** The partials are written against variables defined in `_design-system.scss`, so color/spacing stays consistent with the rest of the app.
3. **Document additions.** If you add a new legacy partial, drop a short note in `legacy/README.md` for the next person.

This structure keeps the CSS tree predictable while still letting us ship highly-opinionated hero layouts when needed.

# Styles Directory Guide

> **Last Cleanup:** Nov 2025 - Removed duplicates, consolidated font files, moved legacy code

## Directory Structure

| Folder | Purpose |
| --- | --- |
| `base/` | Reset, typography, and animations |
| `core/` | Low-level variables, mixins, and base styles |
| `components/` | Reusable component styles (rede-core, rede-header, etc.) |
| `home/` | Home page specific styles |
| `layout/` | Header, footer, sidebar, and grid layouts |
| `legacy/` | **Deprecated files** - kept for reference only |
| `themes/` | Theme presets |
| `utils/` | SCSS utilities: `_functions.scss`, `_mixins.scss`, `_variables.scss` |

## Key Files

| File | Purpose |
| --- | --- |
| `index.scss` | **Main entry point** - imports all partials |
| `_design-system.scss` | Forwards tokens from `../theme/_tokens.scss` |
| `_variables.scss` | SCSS variables mapped to CSS custom properties |
| `_mixins.scss` | Reusable mixins (card-surface, soft-shadow, etc.) |
| `sidebar-modern.scss` | Modern sidebar theme with design tokens |
| `fonts.css` | **Single source** for font imports and variables |
| `all.css` | Font Awesome icons (bundled locally) |

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

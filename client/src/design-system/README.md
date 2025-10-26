# Design System (overview)

This folder is the starting point for a single source-of-truth design system for the client.

Key files and guidance:

- `../styles/_design-system.scss` - primary token file (spacing, radii, colors, gradients). This is already used across the app and should remain the single token source.
- `tokens` should live as CSS variables (which the project already exposes). Use `var(--color-primary)` etc from components.
- Create small primitives under `client/src/components/ui` (Button, Card, Input, Icon) and export them from `client/src/components/ui/index.js`.

Usage:

- Prefer tokens over hard-coded hex values. Example in JSX/Tailwind: `className="bg-primary text-white"` (Tailwind is configured to use CSS vars).
- When adding new tokens, add them to `_design-system.scss` and document the purpose here.

Migration path:
1. Add new primitive to `components/ui/`.
2. Gradually replace repeated patterns in pages/components with primitives.
3. Keep per-component styles for large, specialized pages; aim to share small building blocks.

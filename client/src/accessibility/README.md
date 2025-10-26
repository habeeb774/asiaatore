# Accessibility checklist & next steps

This document lists pragmatic accessibility improvements to apply incrementally.

Priorities (quick wins):
- All interactive elements must have discernible text (use `aria-label` on icons/buttons).
- Ensure keyboard focus styles are visible (we use `focus-visible` rules in primitives like `Button`).
- Images: ensure `alt` text is present and meaningful. Use `LazyImage` which already accepts `alt`.
- Contrast: run a contrast checker for hero/CTA and adjust tokens in `_design-system.scss` if needed.
- Landmark roles: ensure header/main/nav/footer landmarks exist (App layout should set them).
- Form fields: use `label` element or `aria-labelledby` where labels are not visible.

Files/actions:
- Replace direct `<button>` that contains only an icon with `Button` primitive and an `aria-label`.
- Audit `client/src/pages/**` for missing `alt` attributes.
- Run `npx axe` or Lighthouse accessibility audits and triage top 10 issues.

Automation & linting:
- `eslint-plugin-jsx-a11y` is available in the project. Add/enforce rules in `eslint.config.js` as next step.

If you want, I can:
- Run an automatic scan (Lighthouse CLI) and produce a prioritized list.
- Open and fix the highest-impact accessibility issues (icon-only buttons, missing alt texts, focus styles) in small batches.

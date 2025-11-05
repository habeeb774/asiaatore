UI Primitives Contract

This file documents props and expected behavior for the centralized UI primitives used across the app.

Button
- Props: variant ('primary'|'secondary'|'accent'|'outline'|'ghost'|'danger'|'success'), size ('sm'|'md'|'lg'|'icon'), disabled, as ("button"|"a"), className
- Behavior: maps to `.ui-btn` classes and supports `is-loading` and `is-disabled` states.

Card
- Props: children, header, footer, className, variant ('default'|'outline'|'flat'|'ghost')
- Behavior: wraps content with `.ui-card` styles; header and footer are optional slots.

Input
- Props: value, defaultValue, onChange, placeholder, type, name, className, size ('sm'|'md'|'lg')
- Behavior: renders an input inside `.ui-input` wrapper; forwards focus and supports textarea/select.

Badge
- Props: children, variant ('neutral'|'info'|'success'|'warning'|'danger'), size ('sm'|'md'|'lg')
- Behavior: simple inline badge using `.ui-badge` classes.

Modal
- Props: open (boolean), onClose (fn), title, children, footer
- Behavior: overlay + content box using `.ui-card` and focuses first focusable element when opened.

Notes
- All primitives should read global CSS variables (defined in `_ui.scss` and theme) for radius, font-family, and sizing where applicable.
- Prefer composition over props for advanced cases (pass child nodes into header/footer/slots).

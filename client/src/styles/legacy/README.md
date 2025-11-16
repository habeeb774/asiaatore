# Legacy style tokens

This folder hosts small shared partials for the older hero/cart layouts that still ship with the storefront. The goal is to keep duplicated selectors (for example `.product`, `.price`, `.stars`, `.btn_add_cart`) in a single place so that multiple hero variants can reuse them without copy/pasting hundreds of lines again.

Current partials:


 Whenever you need to touch any of the legacy hero files (`Hero.scss`, `HeroUnified.css`), import one of these partials or rely on the global `index.scss` entry rather than duplicating declarations. The former monolith `reda-store-theme.css` has been migrated to the `components/` partials and removed from the repository.

> Tip: if a hero variation needs a bespoke tweak, extend the mixins (e.g. `@include mixins.card-surface($padding: 24px)`) instead of copying raw background/border/shadow declarations.

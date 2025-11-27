# Legacy / Deprecated Styles

> **⚠️ WARNING:** These files are **deprecated** and kept for reference only.
> Do NOT import these files in new code.

## Files Moved Here (Nov 2025 Cleanup)

| File | Reason Deprecated |
| --- | --- |
| `index.css` | Replaced by `index.scss` - was commented out in main.jsx |
| `global-fonts.css` | Consolidated into `fonts.css` |
| `cairo-font-fix.css` | Duplicate of font system |
| `force-cairo-font.css` | Duplicate of font system |
| `cart-button-fix.css` | Replaced by proper `product-styles.css` |
| `override-cart-button.css` | Duplicate with `!important` abuse |
| `product-card-overrides.css` | Duplicate with `!important` abuse |
| `product-card-typography.css` | Font now handled globally |
| `auth-enhanced.css` | Unused authentication theme |
| `auth-luxury.css` | Unused authentication theme |
| `auth-modern.css` | Unused authentication theme |

## Original Legacy Files

| File | Purpose |
| --- | --- |
| `_legacy-product-block.scss` | Shared product card styles for hero variants |

## Migration Notes

If you need functionality from any of these files:
1. Check if the functionality exists in `../fonts.css` or `../product-styles.css`
2. Use design tokens from `../../theme/_tokens.scss`
3. Avoid `!important` - fix specificity at the source instead

const TOKEN_REGISTRY = {
  'brand.primary': '--color-primary',
  'brand.primaryAlt': '--color-primary-alt',
  'brand.primaryRgb': '--color-primary-rgb',
  'brand.secondary': '--color-secondary',
  'brand.gradient.primary': '--grad-primary',
  'brand.accent': '--color-accent',
  'brand.accentRgb': '--color-accent-rgb',
  'brand.ring': '--color-ring',
  'surface.background': '--color-bg',
  'surface.alt': '--color-bg-alt',
  'surface.card': '--color-surface',
  'border.hairline': '--color-border',
  'border.soft': '--color-border-soft',
  'radius.button': '--radius-md',
  'radius.card': '--radius-lg',
  'shadow.card': '--shadow-md',
  'shadow.popover': '--shadow-lg'
};

const TOKEN_FALLBACKS = {
  'brand.primary': '#2F855A',
  'brand.primaryAlt': '#276749',
  'brand.primaryRgb': '47,133,90',
  'brand.secondary': '#276749',
  'brand.gradient.primary': 'linear-gradient(180deg, #2F855A, #00b561ff)',
  'brand.accent': '#3A5A79',
  'brand.accentRgb': '58,90,121',
  'brand.ring': '#C8A96A',
  'surface.background': '#FAFAF8',
  'surface.alt': '#F5F5F2',
  'surface.card': '#FFFFFF',
  'border.hairline': 'rgba(12,18,28,0.08)',
  'border.soft': 'rgba(12,18,28,0.06)',
  'radius.button': '10px',
  'radius.card': '16px',
  'shadow.card': '0 6px 18px -6px rgba(0,0,0,0.18)',
  'shadow.popover': '0 18px 42px -14px rgba(0,0,0,0.22)'
};

const sanitizeTokenName = (name) => `--${name.replace(/[^a-z0-9]+/gi, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')}`;

export const getCssVarForToken = (token) => TOKEN_REGISTRY[token] || sanitizeTokenName(token);

export const readDesignTokens = () => {
  const initial = { ...TOKEN_FALLBACKS };
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return initial;
  }
  try {
    const styles = getComputedStyle(document.documentElement);
    Object.entries(TOKEN_REGISTRY).forEach(([token, cssVar]) => {
      const value = styles.getPropertyValue(cssVar)?.trim();
      if (value) {
        initial[token] = value;
      }
    });
  } catch {
    // ignore read errors (e.g., Safari private browsing getComputedStyle issues)
  }
  return initial;
};

export const applyDesignTokens = (patch = {}) => {
  if (!patch || typeof patch !== 'object') return;
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  Object.entries(patch).forEach(([token, value]) => {
    const cssVar = getCssVarForToken(token);
    root.style.setProperty(cssVar, value == null ? '' : String(value));
  });
};

export const mergeTokenMaps = (...maps) => Object.assign({}, ...maps.filter(Boolean));

export default {
  TOKEN_REGISTRY,
  TOKEN_FALLBACKS,
  getCssVarForToken,
  readDesignTokens,
  applyDesignTokens,
  mergeTokenMaps
};

const detectLocale = () => {
  try {
    const fromStorage = localStorage.getItem('lang');
    const fromDoc = document?.documentElement?.lang;
    const fromNav = navigator?.language || navigator?.languages?.[0];
    return (fromStorage || fromDoc || fromNav || 'en').slice(0, 2).toLowerCase();
  } catch {
    return 'en';
  }
};

export function t(value, locale = detectLocale()) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  // Localized object { ar, en, ... }
  if (typeof value === 'object') {
    const lc = String(locale || 'en').slice(0, 2).toLowerCase();
    // Try exact locale, then 'en', then first string field
    if (value[lc] && typeof value[lc] === 'string') return value[lc];
    if (value.en && typeof value.en === 'string') return value.en;
    const firstStr = Object.values(value).find(v => typeof v === 'string');
    if (firstStr) return firstStr;
    // Arrays: join strings
    if (Array.isArray(value)) return value.map(v => t(v, lc)).join(' ');
  }
  // Fallback to JSON for debuggability
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

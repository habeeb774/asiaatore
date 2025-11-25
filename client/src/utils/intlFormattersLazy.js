// Lazy intl formatters: dynamically create and cache heavy Intl instances on demand.
// Usage: import('./utils/intlFormattersLazy').then(f => f.formatCurrency(123))

const caches = {
  number: new Map(),
  currency: new Map(),
  percent: new Map(),
  dateTime: new Map(),
};

function get(locale, opts, bucket){
  const key = locale + '|' + JSON.stringify(opts || {});
  const map = caches[bucket];
  if (map.has(key)) return map.get(key);
  const fmt = new Intl.NumberFormat(locale, opts);
  map.set(key, fmt);
  return fmt;
}

export function formatNumber(value, locale='ar-SA', options){
  return get(locale, options, 'number').format(value);
}
export function formatCurrency(value, locale='ar-SA', currency='SAR', options){
  const fmt = get(locale, { style:'currency', currency, ...(options||{}) }, 'currency');
  return fmt.format(value);
}
export function formatPercent(value, locale='ar-SA', options){
  const fmt = get(locale, { style:'percent', maximumFractionDigits:1, ...(options||{}) }, 'percent');
  return fmt.format(value);
}
export function formatCompact(value, locale='ar-SA'){
  return get(locale, { notation:'compact' }, 'number').format(value);
}

// Date/time formatting (NumberFormat cannot handle dates; use DateTimeFormat)
function getDT(locale, opts){
  const key = locale + '|' + JSON.stringify(opts || {});
  const map = caches.dateTime;
  if (map.has(key)) return map.get(key);
  const fmt = new Intl.DateTimeFormat(locale, opts);
  map.set(key, fmt);
  return fmt;
}
export function formatDateTime(date, locale='ar-SA', options){
  const d = date instanceof Date ? date : new Date(date);
  return getDT(locale, { dateStyle:'short', timeStyle:'short', ...(options||{}) }).format(d);
}

export function preloadIntl(locale='ar-SA'){
  // Warm common caches without formatting anything heavy
  formatNumber(0, locale);
  formatCurrency(0, locale);
  formatPercent(0, locale);
  formatCompact(0, locale);
}

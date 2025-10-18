// Utility helpers for localized fields (name, description, etc.)
// Provides a single place to resolve objects of shape { ar, en, ... } to a string.

export function resolveLocalized(value, locale, fallbackOrder = ['ar','en']) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    // direct locale
    if (value[locale]) return String(value[locale]);
    // fallback order
    for (const k of fallbackOrder) {
      if (value[k]) return String(value[k]);
    }
    // first primitive
    const first = Object.values(value).find(v => typeof v === 'string' || typeof v === 'number');
    return first ? String(first) : '';
  }
  return '';
}

export function localizeName(entity, locale, field = 'name') {
  return resolveLocalized(entity?.[field], locale);
}

export function localizeField(entity, field, locale, fallbackOrder) {
  return resolveLocalized(entity?.[field], locale, fallbackOrder);
}

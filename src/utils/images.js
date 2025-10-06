// Helper to build a srcset given a base URL and known variant map.
// Example: buildSrcSet(product.image, { 160: '-160w', 320: '-320w', 640: '-640w' })
export function buildSrcSet(baseUrl, variants = {}) {
  if (!baseUrl || typeof baseUrl !== 'string') return undefined;
  const parts = [];
  for (const [w, suffix] of Object.entries(variants)) {
    const u = injectSuffix(baseUrl, String(suffix));
    if (u) parts.push(`${u} ${w}w`);
  }
  return parts.length ? parts.join(', ') : undefined;
}

// Inject suffix before extension, e.g., /img/photo.jpg + '-320w' => /img/photo-320w.jpg
export function injectSuffix(url, suffix) {
  try {
    const qIndex = url.indexOf('?');
    const clean = qIndex >= 0 ? url.slice(0, qIndex) : url;
    const qs = qIndex >= 0 ? url.slice(qIndex) : '';
    const dot = clean.lastIndexOf('.');
    if (dot <= 0) return `${clean}${suffix}${qs}`;
    return `${clean.slice(0, dot)}${suffix}${clean.slice(dot)}${qs}`;
  } catch {
    return undefined;
  }
}

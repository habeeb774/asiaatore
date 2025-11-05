// Tiny smoke helper to inspect/print the assigned A/B variant in-browser.
// Usage in browser console:
//   __printExperimentVariant('hero_cta', ['A','B'])
// Returns the assigned variant and logs it to console.

export function printExperimentVariant(key = 'hero_cta', variants = ['A', 'B']) {
  try {
    if (typeof window === 'undefined') {
      console.warn('printExperimentVariant: window is not available');
      return undefined;
    }
    if (!key || !Array.isArray(variants) || variants.length === 0) return undefined;

    // 1) URL override: ?ab_<key>=<variant>
    try {
      const params = new URLSearchParams(window.location.search);
      const param = params.get('ab_' + key);
      if (param && variants.includes(param)) {
        console.info(`[experiment] ${key} -> ${param} (from URL ?ab_${key}=)`);
        return param;
      }
    } catch (e) {
      // ignore
    }

    // 2) Local override: localStorage ab_<key>
    try {
      const stored = localStorage.getItem('ab_' + key);
      if (stored && variants.includes(stored)) {
        console.info(`[experiment] ${key} -> ${stored} (from localStorage ab_${key})`);
        return stored;
      }
    } catch (e) {
      // ignore
    }

    // 3) Previously assigned deterministic value: 'ab_<key>_assigned'
    const storageKey = 'ab_' + key + '_assigned';
    try {
      const assigned = localStorage.getItem(storageKey);
      if (assigned && variants.includes(assigned)) {
        console.info(`[experiment] ${key} -> ${assigned} (from persisted ${storageKey})`);
        return assigned;
      }
    } catch (e) {
      // ignore
    }

    // 4) Otherwise assign randomly and persist
    const choice = variants[Math.floor(Math.random() * variants.length)];
    try { localStorage.setItem(storageKey, choice); } catch (e) { /* ignore write errors */ }
    console.info(`[experiment] ${key} -> ${choice} (newly assigned and persisted to ${storageKey})`);
    return choice;
  } catch (e) {
    console.warn('printExperimentVariant: failed', e);
    return variants[0];
  }
}

// Attach a convenient helper for quick debugging in the browser console
if (typeof window !== 'undefined') {
  try {
    window.__printExperimentVariant = printExperimentVariant;
  } catch (e) {
    // ignore
  }
}

export default printExperimentVariant;

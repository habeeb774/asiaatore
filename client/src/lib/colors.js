export function getCssVar(name) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return null;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name);
  return val ? val.trim() : null;
}

export function setCssVar(name, value) {
  try {
    document.documentElement.style.setProperty(name, value);
    return true;
  } catch {
    return false;
  }
}

export function hexToRgb(hex) {
  if (!hex) return null;
  const h = hex.replace('#','');
  const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
}

export function setPrimaryColor(hex) {
  if (!hex) return false;
  setCssVar('--color-primary', hex);
  const rgb = hexToRgb(hex);
  if (rgb) setCssVar('--color-primary-rgb', rgb);
  return true;
}

export default {
  getCssVar,
  setCssVar,
  hexToRgb,
  setPrimaryColor
};

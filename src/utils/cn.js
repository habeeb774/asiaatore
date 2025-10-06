// Tiny classnames utility to merge class strings conditionally
export function cn(...args) {
  return args
    .flatMap(a => Array.isArray(a) ? a : [a])
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default cn;

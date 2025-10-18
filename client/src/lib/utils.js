// Small helper inspired by shadcn/ui
export function cn(...values) {
  return values
    .flatMap(v => Array.isArray(v) ? v : [v])
    .filter(Boolean)
    .join(' ');
}

export default { cn };
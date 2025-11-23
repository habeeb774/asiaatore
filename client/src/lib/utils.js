import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind-aware className helper reused across UI components
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default { cn };

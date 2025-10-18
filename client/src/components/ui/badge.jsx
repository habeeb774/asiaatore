import React from 'react';
import { cn } from '../../lib/utils.js';

// Badge
// Props: variant: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
//        size: 'sm' | 'md' | 'lg'
export function Badge({ variant = 'neutral', size = 'md', children, className = '' }) {
  const toneClass = `ui-badge--${variant}`;
  const sizeClass = `ui-badge--${size}`;
  return (
    <span className={cn('ui-badge', toneClass, sizeClass, className)}>
      {children}
    </span>
  );
}

export default Badge;
import React from 'react';
import { cn } from '../../lib/utils.js';

export function Badge({ variant = 'neutral', children, className = '' }) {
  const toneClass = `ui-badge--${variant}`;
  return (
    <span className={cn('ui-badge', toneClass, className)}>
      {children}
    </span>
  );
}

export default Badge;
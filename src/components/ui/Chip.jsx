import React from 'react';
import { cn } from '../../lib/utils.js';

export function Chip({
  className = '',
  variant = 'outline', // 'primary' | 'outline' | 'soft'
  size = 'md', // 'sm' | 'md' | 'lg'
  selected = false,
  onClose,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn('ui-chip', `ui-chip--${variant}`, `ui-chip--${size}`, selected && 'is-selected', className)}
      aria-pressed={selected || undefined}
      {...props}
    >
      <span className="ui-chip__label">{children}</span>
      {onClose ? (
        <span role="button" aria-label="Remove" className="ui-chip__close" onClick={(e)=>{ e.stopPropagation(); onClose?.(e); }}>
          ×
        </span>
      ) : null}
    </button>
  );
}

export default Chip;

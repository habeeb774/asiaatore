import React from 'react';
import { cn } from '../../lib/utils.js';

// Skeleton
// Props: size: 'sm' | 'md' | 'lg' | undefined
//        variant: 'text' | 'circle' | 'static' | undefined
export function Skeleton({ className = '', size, variant, ...props }) {
  const sizeClass = size ? `ui-skeleton--${size}` : '';
  const variantClass = variant ? `ui-skeleton--${variant}` : '';
  return <div className={cn('ui-skeleton', sizeClass, variantClass, className)} {...props} />;
}

export default Skeleton;
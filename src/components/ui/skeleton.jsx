import React from 'react';
import { cn } from '../../lib/utils.js';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200/70 dark:bg-gray-800/60', className)}
      {...props}
    />
  );
}

export default Skeleton;
import React from 'react';
import { cn } from '../../lib/utils.js';

export function Badge({ className = '', variant = 'default', children, ...props }) {
  const styles = {
    default: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    neutral: 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
  };
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', styles[variant] || styles.default, className)} {...props}>
      {children}
    </span>
  );
}

export default Badge;

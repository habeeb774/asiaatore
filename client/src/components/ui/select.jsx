import React from 'react';
import { cn } from '../../lib/utils.js';

// Select primitive styled like Input
export const Select = React.forwardRef(function Select({ className = '', size = 'md', children, ...props }, ref) {
  const cls = cn('ui-input', size === 'sm' ? 'ui-input--sm' : size === 'lg' ? 'ui-input--lg' : '', className);
  return (
    <select ref={ref} className={cls} {...props}>
      {children}
    </select>
  );
});

export default Select;

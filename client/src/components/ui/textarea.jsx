import React from 'react';
import { cn } from '../../lib/utils.js';

// Textarea primitive using the centralized .ui-input styles
export const Textarea = React.forwardRef(function Textarea({ className = '', size = 'md', ...props }, ref) {
  const cls = cn('ui-input', size === 'sm' ? 'ui-input--sm' : size === 'lg' ? 'ui-input--lg' : '', className);
  return <textarea ref={ref} className={cn(cls, 'ui-input__native')} {...props} />;
});

export default Textarea;

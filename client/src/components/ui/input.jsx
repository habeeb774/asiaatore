import React from 'react';
import { cn } from '../../lib/utils.js';

// Input primitive using the centralized .ui-input styles
export const Input = React.forwardRef(function Input({ className = '', size = 'md', leading, trailing, ...props }, ref) {
  const cls = cn('ui-input', size === 'sm' ? 'ui-input--sm' : size === 'lg' ? 'ui-input--lg' : '', className);
  if (leading || trailing) {
    return (
      <label className={cls}>
        {leading ? <span className="ui-input__leading">{leading}</span> : null}
        <input ref={ref} {...props} />
        {trailing ? <span className="ui-input__trailing">{trailing}</span> : null}
      </label>
    );
  }
  return <input ref={ref} className={cn(cls, 'ui-input__native')} {...props} />;
});

export default Input;
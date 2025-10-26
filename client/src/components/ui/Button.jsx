import React from 'react';
import clsx from 'clsx';

// Accessible button primitive used across the app. Use this instead of raw <button>
// Props: variant: 'primary' | 'secondary' | 'ghost', size: 'sm'|'md'|'lg', as: 'button'|'a'
const base = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';
const variants = {
  primary: 'bg-primary text-white hover:brightness-95',
  secondary: 'bg-secondary text-white hover:brightness-95',
  ghost: 'bg-transparent text-foreground hover:bg-gray-100'
};
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg'
};

const Button = React.forwardRef(function Button(
  { as = 'button', variant = 'primary', size = 'md', className, children, disabled = false, 'aria-label': ariaLabel, ...rest },
  ref
) {
  const compClass = clsx(base, variants[variant], sizes[size], className, {
    'opacity-50 cursor-not-allowed pointer-events-none': disabled
  });

  // Use <a> when as='a' (pass href in rest)
  if (as === 'a') {
    return (
      <a
        ref={ref}
        className={compClass}
        aria-label={ariaLabel}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref}
      type={rest.type || 'button'}
      className={compClass}
      disabled={disabled}
      aria-label={ariaLabel}
      {...rest}
    >
      {children}
    </button>
  );
});
export { Button };

export default Button;

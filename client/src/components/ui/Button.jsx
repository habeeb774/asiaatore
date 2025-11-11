import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

// Button primitive that maps to the centralized UI styles in _ui.scss
// Props: variant: 'primary'|'secondary'|'accent'|'outline'|'ghost'|'danger'|'success'
// size: 'sm'|'md'|'lg'
const variantMap = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  accent: 'ui-btn--accent',
  outline: 'ui-btn--outline',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
  destructive: 'ui-btn--danger',
  success: 'ui-btn--success'
};

const sizeMap = { sm: 'ui-btn--sm', md: 'ui-btn--md', lg: 'ui-btn--lg', icon: 'ui-btn--icon' };

export function buttonVariants({ variant = 'primary', size = 'md', className } = {}) {
  return clsx('ui-btn', variantMap[variant] || variantMap.primary, sizeMap[size] || sizeMap.md, className);
}

const Button = React.forwardRef(function Button(
  { as = 'button', variant = 'primary', size = 'md', className, children, disabled = false, 'aria-label': ariaLabel, ...rest },
  ref
) {
  const compClass = clsx(buttonVariants({ variant, size, className }), {
    'is-disabled': disabled
  });

  if (as === 'a') {
    return (
      <a ref={ref} className={compClass} aria-label={ariaLabel} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} type={rest.type || 'button'} className={compClass} disabled={disabled} aria-label={ariaLabel} {...rest}>
      {children}
    </button>
  );
});

export const ButtonLink = React.forwardRef(function ButtonLink({ to, href, variant = 'primary', size = 'md', className, children, ...rest }, ref) {
  const compClass = buttonVariants({ variant, size, className });

  // Use React Router Link if 'to' prop is provided
  if (to) {
    return (
      <Link ref={ref} to={to} className={compClass} {...rest}>
        {children}
      </Link>
    );
  }

  // Fallback to regular anchor tag
  return (
    <a ref={ref} href={href} className={compClass} {...rest}>
      {children}
    </a>
  );
});

export { Button };
export default Button;

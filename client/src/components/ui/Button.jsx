import React from 'react';
import { cn } from '../../lib/utils.js';

// Token-based button using _ui.scss classes
export const Button = React.forwardRef(function Button({
  className = '',
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'ghost' | 'soft'
  size = 'md', // 'sm' | 'md' | 'lg' | 'icon'
  loading = false,
  asChild,
  children,
  ...props
}, ref) {
  const Comp = asChild ? 'span' : 'button';
  const v = variant === 'default' ? 'primary' : (variant === 'destructive' ? 'danger' : variant);
  const variantClass = `ui-btn--${v}`;
  const sizeClass = `ui-btn--${size}`;
  return (
    <Comp
      ref={ref}
      className={cn('ui-btn', variantClass, sizeClass, loading && 'is-loading', className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {children}
    </Comp>
  );
});

export default Button;

import React from 'react';
import { cn } from '../../lib/utils.js';

const variants = {
  default: 'bg-primary text-white hover:opacity-95',
  outline: 'border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-900',
  destructive: 'bg-danger text-white hover:opacity-95',
  secondary: 'bg-secondary text-white hover:opacity-95'
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4',
  lg: 'h-10 px-5 text-base',
  icon: 'h-9 w-9 p-0'
};

export const Button = React.forwardRef(function Button({
  className,
  variant = 'default',
  size = 'md',
  asChild,
  ...props
}, ref) {
  const Comp = asChild ? 'span' : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    />
  );
});

export default Button;

import React from 'react'
import cn from '../../utils/cn'

// Props: variant (primary|secondary|ghost|danger), size (sm|md|lg), full, icon, loading
export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  full = false,
  className,
  children,
  loading = false,
  disabled,
  ...rest
}) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-ring disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-primary text-white hover:brightness-110 shadow-sm',
    secondary: 'bg-secondary text-white hover:brightness-110 shadow-sm',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
    danger: 'bg-danger text-white hover:brightness-110 shadow-sm'
  }
  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base'
  }
  return (
    <Comp
      className={cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, full && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </Comp>
  )
}

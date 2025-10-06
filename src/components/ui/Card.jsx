import React from 'react'
import cn from '../../utils/cn'

export function Card({ className, children, ...rest }) {
  return (
    <div className={cn('bg-white dark:bg-[#0f1525] text-inherit rounded-xl shadow-card border border-black/5 dark:border-white/10', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...rest }) {
  return (
    <div className={cn('px-5 py-4 border-b border-black/5 dark:border-white/10', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...rest }) {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div className={cn('px-5 py-3 border-t border-black/5 dark:border-white/10', className)} {...rest}>
      {children}
    </div>
  )
}

export default Card

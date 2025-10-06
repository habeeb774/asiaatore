import React, { useEffect } from 'react'
import cn from '../../utils/cn'
import Button from './Button'

export default function Modal({ open, onClose, title, children, footer, size = 'md', closeOnOutside = true, className }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  const handleBackdrop = (e) => { if (e.target === e.currentTarget && closeOnOutside) onClose?.() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleBackdrop} />
      <div className={cn('relative w-full mx-4 rounded-xl shadow-modal bg-white dark:bg-[#0f1525] border border-black/10 dark:border-white/10', sizes[size], className)}>
        {(title || onClose) && (
          <div className="px-5 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-base font-semibold">{title}</h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>
            )}
          </div>
        )}
        <div className="px-5 py-4 max-h-[70vh] overflow-auto">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-black/5 dark:border-white/10">{footer}</div>
        )}
      </div>
    </div>
  )
}

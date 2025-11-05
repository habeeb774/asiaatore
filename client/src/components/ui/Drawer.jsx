import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import Button from './Button';

// Simple right-side drawer. Props: open, onClose, title, children, width
export default function Drawer({ open, onClose, title, children, width = 420, className }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose?.(); };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleBackdrop} />
      <div
        className={cn(
          'absolute top-0 right-0 h-full bg-white dark:bg-[#0f1525] border-l border-black/10 dark:border-white/10 shadow-xl flex flex-col',
          className
        )}
        style={{ width }}
        role="dialog"
        aria-modal="true"
      >
        {(title || onClose) && (
          <div className="px-4 py-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-base font-semibold truncate">{title}</h3>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>
            )}
          </div>
        )}
        <div className="p-4 overflow-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import CartPanel from './CartPanel';

export default function CartSidebar({ open, onClose, ...props }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <CartPanel {...props} onClose={onClose} />
    </div>
  );
}

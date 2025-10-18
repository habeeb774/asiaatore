import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

const formatPrice = (n, locale = 'en') => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(n || 0);
  } catch (e) {
    return (n || 0).toFixed(2) + ' SAR';
  }
};

export default function CartPanel({ onClose, items, total, locale, t, updateQuantity }) {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const panelMotion = reduceMotion ? { initial: false, animate: {}, exit: {} } : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 } };
  return (
    <motion.aside id="cart-panel" {...panelMotion} transition={{ duration: 0.22 }} className="fixed right-4 top-20 w-96 bg-white dark:bg-slate-900 border rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold">{t('cartTitle') || 'Cart'}</h3>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t('close') || 'Close'}><X size={16} /></button>
      </div>
      <div className="p-4 max-h-64 overflow-auto">
        {items && items.length ? (
          <ul className="flex flex-col gap-3">
            {items.map(item => (
              <li key={item.id} className="flex items-center gap-3">
                <img src={item.images?.[0] || item.image || '/images/placeholder.jpg'} alt={item.name || ''} className="w-14 h-14 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.name || item.title}</div>
                  <div className="text-xs text-slate-500">{formatPrice(item.price || item.salePrice || 0, locale)} × {item.quantity || 1}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm font-semibold">{formatPrice((item.price || item.salePrice || 0) * (item.quantity || 1), locale)}</div>
                  <div className="flex gap-1">
                    <button onClick={() => updateQuantity && updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))} className="px-2 py-1 border rounded" aria-label="Decrease quantity">-</button>
                    <span className="px-2 py-1 border rounded">{item.quantity || 1}</span>
                    <button onClick={() => updateQuantity && updateQuantity(item.id, (item.quantity || 1) + 1)} className="px-2 py-1 border rounded" aria-label="Increase quantity">+</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-slate-500">{t('emptyCart') || 'Cart is empty'}</div>
        )}
      </div>
      <div className="p-4 border-t dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600">{t('totalLabel') || 'Total'}</div>
          <div className="font-semibold">{formatPrice(total, locale)}</div>
        </div>
        <div className="flex gap-2">
          <Link to="/cart" onClick={onClose} className="w-1/2 text-center py-2 border rounded">{t('cart') || 'View cart'}</Link>
          <Link to="/checkout" onClick={onClose} className="w-1/2 text-center py-2 bg-amber-500 text-white rounded">{t('proceedCheckout') || 'Checkout'}</Link>
        </div>
      </div>
    </motion.aside>
  );
}

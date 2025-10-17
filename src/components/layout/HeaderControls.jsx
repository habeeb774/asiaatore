import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Sun, Languages } from 'lucide-react';

export default function HeaderControls({ t, locale, setLocale, panel, setPanel, cartItems, cartTotal, updateQuantity, user }) {
  const cartBtnRef = useRef(null);
  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
  const langs = ['ar', 'en', 'fr'];
  const onCycleLanguage = () => {
    if (!setLocale) return;
    const idx = Math.max(0, langs.indexOf(locale));
    const next = langs[(idx + 1) % langs.length];
    setLocale(next);
  };

  useEffect(() => {
    const el = cartBtnRef.current;
    if (!el || typeof el.animate !== 'function') return;
    try {
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1)' }
      );
    } catch {}
  }, [cartCount]);

  return (
    <div className="flex items-center gap-3">
      {/* Compact mobile language toggle */}
      <button
        type="button"
        onClick={onCycleLanguage}
        aria-label={(t && t('changeLanguage')) || 'Change language'}
        title={(t && t('changeLanguage')) || 'Change language'}
        className="sm:hidden inline-flex items-center gap-1 px-2 py-1 rounded-md border bg-white dark:bg-slate-900 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Languages size={14} /> {String(locale || '').toUpperCase()}
      </button>

      <select value={locale} onChange={e => setLocale && setLocale(e.target.value)} className="hidden sm:block text-sm border rounded px-2 py-1 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        <option value="en">EN</option>
        <option value="ar">AR</option>
        <option value="fr">FR</option>
      </select>

      <button aria-label="Toggle theme" className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border hidden sm:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Sun size={16} /></button>

      <button ref={cartBtnRef} onClick={() => setPanel('cart')} aria-expanded={panel === 'cart'} aria-controls="cart-panel" className="relative p-2 rounded-md border bg-white dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        <ShoppingCart size={18} />
        {cartCount > 0 && (<span className="absolute -top-1 -right-1 text-xs font-semibold bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>)}
      </button>

      {!user ? (
        <Link to="/login" className="text-sm px-3 py-1 border rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">{t('login') || 'Login'}</Link>
      ) : (
        <Link to="/account/profile" className="flex items-center gap-2 px-3 py-1 border rounded text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><User size={16} /><span className="hidden sm:inline-block">{user.name || (user.email || '').split('@')[0]}</span></Link>
      )}
    </div>
  );
}

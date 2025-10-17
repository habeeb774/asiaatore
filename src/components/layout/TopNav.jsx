import React from 'react';
import { Link } from 'react-router-dom';

export default function TopNav({ t, isActive }) {
  const label = (k, fallback) => {
    try {
      if (typeof t === 'function') {
        const key = `nav.${k}`;
        const val = t(key);
        if (val && val !== key) return val;
      }
    } catch {}
    return fallback;
  };
  return (
    <nav className="hidden lg:flex items-center gap-2">
      <Link
        to="/catalog"
        aria-current={isActive('/catalog') ? 'page' : undefined}
        className={`px-2 py-1 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive('/catalog') ? 'text-slate-900 dark:text-white bg-amber-50/60 dark:bg-amber-400/10' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900'}`}
      >
        {label('catalog', 'Catalog')}
      </Link>
      <Link
        to="/products"
        aria-current={isActive('/products') ? 'page' : undefined}
        className={`px-2 py-1 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive('/products') ? 'text-slate-900 dark:text-white bg-amber-50/60 dark:bg-amber-400/10' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900'}`}
      >
        {label('products', 'Products')}
      </Link>
      <Link
        to="/offers"
        aria-current={isActive('/offers') ? 'page' : undefined}
        className={`px-2 py-1 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive('/offers') ? 'text-slate-900 dark:text-white bg-amber-50/60 dark:bg-amber-400/10' : 'text-slate-700 dark:text-slate-200 hover:text-slate-900'}`}
      >
        {label('offers', 'Offers')}
      </Link>
    </nav>
  );
}

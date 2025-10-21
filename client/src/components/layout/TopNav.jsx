import React from 'react';
import { Link } from 'react-router-dom';

// Example navItems, adjust as needed for your app
import { BookOpen, Package, BadgePercent, Store } from 'lucide-react';

const navItems = [
  { to: '/catalog', label: 'catalog', icon: BookOpen },
  { to: '/products', label: 'products', icon: Package },
  { to: '/offers', label: 'offers', icon: BadgePercent },
  { to: '/stores', label: 'stores', icon: Store },
];

export default function TopNav({ t, isActive }) {
  return (
    <div style={{width:'100vw',position:'relative',left:'50%',right:'50%',marginLeft:'-50vw',marginRight:'-50vw'}}>
      <nav className="top-nav flex items-center justify-center gap-2 sm:gap-4 md:gap-6 px-2 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-md border border-slate-200 dark:border-slate-800 transition-all duration-300" style={{width:'100%'}}>
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={
              `top-nav-link flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-slate-700 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors duration-200 ${isActive(item.to) ? 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 shadow' : ''}`
            }
          >
            {item.icon && <item.icon size={18} className="mr-1" />}
            <span>{t(item.label)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

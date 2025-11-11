// Refactored Header + Sidebar bundle with optimized performance
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { createPortal } from 'react-dom';
import { User as UserIcon } from 'lucide-react';

// Components
import CartPanel from '../cart/CartPanel';
import TopNav from './TopNav';
import HeaderControls from './HeaderControls';
import TopStrip from './TopStrip';

// Icons
import { MenuIcon, XIcon, SearchIcon } from './HeaderIcons';

// Hooks
import { useDarkMode } from '../../hooks/useDarkMode';
import { useSearch } from '../../hooks/useSearch';
import { useSidebarState } from '../../hooks/useSidebarState';

// Contexts
import { useSidebar, SidebarProvider } from '../../stores/SidebarContext';
import { useCart } from '../../stores/CartContext';
import { useLanguage } from '../../stores/LanguageContext';
import { useAuth } from '../../stores/AuthContext';
import { useSettings } from '../../stores/SettingsContext';

// Utils
const defaultLanguage = () => ({ t: (k) => k, locale: 'en', setLocale: () => {} });
const defaultAuth = () => ({ user: null, logout: () => {} });
const defaultCart = () => ({ cartItems: [], updateQuantity: () => {}, removeFromCart: () => {} });

const resolveMaybeHook = (name, fallbackFactory) => {
  try {
    const v = typeof window !== 'undefined' ? window[name] : undefined;
    if (!v) return fallbackFactory();
    if (typeof v === 'function') {
      try { const res = v(); if (res) return res; } catch {}
    }
    if (typeof v === 'object') return v;
    return fallbackFactory();
  } catch { return fallbackFactory(); }
};

export const HeaderNav = React.memo(function HeaderNav({ className = '' }) {
  const location = useLocation();

  // Context hooks with fallbacks
  const langCtx = useLanguage() || resolveMaybeHook('__useLanguage__', defaultLanguage);
  const authCtx = useAuth() || resolveMaybeHook('__useAuth__', defaultAuth);
  const cartCtx = useCart() || resolveMaybeHook('__useCart__', defaultCart);
  const sidebarCtx = useSidebar();

  // Extract context values
  const { t, locale, setLocale } = langCtx;
  const { user } = authCtx;
  const { cartItems = [], updateQuantity } = cartCtx;

  // Custom hooks
  useDarkMode();
  const { isLoading } = useSearch({
    onSearch: (query) => {
      // Implement search logic here
      console.log('Searching for:', query);
    }
  });
  const { isMenuOpen, toggleSidebar } = useSidebarState(sidebarCtx);

  // Local state
  const [panel, setPanel] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  // Computed values

  const cartTotal = useMemo(() =>
    cartItems.reduce((s, i) => s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0),
    [cartItems]
  );

  // Event handlers
  const closeCart = useCallback(() => setPanel(null), []);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Navigation helpers
  const { pathname } = location;
  const isActive = useCallback((to) =>
    pathname === to || pathname.startsWith(to + '/'),
    [pathname]
  );
  const isHome = ['/', '/en', '/fr'].includes(pathname);
  const headerHeight = isHome ? 'h-14 md:h-16' : 'h-16';

  // Search trigger
  const triggerSearch = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('search:focus'));
    } catch {
      window.dispatchEvent(new Event('search:focus'));
    }
  }, []);

  return (
    <>
      {/* Top strip with promotions (if enabled) */}
      <TopStrip />
  <header style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }} className={`w-full sticky top-0 z-[1200] ${headerHeight} bg-gradient-to-b from-white/95 via-white/90 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/90 backdrop-blur border-b dark:border-slate-800 transition-shadow transition-colors duration-300 ${scrolled ? 'shadow-2xl' : 'shadow'} ${className}`} dir="rtl">
      {/* شريط تحميل أعلى الهيدر عند البحث */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-[1300]">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-pulse rounded-b" style={{width:'100%'}} />
        </div>
      )}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 px-3 py-1 rounded bg-amber-500 text-white">{t('Skip to content')}</a>
    <div className="relative max-w-full sm:max-w-[1200px] mx-auto w-full h-full px-2 sm:px-4 md:px-6 lg:px-10 grid grid-cols-12 items-center gap-1 sm:gap-2 md:gap-4 transition-colors duration-300">
    {/* يسار الهيدر: زر الهامبرغر للهواتف */}
    <div className="col-span-2 flex items-center justify-start">
      <button
        onClick={toggleSidebar}
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? t('إغلاق القائمة') : t('افتح القائمة')}
        aria-controls="app-sidebar"
        className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 focus-visible:ring-2 focus-visible:ring-emerald-500 min-w-[36px] min-h-[36px] transition-all duration-300"
      >
        {isMenuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
      </button>
    </div>

        {/* وسط الهيدر: شريط البحث المدمج */}
        <div className="col-span-6 sm:col-span-7 md:col-span-6 lg:col-span-5 flex justify-center">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            {/* Integrated search bar with overlay trigger */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div
                className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-700/60 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 focus-within:shadow-xl focus-within:border-emerald-300 dark:focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/50 cursor-pointer"
                onClick={triggerSearch}
              >
                <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5">
                  <SearchIcon size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="flex-1 text-gray-500 dark:text-gray-400 text-sm md:text-base select-none truncate">
                    {locale === 'ar' ? "البحث عن المنتجات..." : "Search products..."}
                  </span>
                  {/* Keyboard shortcut hint */}
                  <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">/</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* يمين الهيدر: عناصر التحكم */}
        <div className="col-span-4 sm:col-span-3 md:col-span-4 lg:col-span-5 flex items-center justify-end gap-1 sm:gap-2 md:gap-3">
          {/* Mobile search button for very small screens */}
          <button
            onClick={triggerSearch}
            className="sm:hidden p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 focus-visible:ring-2 focus-visible:ring-emerald-500 min-w-[36px] min-h-[36px] transition-all duration-300"
            aria-label={locale === 'ar' ? "البحث" : "Search"}
          >
            <SearchIcon size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
          <HeaderControls t={t} locale={locale} setLocale={setLocale} panel={panel} setPanel={setPanel} cartItems={cartItems} cartTotal={cartTotal} updateQuantity={updateQuantity} user={user} />
        </div>
      </div>

      {/* Navigation for larger screens */}
      <div className="hidden md:flex justify-center border-t border-gray-100/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <nav className="w-full max-w-[1200px] flex items-center justify-center py-2">
          <TopNav t={t} isActive={isActive} />
        </nav>
      </div>

      {/* SearchOverlay component is mounted separately and listens for 'search:focus' events */}

      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{panel === 'cart' && <CartPanel onClose={closeCart} items={cartItems} total={cartTotal} locale={locale} t={t} updateQuantity={updateQuantity} />}</AnimatePresence>, document.body)}
      </header>
    </>
  );
});

export default HeaderNav;

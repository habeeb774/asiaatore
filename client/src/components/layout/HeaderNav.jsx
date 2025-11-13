// ✅ Fixed version of HeaderNav.jsx (missing closing tags issue)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { createPortal } from 'react-dom';
import { User as UserIcon } from 'lucide-react';
import CartPanel from '../cart/CartPanel';
import HeaderControls from './HeaderControls';
import TopStrip from './TopStrip';
import { MenuIcon, XIcon, SearchIcon } from './HeaderIcons';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useSearch } from '../../hooks/useSearch';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useSidebar } from '../../stores/SidebarContext';
import { useCart } from '../../stores/CartContext';
import { useLanguage } from '../../stores/LanguageContext';
import { useAuth } from '../../stores/AuthContext';
import { useSettings } from '../../stores/SettingsContext';

const defaultLanguage = () => ({ t: (k) => k, locale: 'en', setLocale: () => {} });
const defaultAuth = () => ({ user: null, logout: () => {} });
const defaultCart = () => ({ cartItems: [], updateQuantity: () => {}, removeFromCart: () => {} });

export const HeaderNav = React.memo(function HeaderNav({ className = '' }) {
  const location = useLocation();
  const langCtx = useLanguage() || defaultLanguage();
  const authCtx = useAuth() || defaultAuth();
  const cartCtx = useCart() || defaultCart();
  const settingsCtx = useSettings();
  const sidebarCtx = useSidebar();

  const { t, locale, setLocale } = langCtx;
  const { user } = authCtx;
  const { cartItems = [], updateQuantity } = cartCtx;
  const { setting } = settingsCtx || {};

  useDarkMode();
  const { isLoading } = useSearch({ onSearch: (query) => console.log('Searching for:', query) });
  const { isMenuOpen, toggleSidebar } = useSidebarState(sidebarCtx);
  const [panel, setPanel] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0), [cartItems]);
  const closeCart = useCallback(() => setPanel(null), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { pathname } = location;
  const isHome = ['/', '/en', '/fr'].includes(pathname);
  const headerHeight = isHome ? 'h-14 md:h-16' : 'h-16';

  const triggerSearch = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('search:focus'));
    } catch {
      window.dispatchEvent(new Event('search:focus'));
    }
  }, []);

  return (
    <>
      <TopStrip />
      <header
        style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }}
        className={`w-full sticky top-0 z-[100] ${headerHeight} bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b dark:border-slate-800 transition-all duration-300 ${scrolled ? 'shadow-2xl bg-white/98 dark:bg-slate-950/98' : 'shadow bg-white/90 dark:bg-slate-950/90'} ${className}`}
        dir="rtl"
      >
        {isLoading && (
          <div className="absolute top-0 left-0 w-full h-1 z-[1300]">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-pulse rounded-b" style={{ width: '100%' }} />
          </div>
        )}

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 px-3 py-1 rounded bg-amber-500 text-white"
        >
          {t('Skip to content')}
        </a>

        <div className="relative max-w-full sm:max-w-[1200px] mx-auto w-full h-full px-2 sm:px-4 md:px-6 lg:px-10 grid grid-cols-12 items-center gap-1 sm:gap-2 md:gap-4">
          {/* يسار الهيدر */}
          <div className="col-span-2 flex items-center gap-3 justify-start">
            <button
              onClick={toggleSidebar}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t('إغلاق القائمة') : t('افتح القائمة')}
              aria-controls="app-sidebar"
              className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 focus-visible:ring-2 focus-visible:ring-emerald-500 min-w-[36px] min-h-[36px] transition-all duration-300"
            >
              {isMenuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
            <Link to="/" aria-label={setting?.siteName || 'Home'} className="flex items-center gap-2">
              <img src={setting?.logoUrl || '/images/site-logo.svg'} alt={setting?.siteName || 'Logo'} className="h-10 w-auto block" />
              <span className="hidden sm:inline-block font-semibold text-base text-slate-800 dark:text-slate-100">
                {setting?.siteName || ''}
              </span>
            </Link>
          </div>

          {/* يمين الهيدر */}
          <div className="col-span-10 flex items-center justify-end gap-2">
            <div className="hidden sm:flex items-center mr-3">
              <div className="w-full max-w-xs sm:max-w-sm md:max-w-lg lg:max-w-xl">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div
                    className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-200/60 dark:border-slate-700/60 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={triggerSearch}
                  >
                    <div className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5">
                      <SearchIcon size={16} className="text-gray-400 dark:text-gray-500" />
                      <span className="flex-1 text-gray-500 dark:text-gray-400 text-sm md:text-base truncate">
                        {locale === 'ar' ? 'البحث عن المنتجات...' : 'Search products...'}
                      </span>
                      <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">/</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile search */}
            <button
              onClick={triggerSearch}
              className="sm:hidden p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 focus-visible:ring-2 focus-visible:ring-emerald-500 min-w-[36px] min-h-[36px] transition-all duration-300"
              aria-label={locale === 'ar' ? 'البحث' : 'Search'}
            >
              <SearchIcon size={16} className="text-gray-600 dark:text-gray-400" />
            </button>

            <HeaderControls
              t={t}
              locale={locale}
              setLocale={setLocale}
              panel={panel}
              setPanel={setPanel}
              cartItems={cartItems}
              cartTotal={cartTotal}
              updateQuantity={updateQuantity}
              user={user}
            />
          </div>
        </div>
      </header>

      {/* Cart panel portal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {panel === 'cart' && (
              <CartPanel
                onClose={closeCart}
                items={cartItems}
                total={cartTotal}
                locale={locale}
                t={t}
                updateQuantity={updateQuantity}
              />
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
});

export default HeaderNav;
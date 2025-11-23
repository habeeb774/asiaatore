// ✅ Updated HeaderNav.jsx with requested modifications
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence } from '../../lib/framerLazy';
import { createPortal } from 'react-dom';
import CartPanel from '../cart/CartPanel';
import HeaderControls from './HeaderControls';
import TopStrip from './TopStrip';
import { MenuIcon, XIcon, SearchIcon } from './HeaderIcons';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useSearch } from '../../hooks/useSearch';
import { useSidebarState } from '../../hooks/useSidebarState';
import { useSidebar } from '../../contexts/SidebarContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

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

  // زيادة ارتفاع الهيدر
  const headerHeight = isHome ? 'h-24 md:h-28' : 'h-24';

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

        <div className="relative max-w-full sm:max-w-[1200px] mx-auto w-full h-full px-4 grid grid-cols-12 items-center">

          {/* زر القائمة — يظهر فقط على الشاشات الصغيرة */}
          <div className="col-span-2 flex items-center sm:hidden">
            <button
              onClick={toggleSidebar}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t('إغلاق القائمة') : t('افتح القائمة')}
              aria-controls="app-sidebar"
              className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
            >
              {isMenuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>

          {/* الشعار في المنتصف مع اسم الشركة */}
          <div className="col-span-8 flex flex-col items-center justify-center text-center select-none pointer-events-auto">
            <Link to="/" className="flex flex-col items-center">
              <img
                src={setting?.logoUrl || '/images/site-logo.svg'}
                alt={setting?.siteName || 'Logo'}
                className="h-14 md:h-16 w-auto mb-1"
              />
              <span className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100">
                شركة منفذ آسيا التجارية
              </span>
            </Link>
          </div>

          {/* عناصر التحكم — تبقى على اليمين */}
          <div className="col-span-2 flex items-center justify-end gap-2">
            <button
              onClick={triggerSearch}
              className="sm:hidden p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border shadow-sm"
            >
              <SearchIcon size={18} />
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
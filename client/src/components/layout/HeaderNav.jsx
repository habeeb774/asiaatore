// ✅ Updated HeaderNav.jsx with requested modifications
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
const defaultCart = () => ({ cartItems: [] });

export const HeaderNav = React.memo(function HeaderNav({ className = '' }) {
  const location = useLocation();
  const langCtx = useLanguage() || defaultLanguage();
  const authCtx = useAuth() || defaultAuth();
  const cartCtx = useCart() || defaultCart();
  const settingsCtx = useSettings();
  const sidebarCtx = useSidebar();

  const { t, locale, setLocale } = langCtx;
  const { user } = authCtx;
  const { cartItems = [] } = cartCtx;
  const { setting } = settingsCtx || {};
  const siteTagline = setting?.siteTagline;

  useDarkMode();
  const { isLoading } = useSearch({ onSearch: (query) => console.log('Searching for:', query) });
  const { isMenuOpen, toggleSidebar } = useSidebarState(sidebarCtx);
  const [scrolled, setScrolled] = useState(false);

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

        <div className="relative mx-auto flex h-full w-full max-w-full px-4 flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:max-w-[1200px] lg:flex-nowrap">

          {/* Left Section: Mobile Menu Toggle */}
          <div className="order-1 flex items-center lg:hidden">
            <button
              onClick={toggleSidebar}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? t('إغلاق القائمة') : t('افتح القائمة')}
              aria-controls="app-sidebar"
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>

          {/* Center Section */}
          <div className="order-3 w-full text-center text-sm font-medium text-slate-600 dark:text-slate-300 md:order-2 md:w-auto md:flex-1">
            {siteTagline || (t('nav.taglineFallback') !== 'nav.taglineFallback' ? t('nav.taglineFallback') : null)}
          </div>

          {/* Right Section: Controls */}
          <div className="order-2 flex flex-1 items-center justify-end gap-2.5 md:order-3">
            <HeaderControls
              t={t}
              locale={locale}
              setLocale={setLocale}
              cartItems={cartItems}
              user={user}
              triggerSearch={triggerSearch}
            />
          </div>
        </div>
      </header>
    </>
  );
});

export default HeaderNav;
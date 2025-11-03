// Refactored Header + Sidebar bundle with single dark mode toggle
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from '../../lib/framerLazy';
// Small inline icons to avoid pulling the entire icon pack into the header
const MenuIcon = ({ size = 24, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const XIcon = ({ size = 24, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const SearchIcon = ({ size = 20, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
import { createPortal } from 'react-dom';
import { User as UserIcon } from 'lucide-react';
import CartPanel from '../cart/CartPanel';
import TopNav from './TopNav';
import HeaderControls from './HeaderControls';
import TopStrip from './TopStrip';
import SafeImage from '../common/SafeImage';
import { useSidebar, SidebarProvider } from '../../context/SidebarContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

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
  const langCtx = useLanguage() || resolveMaybeHook('__useLanguage__', defaultLanguage);
  const authCtx = useAuth() || resolveMaybeHook('__useAuth__', defaultAuth);
  const cartCtx = useCart() || resolveMaybeHook('__useCart__', defaultCart);
  const sidebarCtx = useSidebar();
  const { t, locale, setLocale } = langCtx;
  const { user } = authCtx;
  const { cartItems = [], updateQuantity } = cartCtx;
  const { setting } = useSettings() || {};

  const logoSrc = useMemo(() => setting?.logoUrl || setting?.logo || '/images/site-logo.png', [setting]);

  const [panel, setPanel] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // overlay is handled by centralized SearchOverlay component; open via event
  // Search overlay lifecycle is managed by SearchOverlay component via window events

  // Debounce search (basic)
  useEffect(() => {
    if (!searchQuery) return;
    setIsLoading(true);
    const handler = setTimeout(() => {
      setIsLoading(false);
      // هنا يمكن تنفيذ البحث الفعلي أو استدعاء API
    }, 600);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Single effect to handle dark mode initialization
  useEffect(() => {
    const saved = localStorage.getItem('dark-mode') === 'true';
    setDarkMode(saved);
    document.body.classList.toggle('dark-mode', saved);
    document.body.classList.toggle('light-mode', !saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('dark-mode', darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);

  const cartBtnRef = useRef(null);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + (i.quantity || 1), 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0), [cartItems]);

  const openCart = useCallback(() => setPanel('cart'), []);
  const closeCart = useCallback(() => setPanel(null), []);

  // Sidebar toggle
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const onToggleSidebar = useCallback(() => {
    if (sidebarCtx && typeof sidebarCtx.toggle === 'function') sidebarCtx.toggle();
    else try { window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { cmd: 'toggle' } })); } catch {}
  }, [sidebarCtx]);

  useEffect(() => {
    if (sidebarCtx && typeof sidebarCtx.open === 'boolean') { setIsMenuOpen(Boolean(sidebarCtx.open)); return; }
    const onState = (e) => { if (e?.detail && typeof e.detail.open === 'boolean') setIsMenuOpen(e.detail.open); };
    window.addEventListener('sidebar:state', onState);
    return () => window.removeEventListener('sidebar:state', onState);
  }, [sidebarCtx]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { pathname } = location;
  const isActive = useCallback((to) => pathname === to || pathname.startsWith(to + '/'), [pathname]);
  const isHome = ['/', '/en', '/fr'].includes(pathname);
  const headerHeight = isHome ? 'h-14 md:h-16' : 'h-16';

  return (
    <>
      {/* Top strip with promotions (if enabled) */}
      <TopStrip />
      <header className={`w-full sticky top-0 z-[1200] ${headerHeight} bg-gradient-to-b from-white/95 via-white/90 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/90 backdrop-blur border-b dark:border-slate-800 transition-shadow transition-colors duration-300 ${scrolled ? 'shadow-2xl' : 'shadow'} ${className}`} dir="rtl">
      {/* شريط تحميل أعلى الهيدر عند البحث */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-[1300]">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-pulse rounded-b" style={{width:'100%'}} />
        </div>
      )}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 px-3 py-1 rounded bg-amber-500 text-white">{t('Skip to content')}</a>
  <div className="relative max-w-full sm:max-w-[1200px] mx-auto w-full h-full px-2 sm:px-6 md:px-10 grid grid-cols-3 items-center gap-3 sm:gap-6 transition-colors duration-300">
        {/* يسار الهيدر: شريط البحث وروابط التصفح + الحساب */}
        <div className="col-start-1 col-end-2 flex items-center gap-2">
          <div
            className="w-full max-w-[420px] flex items-center group relative"
            style={{
              background: 'rgba(255,255,255,0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '2rem',
              boxShadow: '0 4px 24px 0 rgba(16,38,57,0.08)',
              border: 'none',
              padding: '0.25rem 0.5rem',
              minHeight: '48px',
              transition: 'box-shadow .25s cubic-bezier(.4,1.3,.5,1), background .25s',
            }}
          >
            {/* removed duplicate mobile search button to avoid double icons */}
            <div className="relative flex-1 flex items-center items-stretch gap-2">
              {/* compact icon-only search in the top bar; opens overlay on click */}
              <button
                type="button"
                onClick={() => { try { window.dispatchEvent(new CustomEvent('search:focus')); } catch { window.dispatchEvent(new Event('search:focus')); } }}
                className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={t('فتح البحث') || 'فتح البحث'}
              >
                <SearchIcon size={20} className="text-slate-500" />
              </button>

              {/* profile / login icon next to search */}
              <Link
                to={user ? '/account/profile' : '/login'}
                aria-label={user ? (t('profile') || 'Profile') : (t('login') || 'Login')}
                className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <UserIcon size={18} className="text-sky-600 dark:text-sky-300" />
              </Link>

              {/* Note: overlay is centralized; keep no inline input here for visual simplicity */}
            </div>
          </div>
          <div className="ml-3 hidden sm:flex">
            <HeaderControls t={t} locale={locale} setLocale={setLocale} panel={panel} setPanel={setPanel} cartItems={cartItems} cartTotal={cartTotal} updateQuantity={updateQuantity} user={user} />
          </div>
        </div>
        {/* وسط الهيدر: شعار الموقع */}
        <div className="col-start-2 col-end-3 flex justify-center">
          <Link to="/" className="block" aria-label={setting?.siteNameAr || setting?.siteNameEn || 'Home'}>
            <div className="w-[150px] h-[48px] flex items-center justify-center overflow-hidden" style={{minWidth:150}}>
              <SafeImage src={logoSrc} alt={setting?.siteNameAr || setting?.siteNameEn || 'Logo'} className="h-[40px] w-auto object-contain drop-shadow cursor-pointer" />
            </div>
          </Link>
        </div>
        <div className="col-start-2 col-end-3 hidden sm:flex justify-center mt-12">
          <nav className="w-full flex items-center justify-center"><TopNav t={t} isActive={isActive} /></nav>
        </div>
        {/* يسار الهيدر: سلة وتسجيل الدخول/الحساب */}
        <div className="col-start-3 col-end-4 flex items-center justify-end gap-2 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t('إغلاق القائمة') : t('افتح القائمة')}
            aria-controls="site-sidebar"
            className="p-3 rounded-xl md:hidden bg-slate-50 dark:bg-slate-800 border shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-500 min-w-[44px] min-h-[44px] transition-all duration-300"
          >
            {isMenuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
          </button>
          {/* mobile-only header controls removed to avoid duplicate profile icon next to sidebar */}
        </div>
      </div>
      {/* SearchOverlay component is mounted separately and listens for 'search:focus' events */}

      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{panel === 'cart' && <CartPanel onClose={closeCart} items={cartItems} total={cartTotal} locale={locale} t={t} updateQuantity={updateQuantity} />}</AnimatePresence>, document.body)}
      </header>
    </>
  );
});

export default HeaderNav;

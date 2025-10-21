// Refactored Header + Sidebar bundle with single dark mode toggle
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Menu, X, BookOpen, Package, BadgePercent, Store, ShoppingCart } from 'lucide-react';
import { createPortal } from 'react-dom';
import CartPanel from '../cart/CartPanel';
import TopNav from './TopNav';
import HeaderControls from './HeaderControls';
import { useSidebar, SidebarProvider } from '../../context/SidebarContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const defaultLanguage = () => ({ t: (k) => k, locale: 'en', setLocale: () => {} });
const defaultAuth = () => ({ user: null, logout: () => {} });
const defaultCart = () => ({ cartItems: [], updateQuantity: () => {}, removeFromCart: () => {} });
const defaultSettings = () => ({ setting: {} });

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
  const { setting } = resolveMaybeHook('__useSettings__', defaultSettings);

  const logoSrc = useMemo(() => setting?.logoUrl || setting?.logo || '/images/site-logo.png', [setting]);

  const [panel, setPanel] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

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
    <header className={`w-full sticky top-0 z-[1200] ${headerHeight} bg-gradient-to-b from-white/95 via-white/90 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/90 backdrop-blur border-b dark:border-slate-800 transition-shadow transition-colors duration-300 ${scrolled ? 'shadow-2xl' : 'shadow'} ${className}`} dir="rtl">
      {/* شريط تحميل أعلى الهيدر عند البحث */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 z-[1300]">
          <div className="h-full bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-400 animate-pulse rounded-b" style={{width:'100%'}} />
        </div>
      )}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 px-3 py-1 rounded bg-amber-500 text-white">{t('Skip to content')}</a>
  <div className="relative max-w-full sm:max-w-[1200px] mx-auto w-full h-full px-2 sm:px-6 md:px-10 flex items-center justify-between gap-3 sm:gap-6 flex-row-reverse rtl:flex-row transition-colors duration-300">
        {/* يمين الهيدر: شعار وزر القائمة */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
          <button onClick={onToggleSidebar} aria-expanded={isMenuOpen} aria-label="Toggle menu" className="p-3 rounded-xl md:hidden bg-slate-50 dark:bg-slate-800 border shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-500 min-w-[44px] min-h-[44px] transition-all duration-300">
            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
          <a href="/" onClick={e => { e.preventDefault(); window.location.href = '/'; }} style={{display:'block'}}>
            <img src={logoSrc} alt={setting?.siteNameEn || 'Logo'} className="h-9 w-auto max-w-[80px] sm:max-w-[140px] object-contain drop-shadow cursor-pointer" />
          </a>
        </div>
        {/* وسط الهيدر: شريط البحث وروابط التصفح */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 w-full">
          {/* شريط البحث */}
          <div
            className="w-full max-w-[420px] mx-auto flex items-center group relative"
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
            {/* زر البحث للموبايل */}
            <button
              type="button"
              className="block sm:hidden p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/70 dark:bg-slate-900/80 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-800 shadow-md transition-all duration-200 mr-1"
              aria-label={t('بحث') || 'بحث'}
              onClick={() => searchInputRef.current && searchInputRef.current.focus()}
              style={{ boxShadow: '0 2px 8px 0 rgba(16,38,57,0.10)' }}
            >
              <Search size={22} />
            </button>
            <div className="relative flex-1 flex items-center">
              <Search size={22} className="hidden sm:block text-slate-400 mr-2 transition-colors group-focus-within:text-emerald-500 group-hover:text-emerald-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('ابحث عن منتج أو قسم...') || 'ابحث عن منتج أو قسم...'}
                className="flex-1 bg-transparent outline-none border-0 text-base px-2 py-1 text-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300"
                style={{
                  minWidth: 0,
                  transition: 'all .35s cubic-bezier(.4,1.3,.5,1)',
                  borderRadius: '2rem',
                  background: 'transparent',
                  boxShadow: 'none',
                  fontWeight: 500,
                  fontSize: '1.08rem',
                  paddingLeft: '0.5rem',
                  paddingRight: searchQuery ? '2.2rem' : '0.5rem',
                }}
                onFocus={e => e.target.parentElement?.parentElement?.classList.add('ring-2','ring-emerald-400')}
                onBlur={e => e.target.parentElement?.parentElement?.classList.remove('ring-2','ring-emerald-400')}
              />
              {searchQuery && (
                <button
                  onClick={()=>setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/80 dark:bg-slate-900/80 shadow"
                  tabIndex={-1}
                  aria-label="مسح البحث"
                  style={{ boxShadow: '0 2px 8px 0 rgba(16,38,57,0.10)' }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>
          {/* روابط التصفح */}
          <nav className="w-full flex items-center justify-center hidden sm:flex"><TopNav t={t} isActive={isActive} /></nav>
        </div>
        {/* يسار الهيدر: سلة وتسجيل الدخول/الحساب */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <HeaderControls t={t} locale={locale} setLocale={setLocale} panel={panel} setPanel={setPanel} cartItems={cartItems} cartTotal={cartTotal} updateQuantity={updateQuantity} user={user} />
        </div>
      </div>
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>{panel === 'cart' && <CartPanel onClose={closeCart} items={cartItems} total={cartTotal} locale={locale} t={t} updateQuantity={updateQuantity} />}</AnimatePresence>, document.body)}
    </header>
  );
});

export default HeaderNav;

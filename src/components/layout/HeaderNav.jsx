/*
  HeaderSidebar_Tailwind_FramerMotion.jsx
  Tailwind + Framer Motion Header + Sidebar bundle with safe hook fallbacks.
*/
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Menu, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import CartPanel from '../cart/CartPanel';
import TopNav from './TopNav';
import HeaderControls from './HeaderControls';
import { useSidebar, SidebarProvider } from '../../context/SidebarContext';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

/* (Removed local SidebarContext bridge – now using shared SidebarContext from src/context/SidebarContext.jsx) */

/* --------------------------- Safe hook resolution --------------------------- */
function resolveMaybeHook(name, fallbackFactory) {
  try {
    const v = typeof window !== 'undefined' ? window[name] : undefined;
    if (!v) return fallbackFactory();
    if (typeof v === 'function') {
      try { const res = v(); if (res) return res; } catch (e) { /* ignore */ }
    }
    if (typeof v === 'object') return v;
    return fallbackFactory();
  } catch (e) {
    return fallbackFactory();
  }
}

const defaultLanguage = () => ({ t: (k) => k, locale: 'en', setLocale: () => {} });
const defaultAuth = () => ({ user: null, logout: () => {} });
const defaultCart = () => ({ cartItems: [], updateQuantity: () => {}, removeFromCart: () => {} });
const defaultSettings = () => ({ setting: {} });

const formatPrice = (n, locale = 'en') => {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }).format(n || 0);
  } catch (e) {
    return (n || 0).toFixed(2) + ' SAR';
  }
};

/* --------------------------- HeaderNav --------------------------- */
export const HeaderNav = React.memo(function HeaderNav({ className = '' }) {
  const location = (() => { try { return useLocation(); } catch (e) { return { pathname: '/' }; } })();
  // Prefer real contexts; fall back to safe resolver for bundle compatibility
  const langCtx = (() => { try { return useLanguage(); } catch { return null; } })();
  const authCtx = (() => { try { return useAuth(); } catch { return null; } })();
  const cartCtx = (() => { try { return useCart(); } catch { return null; } })();
  const sidebarCtx = (() => { try { return useSidebar(); } catch { return null; } })();
  const { t, locale, setLocale } = langCtx || resolveMaybeHook('__useLanguage__', defaultLanguage);
  const { user } = authCtx || resolveMaybeHook('__useAuth__', defaultAuth);
  const { cartItems = [], updateQuantity, removeFromCart } = cartCtx || resolveMaybeHook('__useCart__', defaultCart);
  const { setting } = resolveMaybeHook('__useSettings__', defaultSettings);

  const [panel, setPanel] = useState(null);
  const cartCount = useMemo(() => Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0, [cartItems]);
  const cartTotal = useMemo(() => Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0) : 0, [cartItems]);
  const cartBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setPanel(null); };
    window.addEventListener('keydown', onKey);
    const onCartOpen = () => setPanel('cart');
    const onCartClose = () => setPanel(null);
    try {
      window.addEventListener('cart:open', onCartOpen);
      window.addEventListener('cart:close', onCartClose);
    } catch {}
    return () => {
      window.removeEventListener('keydown', onKey);
      try {
        window.removeEventListener('cart:open', onCartOpen);
        window.removeEventListener('cart:close', onCartClose);
      } catch {}
    };
  }, []);

  useEffect(() => {
    const el = cartBtnRef.current;
    if (!el || typeof el.animate !== 'function') return;
    try {
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1)' }
      );
    } catch (e) {}
  }, [cartCount]);

  // Sidebar state via context with backward-compatible event bridge
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const onToggleSidebar = useCallback(() => {
    if (sidebarCtx && typeof sidebarCtx.toggle === 'function') {
      // Prefer context when available to avoid double toggles
      sidebarCtx.toggle();
    } else {
      // Fallback only: emit legacy event when context is not present
      try { window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { cmd: 'toggle' } })); } catch {}
    }
  }, [sidebarCtx]);
  useEffect(() => {
    // If context is present, sync local icon state from it
    if (sidebarCtx && typeof sidebarCtx.open === 'boolean') {
      setIsMenuOpen(Boolean(sidebarCtx.open));
      return;
    }
    // Fallback: listen to legacy state event
    const onState = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean') setIsMenuOpen(e.detail.open);
    };
    window.addEventListener('sidebar:state', onState);
    return () => window.removeEventListener('sidebar:state', onState);
  }, [sidebarCtx]);
  const openCart = useCallback(() => setPanel('cart'), []);
  const closeCart = useCallback(() => setPanel(null), []);

  // Elevate header when scrolled
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const { pathname } = location;
  const isActive = useCallback((to) => pathname === to || pathname.startsWith(to + '/'), [pathname]);

  const isHome = (() => {
    try {
      const p = location?.pathname || '/';
      return p === '/' || p === '/en' || p === '/fr';
    } catch { return false; }
  })();
  const headerHeight = isHome ? 'h-14 md:h-16' : 'h-16';

  return (
    <header className={`w-full flex items-center justify-between px-4 md:px-6 ${headerHeight} sticky top-0 z-[1100] bg-white/85 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b dark:border-slate-800 transition-shadow ${scrolled ? 'shadow-sm' : ''} ${className}`}>
      {/* Skip to content for a11y */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[2000] px-3 py-1 rounded bg-amber-500 text-white">{t('Skip to content') || 'Skip to content'}</a>
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} aria-expanded={isMenuOpen} aria-label="Toggle menu" className="p-2 rounded-lg md:hidden bg-slate-50 dark:bg-slate-800 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-2"><Home size={20} /></div>
          <div className="hidden sm:block">
            <div className="font-semibold text-slate-900 dark:text-slate-100">{(setting && setting.siteNameEn) || 'My Store'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{(setting && setting.tagline) || ''}</div>
          </div>
        </Link>
      </div>

      <TopNav t={t} isActive={isActive} />

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

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {panel === 'cart' && (
            <CartPanel onClose={closeCart} items={cartItems} total={cartTotal} locale={locale} t={t} updateQuantity={updateQuantity} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
});

/* --------------------------- SidebarNav --------------------------- */
export const SidebarNav = React.memo(function SidebarNav({ className = '' }) {
  const sidebar = useSidebar ? useSidebar() : { open: false, toggle: () => {} };
  const { open: sidebarOpen, toggle: toggleSidebar } = sidebar || { open: false, toggle: () => {} };
  const location = (() => { try { return useLocation(); } catch (e) { return { pathname: '/' }; } })();
  const { pathname } = location;
  const { locale } = resolveMaybeHook('__useLanguage__', defaultLanguage);
  const { user } = resolveMaybeHook('__useAuth__', defaultAuth);
  const { setting } = resolveMaybeHook('__useSettings__', defaultSettings);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => { try { const saved = localStorage.getItem('sb_collapsed'); if (saved != null) setCollapsed(saved === '1'); } catch (e) {} }, []);
  useEffect(() => { try { localStorage.setItem('sb_collapsed', collapsed ? '1' : '0'); } catch {} }, [collapsed]);

  const isAdmin = user?.role === 'admin';

  const coreNav = useMemo(() => ([
    { to: '/', label: { en: 'Home', ar: 'الرئيسية' }, icon: Home },
    { to: '/catalog', label: { en: 'Catalog', ar: 'الكتالوج' }, icon: BookOpen },
    { to: '/products', label: { en: 'Products', ar: 'المنتجات' }, icon: Package },
    { to: '/offers', label: { en: 'Offers', ar: 'العروض' }, icon: BadgePercent },
    { to: '/stores', label: { en: 'Stores', ar: 'المتاجر' }, icon: Store },
  ]), []);

  const dynamicNav = useMemo(() => {
    const nav = [...coreNav];
    if (user) nav.push({ to: '/my-orders', label: { en: 'My Orders', ar: 'طلباتي' }, icon: ShoppingCart });
    if (user?.role === 'seller' || user?.role === 'admin') nav.push({ to: '/seller/kyc', label: { en: 'Seller KYC', ar: 'توثيق البائع' }, icon: Package });
    return nav;
  }, [coreNav, user]);

  const mobile = typeof window !== 'undefined' && window.innerWidth <= 980;

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 transition-transform ${mobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'} ${collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r dark:border-slate-800 ${className}`} aria-label="Main sidebar">
        <div className="h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{(setting && setting.siteNameEn) || 'My Store'}</div>
              <div className="text-xs text-slate-500 hidden md:block">{(setting && setting.tagline) || ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => mobile ? toggleSidebar() : setCollapsed(c => !c)} className="p-2 rounded-md border bg-slate-50 dark:bg-slate-800">
                {mobile ? (sidebarOpen ? <X size={16} /> : <Menu size={16} />) : (collapsed ? <X size={16} /> : <Menu size={16} />)}
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-auto">
            <ul className="flex flex-col gap-2">
              {dynamicNav.map(item => {
                const Icon = item.icon;
                const active = pathname === item.to || pathname.startsWith(item.to + '/');
                return (
                  <li key={item.to}>
                    <Link to={item.to} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${active ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400' : ''}`}>
                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800"><Icon size={18} /></div>
                      <div className={`flex-1 text-sm truncate ${collapsed ? 'hidden' : ''}`}>{item.label[locale] || item.label.en}</div>
                      {!collapsed && item.badge && <div className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded">{item.badge}</div>}
                    </Link>
                  </li>
                );
              })}

              {isAdmin && (
                <>
                  <li className="mt-4 text-xs text-amber-500 font-semibold">Admin</li>
                  <li>
                    <Link to="/admin" aria-current={pathname.startsWith('/admin') ? 'page' : undefined} className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${pathname.startsWith('/admin') ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400' : ''}`}>
                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800"><Home size={18} /></div>
                      <div className={`${collapsed ? 'hidden' : ''}`}>Dashboard</div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/orders" aria-current={pathname.startsWith('/admin/orders') ? 'page' : undefined} className={`flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${pathname.startsWith('/admin/orders') ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400' : ''}`}>
                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800"><ShoppingCart size={18} /></div>
                      <div className={`${collapsed ? 'hidden' : ''}`}>Orders</div>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <div className="mt-4 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <div className={`${collapsed ? 'hidden' : ''}`}>v1.0</div>
              <div className="text-right">
                {user && <div className="text-xs">{collapsed ? user.role : `Role: ${user.role}`}</div>}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <AnimatePresence>
        {mobile && sidebarOpen && (
          <motion.div onClick={toggleSidebar} initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-30" />
        )}
      </AnimatePresence>
    </>
  );
});

/* --------------------------- Convenience bundle (default export) --------------------------- */
export function HeaderSidebarBundle({ className = '' }) {
  return (
    <SidebarProvider>
      <HeaderNav className={className} />
      <SidebarNav />
    </SidebarProvider>
  );
}

export default HeaderNav;

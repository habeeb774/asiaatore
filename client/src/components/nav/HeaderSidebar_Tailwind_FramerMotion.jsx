/*
  HeaderSidebar_Tailwind_FramerMotion.jsx
  Tailwind + Framer Motion Header + Sidebar bundle with safe hook fallbacks.
*/
import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { Home, BookOpen, Package, BadgePercent, Store, Menu, X, ShoppingCart, User, Sun } from 'lucide-react';
import { createPortal } from 'react-dom';

/* --------------------------- Sidebar Context Bridge --------------------------- */
const SidebarContext = createContext();
export const SidebarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen(v => !v), []);
  const openSidebar = useCallback(() => setOpen(true), []);
  const closeSidebar = useCallback(() => setOpen(false), []);
  return (
    <SidebarContext.Provider value={{ open, toggle, openSidebar, closeSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
export const useSidebar = () => useContext(SidebarContext);

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

// Top-level safe wrappers that call React hooks inside a try/catch
// so components can always call these hooks at top-level (rules-of-hooks).
function useSafeSidebar() {
  try {
    return useSidebar();
  } catch (e) {
    return { open: false, toggle: () => {}, openSidebar: () => {}, closeSidebar: () => {} };
  }
}

function useSafeLocation() {
  try {
    return useLocation();
  } catch (e) {
    return { pathname: '/' };
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
  const sidebar = useSafeSidebar();
  const { open, toggle } = sidebar || { open: false, toggle: () => {} };
  const location = useSafeLocation();
  const { t, locale, setLocale } = resolveMaybeHook('__useLanguage__', defaultLanguage);
  const { user } = resolveMaybeHook('__useAuth__', defaultAuth);
  const { cartItems = [], updateQuantity, removeFromCart } = resolveMaybeHook('__useCart__', defaultCart);
  const { setting } = resolveMaybeHook('__useSettings__', defaultSettings);
  const pathname = location?.pathname || '/';
  // Treat locale root paths as home as well (e.g. /, /en, /ar, /fr)
  const isHome = pathname === '/' || /^\/(en|ar|fr)(\/)?$/.test(pathname);

  const [panel, setPanel] = useState(null);
  const cartCount = useMemo(() => Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0, [cartItems]);
  const cartTotal = useMemo(() => Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0) : 0, [cartItems]);
  const cartBtnRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setPanel(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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

  const onToggleSidebar = useCallback(() => toggle && toggle(), [toggle]);
  const openCart = useCallback(() => setPanel('cart'), []);
  const closeCart = useCallback(() => setPanel(null), []);

  return (
    <header className={`w-full flex items-center justify-between px-4 md:px-6 h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 ${className}`}>
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} aria-label="Toggle menu" className="p-2 rounded-lg md:hidden bg-slate-50 dark:bg-slate-800 border">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-md bg-slate-100 dark:bg-slate-800 p-2"><Home size={20} /></div>
          {!isHome && (
            <div className="hidden sm:block">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{(setting && setting.siteNameEn) || 'My Store'}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{(setting && setting.tagline) || ''}</div>
            </div>
          )}
        </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-4">
        <Link to="/catalog" className="text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900">{t('Catalog') || 'Catalog'}</Link>
        <Link to="/products" className="text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900">{t('Products') || 'Products'}</Link>
        <Link to="/offers" className="text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900">{t('Offers') || 'Offers'}</Link>
      </nav>

      <div className="flex items-center gap-3">
        <select value={locale} onChange={e => setLocale && setLocale(e.target.value)} className="hidden sm:block text-sm border rounded px-2 py-1 bg-transparent">
          <option value="en">EN</option>
          <option value="ar">AR</option>
          <option value="fr">FR</option>
        </select>

        <button aria-label="Toggle theme" className="p-2 rounded-md bg-slate-50 dark:bg-slate-800 border hidden sm:inline-flex"><Sun size={16} /></button>

        <button ref={cartBtnRef} onClick={openCart} aria-expanded={panel === 'cart'} aria-controls="cart-panel" className="relative p-2 rounded-md border bg-white dark:bg-slate-900">
          <ShoppingCart size={18} />
          {cartCount > 0 && (<span className="absolute -top-1 -right-1 text-xs font-semibold bg-amber-500 text-white rounded-full w-5 h-5 flex items-center justify-center">{cartCount}</span>)}
        </button>

        {!resolveMaybeHook('__useAuth__', defaultAuth).user ? (
          <Link to="/login" className="text-sm px-3 py-1 border rounded">{t('Login') || 'Login'}</Link>
        ) : (
          <Link to="/account/profile" className="flex items-center gap-2 px-3 py-1 border rounded text-sm"><User size={16} /><span className="hidden sm:inline-block">{resolveMaybeHook('__useAuth__', defaultAuth).user.name || (resolveMaybeHook('__useAuth__', defaultAuth).user.email || '').split('@')[0]}</span></Link>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {panel === 'cart' && (
            <motion.aside id="cart-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.22 }} className="fixed right-4 top-20 w-96 bg-white dark:bg-slate-900 border rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-semibold">{t('Cart') || 'Cart'}</h3>
                <button onClick={closeCart} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
              </div>
              <div className="p-4 max-h-64 overflow-auto">
                {cartItems && cartItems.length ? (
                  <ul className="flex flex-col gap-3">
                    {cartItems.map(item => (
                      <li key={item.id} className="flex items-center gap-3">
                        <img src={item.images?.[0] || item.image || '/images/hero-image.svg'} alt={item.name || ''} className="w-14 h-14 object-cover rounded-md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name || item.title}</div>
                          <div className="text-xs text-slate-500">{formatPrice(item.price || item.salePrice || 0, locale)} × {item.quantity || 1}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-sm font-semibold">{formatPrice((item.price || item.salePrice || 0) * (item.quantity || 1), locale)}</div>
                          <div className="flex gap-1">
                            <button onClick={() => updateQuantity && updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))} className="px-2 py-1 border rounded">-</button>
                            <span className="px-2 py-1 border rounded">{item.quantity || 1}</span>
                            <button onClick={() => updateQuantity && updateQuantity(item.id, (item.quantity || 1) + 1)} className="px-2 py-1 border rounded">+</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">{t('Cart is empty') || 'Cart is empty'}</div>
                )}
              </div>
              <div className="p-4 border-t dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-slate-600">{t('Total') || 'Total'}</div>
                  <div className="font-semibold">{formatPrice(cartTotal, locale)}</div>
                </div>
                <div className="flex gap-2">
                  <Link to="/cart" onClick={closeCart} className="w-1/2 text-center py-2 border rounded">{t('View cart') || 'View cart'}</Link>
                  <Link to="/checkout" onClick={closeCart} className="w-1/2 text-center py-2 bg-amber-500 text-white rounded">{t('Checkout') || 'Checkout'}</Link>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
});

/* --------------------------- SidebarNav --------------------------- */
export const SidebarNav = React.memo(function SidebarNav({ className = '' }) {
  const sidebar = useSafeSidebar();
  const { open: sidebarOpen, toggle: toggleSidebar } = sidebar || { open: false, toggle: () => {} };
  const location = useSafeLocation();
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
    //{ to: '/stores', label: { en: 'Stores', ar: 'المتاجر' }, icon: Store },
  ]), []);

  const dynamicNav = useMemo(() => {
    const nav = [...coreNav];
    if (user) nav.push({ to: '/my-orders', label: { en: 'My Orders', ar: 'طلباتي' }, icon: ShoppingCart });
    if (user?.role === 'seller' || user?.role === 'admin') nav.push({ to: '/seller/kyc', label: { en: 'Seller KYC', ar: 'توثيق البائع' }, icon: Package });
    return nav;
  }, [coreNav, user]);

  const mobile = typeof window !== 'undefined' && window.innerWidth <= 980;
  const getLabel = (lbl) => {
    if (!lbl) return '';
    if (typeof lbl === 'string') return lbl;
    try {
      return lbl[locale] || lbl.en || lbl.ar || Object.values(lbl)[0] || '';
    } catch (e) { return String(lbl || ''); }
  };

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
                    <Link to={item.to} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${active ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400' : ''}`}>
                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800"><Icon size={18} /></div>
                      <div className={`flex-1 text-sm truncate ${collapsed ? 'hidden' : ''}`}>{getLabel(item.label)}</div>
                      {!collapsed && item.badge && <div className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded">{item.badge}</div>}
                    </Link>
                  </li>
                );
              })}

              {isAdmin && (
                <>
                  <li className="mt-4 text-xs text-amber-500 font-semibold">Admin</li>
                  <li>
                    <Link to="/admin" className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${pathname.startsWith('/admin') ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400' : ''}`}>
                      <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800"><Home size={18} /></div>
                      <div className={`${collapsed ? 'hidden' : ''}`}>Dashboard</div>
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin/orders" className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${pathname.startsWith('/admin/orders') ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-400' : ''}`}>
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

export default HeaderSidebarBundle;

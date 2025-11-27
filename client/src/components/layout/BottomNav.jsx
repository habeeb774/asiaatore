import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from '../../lib/framerLazy';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid2x2, BadgePercent, ShoppingCart, User, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export default function BottomNav() {
  // Safe wrappers: call hooks at top-level inside small custom hooks so ESLint rules-of-hooks are satisfied
  function useSafeLanguage() {
    try { return useLanguage(); } catch { return { locale: 'ar', t: k => k }; }
  }
  function useSafeAuth() {
    try { return useAuth(); } catch { return { user: null }; }
  }
  function useSafeCart() {
    try { return useCart(); } catch { return { cartItems: [] }; }
  }
  function useSafeLocation() {
    try { return useLocation(); } catch { return { pathname: '/' }; }
  }
  function useSafeNavigate() {
    try { return useNavigate(); } catch { return () => {}; }
  }

  // accept props normally
  const { setPanel } = arguments[0] && typeof arguments[0] === 'object' ? arguments[0] : {};

  const { locale, t } = useSafeLanguage();
  const { user } = useSafeAuth();
  const location = useSafeLocation();
  const navigate = useSafeNavigate();
  const { cartItems = [] } = useSafeCart();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const [pulse, setPulse] = useState(false);

  const prefix = locale && locale !== 'ar' ? `/${locale}` : '';
  const pathname = location?.pathname || '/';
  const cartCount = useMemo(() => Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0, [cartItems]);

  const go = useCallback((to) => navigate(to), [navigate]);
  const goToCart = useCallback(() => {
    const target = `${prefix}/cart`;
    go(target || '/cart');
    if (typeof setPanel === 'function') {
      setPanel(null);
    }
    if (navigator?.vibrate) navigator.vibrate(10);
  }, [go, prefix, setPanel]);

  useEffect(() => {
    if (cartCount > 0) {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 320);
      return () => clearTimeout(timeout);
    }
  }, [cartCount]);

  useEffect(() => {
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(Boolean(mql.matches));
      const onRM = e => setReducedMotion(Boolean(e.matches));
      mql.addEventListener ? mql.addEventListener('change', onRM) : mql.addListener(onRM);
    } catch {}

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (Math.abs(y - lastY.current) > 8) {
        setHidden(y > lastY.current && y > 120);
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let vv;
    let onResize;
    try {
      vv = window.visualViewport;
      if (vv) {
        const baseH = vv.height;
        onResize = () => setHidden(baseH - vv.height > 120);
        vv.addEventListener('resize', onResize);
      }
    } catch {}

    return () => {
      window.removeEventListener('scroll', onScroll);
      try { vv && vv.removeEventListener && onResize && vv.removeEventListener('resize', onResize); } catch {}
    };
  }, []);

  const items = useMemo(() => ([
    { key: 'home', label: (t?.('nav.home') || 'Home'), icon: Home, isActive: pathname === '/' || pathname === '/en' || pathname === '/fr', onClick: () => go(prefix || '/') },
    { key: 'categories', label: locale === 'ar' ? 'التصنيفات' : (t?.('nav.catalog') || 'Categories'), icon: Grid2x2, isActive: pathname.startsWith(`${prefix}/catalog`), onClick: () => go(`${prefix}/catalog`) },
    { key: 'products', label: locale === 'ar' ? 'المنتجات' : (t?.('nav.products') || 'Products'), icon: Package, isActive: pathname.startsWith(`${prefix}/products`), onClick: () => go(`${prefix}/products`) },
    { key: 'offers', label: t?.('nav.offers') || 'Offers', icon: BadgePercent, isActive: pathname.startsWith(`${prefix}/offers`), onClick: () => go(`${prefix}/offers`) },
    { key: 'cart', label: t?.('cart') || 'Cart', icon: ShoppingCart, isActive: pathname === `${prefix}/cart`, onClick: () => goToCart() },
    { key: 'account', label: t?.('nav.account') || 'Account', icon: User, isActive: pathname.startsWith(`${prefix}/account`) || pathname.startsWith(`${prefix}/login`), onClick: () => go(user ? `${prefix}/account/profile` : `${prefix}/login`) }
  ]), [t, prefix, pathname, go, user, goToCart, locale]);

  const navItems = useMemo(() => items.filter(it => it.key !== 'cart'), [items]);
  const navCount = navItems.length || 1;
  const activeIndex = useMemo(() => navItems.findIndex(it => it.isActive), [navItems]);
  const indicatorStyle = useMemo(() => {
    if (activeIndex < 0) return { opacity: 0 };
    const segment = `calc(100% / ${navCount})`;
    if (locale === 'ar') {
      return { width: segment, right: `calc((100% / ${navCount}) * ${activeIndex})` };
    }
    return { width: segment, left: `calc((100% / ${navCount}) * ${activeIndex})` };
  }, [activeIndex, navCount, locale]);

  const NavItem = ({ item }) => {
    const { key, label, icon: Icon, isActive, onClick } = item;
    const getLabel = (val) => {
      if (typeof val === 'string') return val;
      if (!val) return '';
      try {
        // If label is an object like { ar: '...', en: '...' }, prefer current locale
        if (typeof val === 'object') {
          return (val[locale] || val.en || val.ar || Object.values(val)[0] || '') + '';
        }
        return String(val);
      } catch { return '' + val; }
    };
    const displayLabel = getLabel(label);
      const activeColor = key === 'account' ? 'text-sky-500 dark:text-sky-300' : 'text-emerald-600 dark:text-emerald-300';
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
          aria-label={displayLabel || key}
        aria-current={isActive ? 'page' : undefined}
        aria-pressed={isActive}
        data-active={isActive ? '1' : '0'}
        onClick={onClick}
          className={`group relative flex-1 min-w-0 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors ${isActive ? activeColor : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500'}`}
      >
          <span className={`relative grid place-items-center w-11 h-11 rounded-2xl transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-emerald-500/80 via-emerald-500/70 to-sky-500/70 shadow-[0_20px_35px_-18px_rgba(16,185,129,0.9)]' : 'bg-slate-100/70 dark:bg-slate-800/70 border border-white/20 dark:border-white/5 backdrop-blur-sm group-hover:border-emerald-300/40 group-hover:bg-emerald-400/10'}`}>
            {isActive && (
              <motion.span
                layoutId="bottom-nav-icon-glow"
                className="absolute inset-0 rounded-2xl bg-emerald-400/35 blur-lg"
                aria-hidden="true"
              />
            )}
            <Icon size={isActive ? 22 : 20} className={`relative transition-transform duration-300 ${isActive ? 'text-white drop-shadow-sm scale-105' : 'text-slate-600 dark:text-slate-200 group-hover:text-emerald-500'}`} />
          </span>
          <span className="leading-none text-[10px] font-semibold tracking-wide text-slate-600/90 dark:text-slate-200/80 group-hover:text-emerald-500 truncate max-w-[5.5rem]">
            {displayLabel}
          </span>
      </motion.button>
    );
  };

  return (
    <motion.nav
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      role="navigation"
      aria-label={t?.('mobileNavigation') || 'Mobile navigation'}
      initial={false}
      animate={{ y: hidden ? 84 : 0, opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[1050] pointer-events-none"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
        <div className="relative w-full px-3 sm:px-4" style={{ pointerEvents: 'auto' }}>
          <div className="relative flex flex-row justify-between items-stretch gap-1 rounded-[1.75rem] border border-white/40 dark:border-white/10 bg-white/75 dark:bg-slate-950/70 backdrop-blur-2xl shadow-[0_20px_60px_-28px_rgba(15,23,42,0.75)] px-2 py-2 overflow-hidden">
            {activeIndex >= 0 && (
              <motion.span
                layoutId="bottom-nav-active"
                className="absolute inset-y-1 rounded-[1.4rem] bg-gradient-to-br from-emerald-500/14 via-emerald-500/10 to-sky-500/12 border border-emerald-500/25 shadow-[0_18px_40px_-28px_rgba(16,185,129,0.65)]"
                style={indicatorStyle}
                transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              />
            )}
            {navItems.map(it => <NavItem key={it.key} item={it} />)}
        </div>
        {/* Floating FAB cart button */}
        {(() => {
          const cartItem = items.find(it => it.key === 'cart');
          const CartIcon = cartItem.icon;
          return (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.08 }}
              aria-label={(function(){ try { if (typeof cartItem.label === 'string') return cartItem.label; if (cartItem.label && typeof cartItem.label === 'object') return cartItem.label[locale] || cartItem.label.en || cartItem.label.ar || 'cart'; return String(cartItem.label || 'cart'); } catch { return 'cart'; } })()}
              onClick={() => {
                cartItem.onClick();
                setPulse(true);
                setTimeout(() => setPulse(false), 320);
              }}
              animate={pulse ? { boxShadow: '0 0 0 18px rgba(16, 185, 129, 0.28)' } : { boxShadow: '0 22px 45px -20px rgba(16, 185, 129, 0.85)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute md:hidden left-1/2 -translate-x-1/2 z-[1101] w-20 h-20 rounded-[24px] bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 text-white flex items-center justify-center border-4 border-white/80 dark:border-slate-950/90 shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 hover:shadow-[0_24px_50px_-18px_rgba(16,185,129,0.95)] active:scale-95"
              style={{ bottom: 'calc(100% + 12px)', pointerEvents: 'auto' }}
            >
              <CartIcon size={30} className="text-white drop-shadow-[0_6px_14px_rgba(15,118,110,0.7)]" />
              {cartCount > 0 && (
                <motion.span className="absolute -top-2 -right-2 min-w-7 h-7 px-2 rounded-full bg-white text-emerald-600 text-[13px] font-bold shadow-lg border border-emerald-200 dark:border-slate-900">
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          );
        })()}
      </div>
    </motion.nav>
  );
}

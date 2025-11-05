import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { motion } from '../../lib/framerLazy';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid2x2, BadgePercent, ShoppingCart, User, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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
  const { panel, setPanel } = arguments[0] && typeof arguments[0] === 'object' ? arguments[0] : {};

  const { locale, t } = useSafeLanguage();
  const { user } = useSafeAuth();
  const location = useSafeLocation();
  const navigate = useSafeNavigate();
  const { cartItems = [] } = useSafeCart();

  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const [pulse, setPulse] = useState(false);

  const prefix = locale === 'ar' ? '' : `/${locale}`;
  const pathname = location?.pathname || '/';
  const cartCount = useMemo(() => Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0, [cartItems]);

  const go = useCallback((to) => navigate(to), [navigate]);
  // Toggle cart-panel using setPanel
  const openCartSidebar = useCallback(() => {
    if (typeof setPanel === 'function') {
      setPanel(panel === 'cart' ? null : 'cart');
      if (navigator?.vibrate) navigator.vibrate(10);
    }
  }, [panel, setPanel]);

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
    { key: 'cart', label: t?.('cart') || 'Cart', icon: ShoppingCart, isActive: false, onClick: () => openCartSidebar() },
    { key: 'account', label: t?.('nav.account') || 'Account', icon: User, isActive: pathname.startsWith(`${prefix}/account`) || pathname.startsWith(`${prefix}/login`), onClick: () => go(user ? `${prefix}/account/profile` : `${prefix}/login`) }
  ]), [t, prefix, pathname, go, user, openCartSidebar, locale]);

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
      } catch (e) { return '' + val; }
    };
    const displayLabel = getLabel(label);
    const activeColor = key === 'account' ? 'text-sky-600' : 'text-amber-600';
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
  aria-label={displayLabel || key}
        aria-current={isActive ? 'page' : undefined}
        onClick={onClick}
        className={`flex-1 h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive ? activeColor : 'text-slate-700 dark:text-slate-300'}`}
      >
        <Icon size={18} />
        <span className="leading-none">{displayLabel}</span>
      </motion.button>
    );
  };

  return (
    <motion.nav
      dir="rtl"
      role="navigation"
      aria-label={t?.('mobileNavigation') || 'Mobile navigation'}
      initial={false}
      animate={{ y: hidden ? 84 : 0, opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[1050] pointer-events-none"
      style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}
    >
      <div className="relative w-full px-2" style={{ pointerEvents: 'auto' }}>
        <div className="flex flex-row justify-between items-center gap-2 relative rounded-2xl shadow-2xl border border-white/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl w-full">
          {items.filter(it => it.key !== 'cart').map(it => <NavItem key={it.key} item={it} />)}
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
              animate={pulse ? { boxShadow: '0 0 0 12px rgba(251, 191, 36, 0.4)' } : { boxShadow: '0 2px 16px rgba(0,0,0,0.18)' }}
              transition={{ duration: 0.32 }}
              className={`absolute md:hidden left-1/2 -translate-x-1/2 z-[1101] bg-emerald-500 text-white shadow-2xl rounded-full w-20 h-20 flex items-center justify-center border-4 border-emerald-500 dark:border-emerald-500 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 hover:shadow-2xl active:scale-95`}
              style={{ bottom: 'calc(100% + 12px)', pointerEvents: 'auto' }}
            >
              <CartIcon size={38} color="#10b981" />
              {cartCount > 0 && (
                <motion.span className="absolute -top-2 -right-2 min-w-7 h-7 px-2 rounded-full bg-amber-500 text-white text-[13px] font-bold shadow-lg border-2 border-white dark:border-slate-900">
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
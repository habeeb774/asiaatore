import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid2x2, BadgePercent, ShoppingCart, User, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const { locale, t } = (function () { try { return useLanguage(); } catch { return { locale: 'ar', t: (k) => k }; } })();
  const { user } = (function () { try { return useAuth(); } catch { return { user: null }; } })();
  const location = (function () { try { return useLocation(); } catch { return { pathname: '/' }; } })();
  const navigate = (function () { try { return useNavigate(); } catch { return () => {}; } })();
  const { cartItems = [] } = (function () { try { return useCart(); } catch { return { cartItems: [] }; } })();
  const [reducedMotion, setReducedMotion] = useState(false);

  const prefix = locale === 'ar' ? '' : `/${locale}`;
  const pathname = location?.pathname || '/';

  const go = useCallback((to) => navigate(to), [navigate]);
  const openCartSidebar = useCallback(() => {
    try { window.dispatchEvent(new CustomEvent('cart:open')); } catch {}
    try { if (navigator?.vibrate) navigator.vibrate(10); } catch {}
  }, []);

  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
  // Five inline buttons: Home, Categories, Offers, Cart, Account
  const items = useMemo(() => ([
    {
      key: 'home',
      label: (t && (t('nav.home') || t('home'))) || 'Home',
      icon: Home,
      isActive: pathname === '/' || pathname === '/en' || pathname === '/fr',
      onClick: () => go(prefix || '/')
    },
    {
      key: 'categories',
      label: locale === 'ar' ? 'التصنيفات' : ((t && (t('nav.catalog') || t('catalog'))) || 'Categories'),
      icon: Grid2x2,
      isActive: pathname.startsWith(`${prefix}/catalog`),
      onClick: () => go(`${prefix}/catalog`)
    },
    {
      key: 'offers',
      label: (t && (t('nav.offers') || t('offers'))) || 'Offers',
      icon: BadgePercent,
      isActive: pathname.startsWith(`${prefix}/offers`),
      onClick: () => go(`${prefix}/offers`)
    },
    {
      key: 'cart',
      label: (t && (t('cart') || t('nav.cart'))) || 'Cart',
      icon: ShoppingCart,
      // ليس صفحة مخصصة، لكن نبرزها إذا فتحنا السلة الجانبية لاحقاً (هنا نكتفي بإبراز عند الضغط)
      isActive: false,
      onClick: () => openCartSidebar()
    },
    {
      key: 'account',
      label: (t && (t('nav.account') || t('account'))) || 'Account',
      icon: User,
      isActive: pathname.startsWith(`${prefix}/account`) || pathname.startsWith(`${prefix}/login`),
      onClick: () => go(user ? `${prefix}/account/profile` : `${prefix}/login`)
    }
  ]), [t, prefix, pathname, go, user, openCartSidebar, locale]);

  // Hide on scroll down, show on scroll up; also hide when virtual keyboard is open
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    // reduced motion preference
    try {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(Boolean(mql.matches));
      const onRM = (e) => setReducedMotion(Boolean(e.matches));
      if (mql.addEventListener) mql.addEventListener('change', onRM);
      else if (mql.addListener) mql.addListener(onRM);
    } catch {}
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = Math.abs(y - lastY.current);
      if (delta > 8) {
        setHidden(y > lastY.current && y > 120);
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // virtual keyboard: if height shrinks notably, hide the bar
    let vv;
    try {
      vv = window.visualViewport;
      if (vv) {
        const baseH = vv.height;
        const onResize = () => {
          const shrink = baseH - vv.height;
          setHidden(shrink > 120); // threshold
        };
        vv.addEventListener('resize', onResize);
      }
    } catch {}
    return () => {
      window.removeEventListener('scroll', onScroll);
      try { vv && vv.removeEventListener && vv.removeEventListener('resize', onResize); } catch {}
    };
  }, []);

  // Small bounce on FAB when cart count changes
  useEffect(() => {
    // يمكن لاحقاً إضافة وميض خفيف على أيقونة العربة عند تغير العدد
  }, [cartCount]);

  const NavItem = ({ item }) => {
    const { key, label, icon: Icon, isActive, onClick } = item;
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        aria-label={typeof label === 'string' ? label : key}
        aria-current={isActive ? 'page' : undefined}
        onClick={onClick}
        className={`relative w-full h-14 flex flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}
      >
        <span className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${isActive ? 'bg-amber-50/80 dark:bg-amber-500/10 ring-1 ring-amber-200/50 dark:ring-0 shadow-[0_4px_18px_-6px_rgba(246,173,85,0.45)] dark:shadow-none' : ''}`}>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute -inset-1 rounded-[14px] pointer-events-none hidden dark:block bg-[radial-gradient(ellipse_at_center,rgba(246,173,85,0.33)_0%,rgba(246,173,85,0)_70%)] blur-[8px]"
            />
          )}
          <Icon size={18} />
          {key === 'cart' && cartCount > 0 && (
            <motion.span
              key={`badge-${cartCount}`}
              initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
              animate={reducedMotion ? {} : { scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16 }}
              className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] leading-5 text-center font-semibold"
            >
              {cartCount}
            </motion.span>
          )}
        </span>
        <span className="leading-none">{label}</span>
        {isActive && <span className="absolute bottom-0 inset-x-6 h-0.5 rounded-full bg-amber-500" />}
      </motion.button>
    );
  };

  return (
    <motion.nav
      dir="rtl"
      role="navigation"
      aria-label={(t && t('mobileNavigation')) || 'Mobile navigation'}
      initial={false}
      animate={{ y: hidden ? 84 : 0, opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      className="md:hidden fixed bottom-0 inset-x-0 z-[1050] border-t border-white/60 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.15)]"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      <div className="relative max-w-[1100px] mx-auto px-2">
        <div className="grid grid-cols-5">
          {items.map((it) => (
            <NavItem key={it.key} item={it} />
          ))}
        </div>
      </div>
    </motion.nav>
  );
}

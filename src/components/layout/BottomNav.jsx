import React, { useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid2x2, Search, ShoppingCart, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function BottomNav() {
  const { locale, t } = (function () { try { return useLanguage(); } catch { return { locale: 'ar', t: (k) => k }; } })();
  const { user } = (function () { try { return useAuth(); } catch { return { user: null }; } })();
  const location = (function () { try { return useLocation(); } catch { return { pathname: '/' }; } })();
  const navigate = (function () { try { return useNavigate(); } catch { return () => {}; } })();
  const { cartItems = [] } = (function () { try { return useCart(); } catch { return { cartItems: [] }; } })();

  const prefix = locale === 'ar' ? '' : `/${locale}`;
  const pathname = location?.pathname || '/';

  const go = useCallback((to) => navigate(to), [navigate]);
  const openCart = useCallback(() => {
    try { window.dispatchEvent(new CustomEvent('cart:open')); } catch {}
  }, []);
  const goSearch = useCallback(() => {
    try { window.dispatchEvent(new CustomEvent('search:focus')); } catch {}
    go(`${prefix}/products`);
  }, [go, prefix]);

  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
  const items = useMemo(() => ([
    {
      key: 'home',
      label: (t && t('nav.home')) || 'Home',
      icon: Home,
      to: `${prefix || '/'}`,
      isActive: pathname === '/' || pathname === '/en' || pathname === '/fr',
      onClick: () => go(prefix || '/')
    },
    {
      key: 'categories',
      label: (t && t('nav.catalog')) || 'Categories',
  icon: Grid2x2,
      to: `${prefix}/catalog`,
      isActive: pathname.startsWith(`${prefix}/catalog`),
      onClick: () => go(`${prefix}/catalog`)
    },
    {
      key: 'search',
      label: (t && t('nav.search')) || 'Search',
      icon: Search,
      to: `${prefix}/products`,
      isActive: pathname.startsWith(`${prefix}/products`),
      onClick: goSearch
    },
    {
      key: 'cart',
      label: (t && t('cart')) || 'Cart',
      icon: ShoppingCart,
      to: `${prefix}/cart`,
      isActive: pathname.startsWith(`${prefix}/cart`) || false,
      onClick: openCart
    },
    {
      key: 'account',
      label: (t && t('nav.account')) || 'Account',
      icon: User,
      to: user ? `${prefix}/account/profile` : `${prefix}/login`,
      isActive: pathname.startsWith(`${prefix}/account`) || pathname.startsWith(`${prefix}/login`),
      onClick: () => go(user ? `${prefix}/account/profile` : `${prefix}/login`)
    }
  ]), [t, prefix, pathname, go, goSearch, openCart, user]);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[1050] border-t dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <ul className="grid grid-cols-5">
        {items.map(({ key, label, icon: Icon, isActive, onClick, to }) => (
          <li key={key}>
            {/* Use button for actions, Link for pure navigation to aid a11y. Here, we use button to allow cart/search actions. */}
            <button
              type="button"
              aria-label={typeof label === 'string' ? label : key}
              aria-current={isActive ? 'page' : undefined}
              onClick={onClick}
              className={`w-full h-14 flex flex-col items-center justify-center gap-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}
            >
              <span className="relative">
                <Icon size={18} />
                {key === 'cart' && cartCount > 0 && (
                  <span className="absolute -top-2 -right-3 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] leading-4 text-center font-semibold">{cartCount}</span>
                )}
              </span>
              <span className="leading-none">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

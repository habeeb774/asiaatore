import React, { useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';

// safe wrapper hook: calls useTheme but catches when context is not available
function useSafeTheme() {
  try {
    return useTheme();
  } catch (e) {
    return { theme: 'system', setTheme: () => {} };
  }
}

// safe wrapper for sidebar context hook (ensures hook is called at top-level)
function useSafeSidebar() {
  try {
    return useSidebar();
  } catch (e) {
    return {};
  }
}

export default function HeaderControls({ t, locale, setLocale, panel, setPanel, cartItems, cartTotal, updateQuantity, user }) {
  const cartBtnRef = useRef(null);
  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
  const langs = ['ar', 'en', 'fr'];
  const onCycleLanguage = () => {
    if (!setLocale) return;
    const idx = Math.max(0, langs.indexOf(locale));
    const next = langs[(idx + 1) % langs.length];
    setLocale(next);
  };

  useEffect(() => {
    const el = cartBtnRef.current;
    if (!el || typeof el.animate !== 'function') return;
    try {
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
        { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1)' }
      );
    } catch {}
  }, [cartCount]);

  // Theme toggle (cycles: system -> light -> dark)
  const { theme, setTheme } = useSafeTheme();
  const nextTheme = useMemo(() => (theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'), [theme]);
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel = theme === 'dark'
    ? (t?.('themeDark') || 'Dark')
    : theme === 'light'
      ? (t?.('themeLight') || 'Light')
      : (t?.('themeSystemAuto') || 'System (Auto)');
  const _sidebarCtx = useSafeSidebar();
  const { setOpen: openSidebar, open: sidebarOpen } = _sidebarCtx || {};

  return (
  <div className="flex items-center gap-2 sm:gap-3 transition-colors duration-300">
      {/* Sidebar menu button - opens the off-canvas drawer (hidden while drawer is open to avoid duplicate icons) */}
      {/* Hide this menu button on small screens to avoid duplicating the hamburger
          which is rendered in the main header (`HeaderNav`) with its own md:hidden
          button. Keep it visible on md+ so desktop/tablet can still open the drawer. */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => openSidebar?.(true)}
          className="header-menu-button hidden md:inline-flex border rounded bg-white/90 dark:bg-slate-950/90 p-1.5 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={t?.('openMenu') || 'Open menu'}
          data-testid="header-menu-button"
        >
          <Menu size={18} />
        </button>
      )}
      {/* (search button moved next to profile on the right) */}
      {/* زر تغيير اللغة يظهر فقط في الشاشات الكبيرة */}

      

      {/* تم نقل زر تغيير الثيم إلى القائمة الجانبية */}

  {/* زر السلة أصبح في BottomNav فقط */}

      <div className="ml-0 flex items-center gap-2 sm:gap-3">
        {/* Profile / Login first (icon on mobile, text on larger screens) */}
        {!user ? (
          <Link
            to="/login"
            className="border rounded bg-white/90 dark:bg-slate-950/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300 flex items-center justify-center"
            style={{ minWidth: 0, minHeight: 0, padding: 0 }}
          >
            <User size={18} className="block sm:hidden" />
            <span className="hidden sm:inline-block text-sm px-3 py-1">{t('login') || 'Login'}</span>
          </Link>
        ) : (
          <Link to="/account/profile" className="flex items-center gap-2 px-3 py-1 border rounded text-sm bg-white/90 dark:bg-slate-950/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300">
            <User size={16} />
            <span className="hidden sm:inline-block">{user.name || (user.email || '').split('@')[0]}</span>
          </Link>
        )}

        {/* Search button immediately to the right of profile */}
        <button
          type="button"
          onClick={() => { try { window.dispatchEvent(new CustomEvent('search:focus')); } catch { window.dispatchEvent(new Event('search:focus')); } }}
          className="header-search-button border rounded bg-white/90 dark:bg-slate-950/90 p-1.5 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={t?.('openSearch') || 'Open search'}
        >
          <Search size={18} />
        </button>
      </div>
    </div>
  );
}

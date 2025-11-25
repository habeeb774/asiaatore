import React, { useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Sun, Moon, Monitor, Languages, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

function useSafeTheme() {
  try {
    return useTheme();
  } catch {
    return { theme: 'system', setTheme: () => {} };
  }
}

// A consistent base style for all icon buttons in the header
const iconButtonClass = "relative inline-flex items-center justify-center p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-200";

export default function HeaderControls({ t, locale, setLocale, cartItems, user, setPanel, triggerSearch }) {
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
    if (!el || typeof el.animate !== 'function' || cartCount === 0) return;
    try {
      el.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
        { duration: 200, easing: 'ease-in-out' }
      );
    } catch {}
  }, [cartCount]);

  const { theme, setTheme } = useSafeTheme();
  const nextTheme = useMemo(() => (theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'), [theme]);
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel = theme === 'dark' ? t?.('themeDark') || 'الوضع الداكن' : theme === 'light' ? t?.('themeLight') || 'الوضع الفاتح' : t?.('themeSystemAuto') || 'النظام (تلقائي)';

  return (
    <div className="flex items-center gap-2 sm:gap-3 transition-colors duration-300">
      {/* --- Icon Controls Group --- */}
      <button type="button" onClick={triggerSearch} className={iconButtonClass} aria-label={t?.('search') || 'بحث'}>
        <Search size={20} />
      </button>

      <button type="button" onClick={() => setPanel('cart')} className={iconButtonClass} aria-label={t?.('shoppingCart') || 'سلة التسوق'} ref={cartBtnRef}>
        <ShoppingCart size={20} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
            {cartCount}
          </span>
        )}
      </button>

      <button type="button" onClick={onCycleLanguage} className={`${iconButtonClass} hidden md:inline-flex`} aria-label={t?.('changeLanguage') || 'تغيير اللغة'} title={locale === 'ar' ? 'English' : locale === 'en' ? 'Français' : 'العربية'}>
        <Languages size={20} />
      </button>
      
      <button type="button" onClick={() => setTheme(nextTheme)} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label={t?.('toggleTheme') || 'تبديل الثيم'} title={themeLabel}>
        <ThemeIcon size={20} />
      </button>

      {user && (
        <Link to="/admin" className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="لوحة التحكم" title="لوحة التحكم">
          <Settings size={20} />
        </Link>
      )}

      {/* --- User Account Control --- */}
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

      {!user ? (
        <Link to="/login" className="px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
          {t('login') || 'تسجيل الدخول'}
        </Link>
      ) : (
        <Link to="/account/profile" className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1 text-sm transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <span className="font-semibold">{user.name || (user.email || '').split('@')[0]}</span>
          <User size={18} className="p-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" />
        </Link>
      )}
    </div>
  );
}

import React, { useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// safe wrapper hook: calls useTheme but catches when context is not available
function useSafeTheme() {
  try {
    return useTheme();
  } catch (e) {
    return { theme: 'system', setTheme: () => {} };
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

  return (
  <div className="flex items-center gap-2 sm:gap-3 transition-colors duration-300">
      {/* زر تغيير اللغة يظهر فقط في الشاشات الكبيرة */}

      

      {/* تم نقل زر تغيير الثيم إلى القائمة الجانبية */}

  {/* زر السلة أصبح في BottomNav فقط */}

      {!user ? (
        <Link
          to="/login"
          className="border rounded bg-white/90 dark:bg-slate-950/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300 flex items-center justify-center"
          style={{ minWidth: 0, minHeight: 0, padding: 0 }}
        >
          {/* Icon only on mobile, text on larger screens */}
          <User size={18} className="block sm:hidden" />
          <span className="hidden sm:inline-block text-sm px-3 py-1">{t('login') || 'Login'}</span>
        </Link>
      ) : (
        <Link to="/account/profile" className="flex items-center gap-2 px-3 py-1 border rounded text-sm bg-white/90 dark:bg-slate-950/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300">
          <User size={16} />
          <span className="hidden sm:inline-block">{user.name || (user.email || '').split('@')[0]}</span>
        </Link>
      )}
    </div>
  );
}

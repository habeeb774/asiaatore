import React, { useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, ShoppingCart, User, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { useSidebar } from '../../stores/SidebarContext';
import { useTheme } from '../../stores/ThemeContext';

// ✅ دالة آمنة لاستدعاء الثيم (في حال لم يكن السياق متوفرًا)
function useSafeTheme() {
  try {
    return useTheme();
  } catch {
    return { theme: 'system', setTheme: () => {} };
  }
}

// ✅ دالة آمنة لاستدعاء حالة الشريط الجانبي (sidebar)
function useSafeSidebar() {
  try {
    return useSidebar();
  } catch {
    return {};
  }
}

export default function HeaderControls({ t, locale, setLocale, cartItems, user }) {
  const cartBtnRef = useRef(null);

  // ✅ حساب عدد المنتجات في السلة
  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce((s, i) => s + (i.quantity || 1), 0)
    : 0;

  // ✅ تبديل اللغة بالتناوب بين العربية والإنجليزية والفرنسية
  const langs = ['ar', 'en', 'fr'];
  const onCycleLanguage = () => {
    if (!setLocale) return;
    const idx = Math.max(0, langs.indexOf(locale));
    const next = langs[(idx + 1) % langs.length];
    setLocale(next);
  };

  // ✅ تأثير بصري عند تحديث عدد السلة
  useEffect(() => {
    const el = cartBtnRef.current;
    if (!el || typeof el.animate !== 'function') return;
    try {
      el.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.08)' },
          { transform: 'scale(1)' }
        ],
        { duration: 280, easing: 'cubic-bezier(.2,.9,.3,1)' }
      );
    } catch {}
  }, [cartCount]);

  // ✅ إعداد التبديل بين الثيمات (نظام - فاتح - داكن)
  const { theme, setTheme } = useSafeTheme();
  const nextTheme = useMemo(
    () => (theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'),
    [theme]
  );

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel =
    theme === 'dark'
      ? t?.('themeDark') || 'الوضع الداكن'
      : theme === 'light'
      ? t?.('themeLight') || 'الوضع الفاتح'
      : t?.('themeSystemAuto') || 'النظام (تلقائي)';

  const _sidebarCtx = useSafeSidebar();
  const { setOpen: openSidebar, open: sidebarOpen } = _sidebarCtx || {};

  return (
    <div className="flex items-center gap-2 sm:gap-3 transition-colors duration-300">
      {/* ✅ زر فتح القائمة الجانبية (يُخفى عند فتح القائمة لتجنب التكرار) */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => openSidebar?.(true)}
          className="header-menu-button hidden md:inline-flex border rounded bg-white/90 dark:bg-slate-950/90 p-1.5 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={t?.('openMenu') || 'فتح القائمة'}
        >
          <Menu size={18} />
        </button>
      )}

      {/* ✅ زر تغيير اللغة (يظهر فقط على الشاشات الكبيرة) */}
      <button
        type="button"
        onClick={onCycleLanguage}
        className="hidden md:inline-flex border rounded bg-white/90 dark:bg-slate-950/90 p-1.5 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300"
        aria-label={t?.('changeLanguage') || 'تغيير اللغة'}
        title={locale === 'ar' ? 'English' : locale === 'en' ? 'Français' : 'العربية'}
      >
        <Languages size={18} />
      </button>

      {/* ✅ زر تغيير الثيم */}
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className="border rounded bg-white/90 dark:bg-slate-950/90 p-1.5 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300 hidden sm:inline-flex"
        aria-label={t?.('toggleTheme') || 'تبديل الثيم'}
        title={themeLabel}
      >
        <ThemeIcon size={18} />
      </button>

      {/* ✅ ملف المستخدم أو زر تسجيل الدخول */}
      <div className="flex items-center gap-2 sm:gap-3">
        {!user ? (
          <Link
            to="/login"
            className="border rounded bg-white/90 dark:bg-slate-950/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300 flex items-center justify-center"
            style={{ minWidth: 0, minHeight: 0, padding: 0 }}
          >
            <User size={18} className="block sm:hidden" />
            <span className="hidden sm:inline-block text-sm px-3 py-1">
              {t('login') || 'تسجيل الدخول'}
            </span>
          </Link>
        ) : (
          <Link
            to="/account/profile"
            className="flex items-center gap-2 px-3 py-1 border rounded text-sm bg-white/90 dark:bg-slate-950/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors duration-300"
          >
            <User size={16} />
            <span className="hidden sm:inline-block">
              {user.name || (user.email || '').split('@')[0]}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Sun, Moon, Monitor, Languages, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

function useSafeTheme() {
  try {
    return useTheme();
  } catch {
    return { theme: 'system', setTheme: () => {} };
  }
}

// A consistent base style for all icon buttons in the header
const iconButtonClass = "relative inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100/80 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 transition-all duration-200";

export default function HeaderControls({ t, locale, setLocale, cartItems, user, triggerSearch }) {

  const langs = ['ar', 'en', 'fr'];
  const onCycleLanguage = () => {
    if (!setLocale) return;
    const idx = Math.max(0, langs.indexOf(locale));
    const next = langs[(idx + 1) % langs.length];
    setLocale(next);
  };

  useEffect(() => {}, []);

  const { theme, setTheme } = useSafeTheme();
  const nextTheme = useMemo(() => (theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'), [theme]);
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const themeLabel = theme === 'dark' ? t?.('themeDark') || 'الوضع الداكن' : theme === 'light' ? t?.('themeLight') || 'الوضع الفاتح' : t?.('themeSystemAuto') || 'النظام (تلقائي)';

  const userLabel = useMemo(() => {
    if (!user) return '';
    const source = user.name || '';
    const trimmed = source.trim();
    if (trimmed.length === 0) return (user.email || '').split('@')[0] || '';
    if (trimmed.length <= 14) return trimmed;
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      return `${words[0]} ${words[1].charAt(0).toUpperCase()}.`;
    }
    return `${trimmed.slice(0, 10)}…`;
  }, [user]);

  return (
    <div className="flex items-center justify-end gap-2 transition-colors duration-300 w-auto">
      {/* Structured control bar */}
      <div className="self-center flex items-center gap-1 sm:gap-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10 backdrop-blur-md px-2 sm:px-3 py-1">
        {/* Search */}
        <button type="button" onClick={triggerSearch} className={iconButtonClass} aria-label={t?.('search') || 'بحث'} title={t?.('search') || 'بحث'}>
          <Search size={18} />
        </button>

        {/* Divider */}
        <span className="mx-0.5 w-px h-5 bg-slate-300/60 dark:bg-white/15" />

        {/* Language */}
        <button type="button" onClick={onCycleLanguage} className={`${iconButtonClass} hidden md:inline-flex`} aria-label={t?.('changeLanguage') || 'تغيير اللغة'} title={locale === 'ar' ? 'English' : locale === 'en' ? 'Français' : 'العربية'}>
          <Languages size={18} />
        </button>

        {/* Theme */}
        <button type="button" onClick={() => setTheme(nextTheme)} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label={t?.('toggleTheme') || 'تبديل الثيم'} title={themeLabel}>
          <ThemeIcon size={18} />
        </button>

        {/* Divider */}
        <span className="mx-0.5 w-px h-5 bg-slate-300/60 dark:bg-white/15" />

        {/* Admin (if any) */}
        {user && user.role === 'admin' && (
          <Link to="/admin" className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="لوحة التحكم" title="لوحة التحكم">
            <Settings size={18} />
          </Link>
        )}

        {/* Divider */}
        <span className="mx-0.5 w-px h-5 bg-slate-300/60 dark:bg-white/15" />

        {/* Account */}
        {!user ? (
          <Link to="/login" className="px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-200 bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
            {t('login') || 'تسجيل الدخول'}
          </Link>
        ) : (
          <Link to="/account/profile" className="flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-0.5 text-xs transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <span className="max-w-[7rem] truncate text-start font-medium" title={user?.name || user?.email || userLabel}>{userLabel}</span>
            <User size={18} className="p-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" />
          </Link>
        )}
      </div>

      {/* Admin text button kept outside for clarity, aligned */}
      {user && user.role === 'admin' && (
        <Link to="/admin" className="hidden w-full justify-center rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 md:ml-2 md:flex md:w-auto">
          لوحة التحكم
        </Link>
      )}
    </div>
  );
}

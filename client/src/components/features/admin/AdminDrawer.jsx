import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { adminLinks } from './AdminLinks';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';

function useLocaleLabel(locale) {
  return useMemo(() => (
    link => (locale === 'ar' ? link.labelAr : (link.labelEn || link.labelAr))
  ), [locale]);
}

function DrawerNav({ collapsed, onNavigate, locale }) {
  const location = useLocation();
  const getLabel = useLocaleLabel(locale);

  return (
    <ul className="mt-2 space-y-1" role="list">
      {adminLinks.map((link) => {
        const Icon = link.icon;
        const label = getLabel(link);
        const isExact = link.exact;
        return (
          <li key={link.key}>
            <NavLink
              to={link.to}
              end={isExact}
              className={({ isActive }) => [
                'group flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white',
                collapsed ? 'justify-center' : 'gap-3',
              ].join(' ')}
              aria-label={collapsed ? label : undefined}
              onClick={() => onNavigate?.()}
            >
              {Icon ? <Icon size={19} aria-hidden /> : null}
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

function DrawerFooter({ collapsed }) {
  const { user, logout } = useAuth() || {};
  const { locale } = useLanguage() || { locale: 'ar' };
  const label = locale === 'ar' ? 'تسجيل الخروج' : 'Logout';

  if (!user) return null;

  return (
    <div className="border-t border-white/10 px-3 py-3">
      <button
        type="button"
        onClick={logout}
        className={[
          'flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors',
          'text-slate-200 hover:bg-white/10 hover:text-white',
          collapsed ? 'justify-center' : 'gap-3',
        ].join(' ')}
        aria-label={collapsed ? label : undefined}
      >
        <LogOut size={18} aria-hidden />
        {!collapsed && <span>{label}</span>}
      </button>
    </div>
  );
}

function DrawerHeader({ collapsed }) {
  const { locale } = useLanguage() || { locale: 'ar' };
  const title = locale === 'ar' ? 'قائمة الإدارة' : 'Admin Menu';

  return (
    <div className={[
      'px-3 py-3 border-b border-white/10',
      collapsed ? 'flex justify-center' : 'flex items-center justify-between gap-3',
    ].join(' ')}>
      {!collapsed && <h2 className="text-base font-semibold text-white">{title}</h2>}
    </div>
  );
}

export default function AdminDrawer({
  mode = 'overlay',
  open = false,
  onClose,
  collapsed = false,
}) {
  const { locale } = useLanguage() || { locale: 'ar' };

  const content = (
    <div
      className={[
        'flex h-full flex-col bg-slate-900/98 text-white shadow-xl',
        'backdrop-blur-sm border-l border-slate-800',
        collapsed ? 'w-20' : 'w-72',
      ].join(' ')}
    >
      {mode !== 'overlay' && <DrawerHeader collapsed={collapsed} />}
      <div className="flex-1 overflow-y-auto px-2">
        <DrawerNav collapsed={collapsed} onNavigate={mode === 'overlay' ? onClose : undefined} locale={locale} />
      </div>
      <DrawerFooter collapsed={collapsed} />
    </div>
  );

  if (mode === 'pinned') {
    return (
      <aside
        className="hidden lg:flex absolute top-0 right-0 bottom-0 z-20"
        aria-label="Admin navigation"
      >
        {content}
      </aside>
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label={locale === 'ar' ? 'إغلاق القائمة' : 'Close menu'}
      />
      <div className="absolute right-0 top-0 h-full">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800">
          <span className="text-base font-semibold">
            {locale === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/10"
            aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X size={18} />
          </button>
        </div>
        {content}
      </div>
    </div>
  );
}

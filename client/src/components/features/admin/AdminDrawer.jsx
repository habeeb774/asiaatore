import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { adminLinks } from './AdminLinks';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';

const LINK_GROUPS = [
  {
    id: 'dashboard',
    titleAr: 'الرئيسية',
    titleEn: 'Home',
    keys: ['overview', 'analytics', 'reports'],
  },
  {
    id: 'commerce',
    titleAr: 'المتجر',
    titleEn: 'Store',
    keys: ['orders', 'products', 'categories', 'brands', 'reviews', 'bank_transfers'],
  },
  {
    id: 'users',
    titleAr: 'العملاء والمستخدمون',
    titleEn: 'Customers & Users',
    keys: ['customers', 'users', 'sellers', 'sellers_kyc'],
  },
  {
    id: 'marketing',
    titleAr: 'التسويق والحملات',
    titleEn: 'Marketing & Campaigns',
    keys: ['marketing', 'apps'],
  },
  {
    id: 'system',
    titleAr: 'إعدادات النظام',
    titleEn: 'System Settings',
    keys: ['settings', 'developer_settings', 'audit'],
  },
];

const adminLinksByKey = adminLinks.reduce((acc, link) => {
  acc[link.key] = link;
  return acc;
}, {});

function useLocaleLabel(locale) {
  return useMemo(() => (
    link => (locale === 'ar' ? link.labelAr : (link.labelEn || link.labelAr))
  ), [locale]);
}

function DrawerNav({ collapsed, onNavigate, locale }) {
  const getLabel = useLocaleLabel(locale);

  return (
    <nav
      className="mt-2 space-y-4"
      aria-label={locale === 'ar' ? 'قائمة الإدارة' : 'Admin navigation'}
    >
      {LINK_GROUPS.map((group) => {
        const groupLinks = group.keys
          .map((key) => adminLinksByKey[key])
          .filter(Boolean);

        if (!groupLinks.length) return null;

        const groupTitle = locale === 'ar' ? group.titleAr : group.titleEn;

        return (
          <div key={group.id} className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide uppercase text-slate-400/80">
                {groupTitle}
              </div>
            )}
            <ul className="space-y-1" role="list">
              {groupLinks.map((link) => (
                <DrawerNavItem
                  key={link.key}
                  link={link}
                  label={getLabel(link)}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function DrawerNavItem({ link, label, collapsed, onNavigate }) {
  const Icon = link.icon;
  const isExact = link.exact;

  return (
    <li>
      <NavLink
        to={link.to}
        end={isExact}
        className={({ isActive }) => [
          'group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          isActive
            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm'
            : 'text-slate-200 hover:bg-white/5 hover:text-white',
          collapsed ? 'justify-center' : 'gap-3',
        ].join(' ')}
        aria-label={collapsed ? label : undefined}
        onClick={() => onNavigate?.()}
      >
        {Icon ? (
          <span
            className={[
              'flex h-8 w-8 items-center justify-center rounded-lg border',
              'border-white/10 bg-white/5 text-emerald-100',
              'group-hover:border-white/20 group-hover:bg-white/10',
            ].join(' ')}
            aria-hidden
          >
            <Icon size={18} />
          </span>
        ) : null}
        {!collapsed && (
          <span className="flex-1 truncate text-[13px]">
            {label}
          </span>
        )}
      </NavLink>
    </li>
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
        'flex h-full flex-col text-white shadow-xl',
        'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
        'backdrop-blur-xl border-l border-slate-800/80',
        'transition-all duration-300 ease-in-out',
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
        className="hidden lg:flex absolute top-0 right-0 bottom-0 z-30"
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

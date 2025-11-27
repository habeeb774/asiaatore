import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, Settings, LogOut, X } from 'lucide-react';

const SidebarUserContent = ({ user, logout, closePanel, locale }) => {
  const userLinks = [
    { name: locale === 'ar' ? 'ملفي' : 'Profile', path: '/profile', icon: Users },
    { name: locale === 'ar' ? 'طلباتي' : 'My Orders', path: '/my-orders', icon: ClipboardList },
    { name: locale === 'ar' ? 'الإعدادات' : 'Settings', path: '/settings', icon: Settings },
  ];

  const title = locale === 'ar' ? 'حسابي' : 'My Account';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between p-4 border-b border-slate-200/70 dark:border-slate-800/70">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={closePanel}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          aria-label={locale === 'ar' ? 'إغلاق الحساب' : 'Close account panel'}
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {user && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800/70 dark:bg-slate-900/60">
            <img
              src={user.avatar || '/placeholder-avatar.png'}
              alt={user.name || 'User avatar'}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <nav className="space-y-2">
          {userLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={closePanel}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <link.icon size={20} />
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <button
            onClick={() => {
              logout?.();
              closePanel();
            }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-left text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut size={20} />
            <span>{locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarUserContent;

import React, { useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { Menu, X, ChevronLeft, ChevronRight, MapPin, MapPinOff } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { adminQuickLinks } from "./AdminLinks";

// NOTE: previous mobile-specific hook removed; overlay/backdrop handles outside clicks

export default function AdminSideNav({ drawerOpen, setDrawerOpen, collapsed, setCollapsed, pinned, setPinned, menuBtnRef }) {
  const location = useLocation();
  const { locale } = useLanguage() || { locale: "ar" };
  
  // Close drawer if path changes
  useEffect(() => {
    if (drawerOpen) setDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Simplified check for any admin page
  const onAdminPage = location.pathname.startsWith('/admin');

  const isLinkActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const renderLabel = (link) => {
    if (locale === 'ar') return link.labelAr;
    return link.labelEn || link.labelAr;
  };

  return (
    <header
      className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40"
      dir="rtl"
    >
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo and Title */}
        <NavLink to="/admin" className="flex items-center gap-2" aria-label="Go to Admin Dashboard">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            لوحة الإدارة
          </h1>
        </NavLink>

        {/* Drawer toggle */}

        {/* Drawer toggle button (visible on all sizes) */}
        {/* Drawer toggle — open the drawer via layout (if available), else toggle a fallback */}
        <button
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
              aria-label={drawerOpen ? 'إغلاق اللوحة الجانبية' : 'فتح اللوحة الجانبية'}
              aria-expanded={drawerOpen}
          ref={menuBtnRef}
          onClick={() => {
              const next = !drawerOpen;
              if (typeof setDrawerOpen === 'function') setDrawerOpen(next);
            }}
        >
              {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

  {/* Desktop collapse toggle (visible on lg) */}
        <button
          onClick={() => typeof setCollapsed === 'function' && setCollapsed(!collapsed)}
          aria-label={collapsed ? 'افتح الشريط الجانبي' : 'اطوِ الشريط الجانبي'}
          aria-expanded={!collapsed}
          aria-controls="admin-drawer"
          className={`hidden lg:inline-flex p-2 rounded-md ml-2 ${collapsed ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        {/* Pin toggle to switch between pinned (desktop) and overlay */}
        <button
          onClick={() => typeof setPinned === 'function' && setPinned(!pinned)}
          aria-label={pinned ? 'تعطيل التثبيت' : 'تثبيت اللوحة الجانبية'}
          aria-pressed={!!pinned}
          title={pinned ? 'تعطيل التثبيت' : 'تثبيت اللوحة الجانبية'}
          className={`hidden lg:inline-flex p-2 rounded-md ml-2 ${pinned ? 'text-emerald-600 bg-emerald-50' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {pinned ? <MapPin size={18} /> : <MapPinOff size={18} />}
        </button>

        {/* Drawer handled by AdminLayout's AdminDrawer component */}

        {/* User Account (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-sm text-slate-600">
            <span className="font-semibold">المشرف</span>
          </div>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
            alt="Admin avatar"
            className="w-6 h-6 rounded-full border border-slate-200 shadow-sm"
          />
        </div>
      </div>
      {onAdminPage && adminQuickLinks.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/70">
          <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2 overflow-x-auto">
            <nav
              className="flex items-center gap-2 text-sm whitespace-nowrap"
              aria-label="روابط لوحة الإدارة"
            >
              {adminQuickLinks.map((link) => {
                const active = isLinkActive(link.to, link.exact);
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.key}
                    to={link.to}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 transition-colors ${
                      active
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300'
                    }`}
                    aria-current={active ? 'page' : undefined}
                    end={link.exact}
                  >
                    {Icon ? <Icon size={16} aria-hidden /> : null}
                    <span>{renderLabel(link)}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

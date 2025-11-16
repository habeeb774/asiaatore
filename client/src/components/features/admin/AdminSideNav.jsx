import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { Menu, X, ChevronLeft, ChevronRight, MapPin, MapPinOff } from "lucide-react";

// NOTE: previous mobile-specific hook removed; overlay/backdrop handles outside clicks

export default function AdminSideNav({ drawerOpen, setDrawerOpen, collapsed, setCollapsed, pinned, setPinned, menuBtnRef }) {
  const location = useLocation();
  
  // Close drawer if path changes
  useEffect(() => {
    if (drawerOpen) setDrawerOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const isAdminViewActive = (view) => {
    const params = new URLSearchParams(location.search);
    const currentView = params.get("view");
    if (view === 'overview') {
      return location.pathname.endsWith('/admin') && !currentView;
    }
    return currentView === view;
  };

  // Shared adminLinks available via adminLinks import if needed

  // Simplified check for any admin page
  const onAdminPage = location.pathname.startsWith('/admin');

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
    </header>
  );
}

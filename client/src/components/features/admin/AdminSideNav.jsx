import React, { useState, useEffect, useRef } from "react";
import { useLocation, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Package,
  ShoppingBag,
  FileText,
  Star,
  Tag,
  Percent,
  Megaphone,
  Settings,
  Grid,
  Menu,
  X, // Import X for close icon
} from "lucide-react";

// Custom hook to handle clicks outside a specified element
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function AdminSideNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu on outside click
  useOnClickOutside(mobileMenuRef, () => setMobileOpen(false));
  
  // Close mobile menu if path changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const isAdminViewActive = (view) => {
    const params = new URLSearchParams(location.search);
    const currentView = params.get("view");
    if (view === 'overview') {
      return location.pathname.endsWith('/admin') && !currentView;
    }
    return currentView === view;
  };

  const links = [
    { to: `/admin`, label: "نظرة عامة", icon: <LayoutDashboard size={17} />, view: 'overview' },
    { to: `/admin/users`, label: "المستخدمون", icon: <Users size={17} />, view: 'users' },
    { to: `/admin/customers`, label: "العملاء", icon: <UserCircle size={17} />, view: 'customers' },
    { to: `/admin?view=products`, label: "المنتجات", icon: <Package size={17} />, view: 'products' },
    { to: `/admin?view=orders`, label: "الطلبات", icon: <ShoppingBag size={17} />, view: 'orders' },
    { to: `/admin?view=audit`, label: "السجلات", icon: <FileText size={17} />, view: 'audit' },
    { to: `/admin?view=reviews`, label: "المراجعات", icon: <Star size={17} />, view: 'reviews' },
    { to: `/admin?view=brands`, label: "العلامات", icon: <Tag size={17} />, view: 'brands' },
    { to: `/admin?view=offers`, label: "العروض", icon: <Percent size={17} />, view: 'offers' },
    { to: `/admin?view=ads`, label: "الإعلانات", icon: <Megaphone size={17} />, view: 'ads' },
    { to: `/admin?view=marketing`, label: "التسويق", icon: <Megaphone size={17} />, view: 'marketing' },
    { to: `/admin?view=settings`, label: "الإعدادات", icon: <Settings size={17} />, view: 'settings' },
    { to: `/admin?view=cats`, label: "التصنيفات", icon: <Grid size={17} />, view: 'cats' },
  ];

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

        {/* Mobile menu button */}
        <button
          className="sm:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100"
          aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-3 overflow-x-auto scrollbar-none" role="navigation" aria-label="Admin navigation">
          {links.map((link, i) => {
            const isViewActive = link.view ? isAdminViewActive(link.view) : location.pathname.includes(link.to);
            const isActive = onAdminPage && isViewActive;
            
            return (
              <NavLink
                key={i}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.85rem] transition-all duration-200 whitespace-nowrap ${isActive ? 'bg-slate-900 text-white font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="opacity-90">{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Mobile menu (slide down) */}
        {mobileOpen && (
          <div ref={mobileMenuRef} className="absolute left-4 right-4 top-full mt-2 bg-white border rounded-lg shadow-lg p-3 sm:hidden z-50">
            <ul className="grid gap-2">
              {/* User profile in mobile menu */}
              <li className="px-3 py-2 border-b mb-2">
                <div className="flex items-center gap-3">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
                    alt="Admin avatar"
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold">المشرف</span>
                  </div>
                </div>
              </li>

              {links.map((link, i) => {
                 const isViewActive = link.view ? isAdminViewActive(link.view) : location.pathname.includes(link.to);
                 const isActive = onAdminPage && isViewActive;

                return (
                <li key={i}>
                  <NavLink
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span className="opacity-90">{link.icon}</span>
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              )})}
            </ul>
          </div>
        )}

        {/* User Account (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-sm text-slate-600">
            <span className="font-semibold">المشرف</span>
          </div>
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
            alt="Admin avatar"
            className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
          />
        </div>
      </div>
    </header>
  );
}

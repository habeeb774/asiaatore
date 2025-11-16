import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  X
} from 'lucide-react';
import adminLinks from './AdminLinks';


export default function AdminDrawer({ open, onClose, pinned = false, collapsed = false, triggerRef = null }) {
  const location = useLocation();
  const drawerRef = useRef(null);
  // focus trap + aria-hidden for screen readers
  useEffect(() => {
    const drawer = drawerRef.current;
    const isDesktop = !!pinned;
    if (isDesktop) return; // skip focus trap on pinned desktop drawer
    if (!open || !drawer) return;
    // focusable elements
    const focusable = drawer.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && focusable.length) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last && last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first && first.focus();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    const mainEl = document.getElementById('main');
    if (mainEl) mainEl.setAttribute('aria-hidden', 'true');
    first && first.focus();
    drawer.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      if (mainEl) mainEl.removeAttribute('aria-hidden');
      drawer.removeEventListener('keydown', handleKeyDown);
      // restore focus to the trigger button if provided
      try {
        if (triggerRef && triggerRef.current) {
          triggerRef.current.focus();
        }
      } catch (err) {}
    };
  }, [open, onClose, triggerRef]);
  const isDesktop = !!pinned;
  if (!open && !isDesktop) return null;

  return (
  <div className={`${isDesktop ? 'hidden lg:block' : 'absolute inset-0 z-40 flex items-start justify-center pointer-events-auto'}`}>
      {/* Backdrop (close on click) */}
  {!isDesktop && <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />}

      {/* Drawer on the right inside admin page container */}
  <aside
    ref={drawerRef}
    dir="rtl"
    id="admin-drawer"
  className={`relative ml-auto w-72 bg-white shadow-xl h-[calc(100vh-64px)] overflow-y-auto rounded-tl-lg rounded-bl-lg transform transition-all ${isDesktop ? 'lg:fixed lg:right-0 lg:top-16 lg:block' : ''} ${collapsed ? 'lg:hidden' : ''}`}
    role="dialog"
    aria-modal={!isDesktop}
  >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="admin avatar" className="w-6 h-6 rounded-full border" />
            <div className="font-medium">المشرف</div>
          </div>
          <button className="p-2 text-slate-600 rounded-md hover:bg-slate-100" onClick={onClose} aria-label="إغلاق القائمة"> <X size={18} /> </button>
        </div>

        <nav className="p-3" aria-label="Admin navigation">
          <ul className="flex flex-col gap-1">
            {adminLinks.map((link, idx) => {
              const isActive = link.view ? (new URLSearchParams(location.search).get('view') === link.view || (link.view === 'overview' && location.pathname.endsWith('/admin') && !new URLSearchParams(location.search).get('view'))) : location.pathname.includes(link.to);
              const Icon = link.icon || null;
              return (
                <li key={idx}>
                  <NavLink to={link.to} onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`} aria-current={isActive ? 'page' : undefined}>
                    {Icon ? <Icon size={16} /> : null}
                    <span>{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import AdminSideNav from './AdminSideNav.jsx';
import AdminDrawer from './AdminDrawer.jsx';

/**
 * AdminLayout
 * - Provides a consistent admin shell with top navigation and content container.
 * - Props:
 *   - title?: string — optional page title shown above content.
 *   - children: React.ReactNode — page content.
 */
export default function AdminLayout({ title, children, topbar }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // collapsed state for desktop
  const [isDesktop, setIsDesktop] = useState(false);
  const [pinned, setPinned] = useState(false); // user pin preference persisted

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setIsDesktop(!!e.matches);
    setIsDesktop(!!mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // initialize pinned preference from localStorage or default to desktop layout
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin.drawer.pinned');
      if (stored !== null) {
        setPinned(stored === '1');
      } else {
        setPinned(isDesktop);
      }
    } catch (err) {}
  }, [isDesktop]);

  // persist pinned preference
  useEffect(() => {
    try {
      localStorage.setItem('admin.drawer.pinned', pinned ? '1' : '0');
    } catch (err) {}
  }, [pinned]);
  const menuBtnRef = useRef(null);
  const pinnedPadding = isDesktop && pinned ? (collapsed ? 'lg:pr-24' : 'lg:pr-72') : '';
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
  {/* Sticky top admin nav */}
  <AdminSideNav drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} collapsed={collapsed} setCollapsed={setCollapsed} pinned={pinned} setPinned={setPinned} menuBtnRef={menuBtnRef} />

      {/* Page content container */}
  <main id="main" className={`flex-grow min-h-0 max-w-[1400px] mx-auto px-4 py-6 relative w-full transition-all duration-300 ease-in-out ${pinnedPadding}`}>
        {isDesktop && pinned ? (
          <AdminDrawer
            mode="pinned"
            collapsed={collapsed}
          />
        ) : null}
        {title ? (
          <header className="mb-4">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          </header>
        ) : null}
        {topbar ? (
          <div className="mb-4">{topbar}</div>
        ) : null}
        {children}
      </main>
      {(!isDesktop || !pinned) && (
        <AdminDrawer
          mode="overlay"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

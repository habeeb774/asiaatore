import React from 'react';
import AdminSideNav from './AdminSideNav.jsx';

/**
 * AdminLayout
 * - Provides a consistent admin shell with top navigation and content container.
 * - Props:
 *   - title?: string — optional page title shown above content.
 *   - children: React.ReactNode — page content.
 */
export default function AdminLayout({ title, children }) {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800">
      {/* Sticky top admin nav */}
      <AdminSideNav />

      {/* Page content container */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {title ? (
          <header className="mb-4">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          </header>
        ) : null}
        {children}
      </main>
    </div>
  );
}

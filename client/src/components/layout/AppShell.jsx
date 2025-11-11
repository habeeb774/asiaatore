import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { Menu as MenuIcon, X as CloseIcon, Home as HomeIcon } from 'lucide-react';
import { useLanguage } from '../../stores/LanguageContext';
import { useSettings } from '../../stores/SettingsContext';
import { useSidebar } from '../../stores/SidebarContext';
import SafeImage from '../common/SafeImage';

// Minimal Tailwind-based AppShell combining Header + Sidebar
export default function AppShell({ children }) {
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const { open, toggle, setOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-emerald-600 to-emerald-800 text-white shadow-xl z-40"
            aria-label="Sidebar"
            role="navigation"
          >
            <div className="p-4 flex items-center justify-between">
              <Link to="/" className="font-bold text-lg" aria-label="Logo">
                {locale === 'ar' ? 'متجري' : 'My Store'}
              </Link>
              <button aria-label="Close sidebar" className="p-2 rounded-md bg-white/10" onClick={toggle}>
                <CloseIcon size={18} />
              </button>
            </div>
            <nav className="px-3 py-2" aria-label="Main nav">
              <ul className="space-y-1">
                <li>
                  <Link to="/catalog" className="flex items-center gap-3 p-2 rounded hover:bg-white/6">
                    <HomeIcon size={16} />
                    <span>Catalog</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="flex items-center gap-3 p-2 rounded hover:bg-white/6">Products</Link>
                </li>
                <li>
                  <Link to="/offers" className="flex items-center gap-3 p-2 rounded hover:bg-white/6">Offers</Link>
                </li>
              </ul>
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/40 z-30"
            aria-hidden={!open}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center justify-between gap-4 p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <button aria-label="Toggle menu" onClick={toggle} className="p-2 rounded-md bg-slate-100 dark:bg-slate-700">
              <MenuIcon size={18} />
            </button>
            <Link to="/" className="flex items-center gap-2 font-semibold" aria-label="Logo">
              {setting?.logoUrl || setting?.logo ? (
                <SafeImage src={setting.logoUrl || setting.logo} alt={setting?.siteNameAr || setting?.siteNameEn || 'Logo'} className="h-8 w-auto max-w-[48px] object-contain" style={{marginInlineEnd:4}} />
              ) : null}
              {locale === 'ar' ? 'متجري' : 'My Store'}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-1 rounded bg-emerald-500 text-white">Sign in</button>
          </div>
        </header>

        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import SidebarNav from './SidebarNav';
import HeaderNav from './HeaderNav';
import AnnouncementBar from './AnnouncementBar';
import CategoryScroller from './CategoryScroller';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from '../ui/ToastProvider';
import { useTheme } from '../../context/ThemeContext';
import SiteFooter from './SiteFooter';
import FloatingCart from '../ui/FloatingCart';

const AppLayout = ({ children }) => {
  const { locale, setLocale, available } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/en';
  return (
    <ToastProvider>
      <div className="app-layout professional-layout theme-minimal">
        <SidebarNav />
        <div className="content-with-sidebar">
          <AnnouncementBar />
          <HeaderNav />
          {/* Avoid duplicating categories bar on Home. Home renders CategoryChips section itself. */}
          {!isHome && <CategoryScroller />}
          {/* Language & Theme selectors moved into HeaderNav */}
          {children}
          <SiteFooter />
        </div>
        <FloatingCart />
      </div>
    </ToastProvider>
  );
};

export default AppLayout;

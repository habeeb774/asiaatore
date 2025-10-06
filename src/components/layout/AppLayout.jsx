import React from 'react';
import SidebarNav from './SidebarNav';
import HeaderNav from './HeaderNav';
import AnnouncementBar from './AnnouncementBar';
import CategoryScroller from './CategoryScroller';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from 'react-router-dom';
import { ToastProvider } from '../ui/ToastProvider';

const AppLayout = ({ children }) => {
  const { locale, setLocale, available } = useLanguage();
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/en';
  const next = available.find(l => l !== locale) || 'ar';
  return (
    <ToastProvider>
      <div className="app-layout professional-layout theme-minimal">
        <SidebarNav />
        <div className="content-with-sidebar">
          <AnnouncementBar />
          <HeaderNav />
          {/* Avoid duplicating categories bar on Home. Home renders CategoryChips section itself. */}
          {!isHome && <CategoryScroller />}
          <div style={{display:'flex', gap:8, justifyContent:'flex-end', padding:'4px 12px'}}>
            <span style={{fontSize:11, opacity:.7}}>{locale === 'ar' ? 'اللغة:' : 'Lang:'} {locale.toUpperCase()}</span>
            <button onClick={() => setLocale(next)} style={{fontSize:12, border:'1px solid #ccc', background:'#fff', cursor:'pointer', padding:'4px 8px', borderRadius:4}}>
              {locale === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
          {children}
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppLayout;

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAdmin } from '../../../contexts/AdminContext';

import AdminLayout from '../../../components/features/admin/AdminLayout';
import Seo from '../../../components/Seo';
import AdminAccessControl from '../components/AdminAccessControl';
import AdminNavigation from '../components/AdminNavigation';
import AdminViewRenderer from '../components/AdminViewRenderer';

import '../../../styles/AdminPage.scss';

const AdminDashboard = () => {
  const { locale } = useLanguage();
  const { user } = useAuth() || {};
  const { setting: storeSettings } = useSettings() || {};
  const location = useLocation();
  const navigate = useNavigate();

  // التحقق من صلاحيات المدير
  const isAdmin = React.useMemo(() => {
    const hasAdminRole = user?.role === 'admin';
    const isDevelopmentMode = import.meta?.env?.DEV === true;
    return hasAdminRole || isDevelopmentMode;
  }, [user]);

  // SEO والعنوان
  const siteName = locale === 'ar' 
    ? (storeSettings?.siteNameAr || 'شركة منفذ اسيا التجارية')
    : (storeSettings?.siteNameEn || 'My Store');
  
  const pageTitle = locale === 'ar' 
    ? `لوحة التحكم | ${siteName}` 
    : `${siteName} | Admin Dashboard`;

  React.useEffect(() => {
    try { document.title = pageTitle; } catch {}
  }, [pageTitle]);

  if (!isAdmin) {
    return <AdminAccessControl user={user} />;
  }

  const shouldShowNav = !location.pathname.startsWith('/admin/overview');

  return (
    <AdminLayout title={pageTitle}>
      <Seo 
        title={pageTitle} 
        description={locale === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin control panel'} 
      />
      
      <div className="admin-dashboard">
        {shouldShowNav && <AdminNavigation />}
        <AdminViewRenderer />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

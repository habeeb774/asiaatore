import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useAdmin } from '../../../contexts/AdminContext';

import AdminLayout from '../../../components/features/admin/AdminLayout';
import Seo from '../../../components/Seo';
import AdminAccessControl from '../components/AdminAccessControl';
// Lazy load the view renderer and navigation to trim initial admin bundle
const AdminViewRenderer = React.lazy(() => import('../components/AdminViewRenderer'));
const AdminNavigation = React.lazy(() => import('../components/AdminNavigation'));

// Admin styles are now code-split via dynamic import for smaller initial CSS.
// They will be loaded only when the admin dashboard mounts.

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

  const shouldShowNav = !location.pathname.startsWith('/admin/overview') && !location.pathname.startsWith('/admin/products');

  // Dynamically load admin stylesheet (code-split) on first mount.
  React.useEffect(() => {
    let cancelled = false;
    import('../../../styles/AdminPage.scss').catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <AdminLayout title={pageTitle}>
      <Seo 
        title={pageTitle} 
        description={locale === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin control panel'} 
      />
      
      <div className="admin-dashboard h-full flex flex-col">
        <React.Suspense fallback={<div className="text-sm text-gray-500 p-4">...جاري تحميل الواجهة...</div>}>
          {shouldShowNav && <AdminNavigation />}
        </React.Suspense>
        <React.Suspense fallback={<div className="text-sm text-gray-500 p-4">...جاري تحميل المحتوى...</div>}>
          <AdminViewRenderer />
        </React.Suspense>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

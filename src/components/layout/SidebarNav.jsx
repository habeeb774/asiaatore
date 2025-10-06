import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../css/sidebar-modern.scss';
import { useSettings } from '../../context/SettingsContext';
import { Home, BookOpen, Package, BadgePercent, Store, ShoppingCart, ClipboardList, BarChart3, Users, Settings, ReceiptText } from 'lucide-react';

/* Modern sidebar nav structure */
const baseCoreNav = [
  { to: '/', labelAr: 'الرئيسية', labelEn: 'Home', icon: Home },
  { to: '/catalog', labelAr: 'الكتالوج', labelEn: 'Catalog', icon: BookOpen },
  { to: '/products', labelAr: 'المنتجات', labelEn: 'products', icon: Package },
  { to: '/offers', labelAr: 'العروض', labelEn: 'Offers', icon: BadgePercent },
  { to: '/stores', labelAr: 'المتاجر', labelEn: 'Stores', icon: Store },
  { to: '/cart', labelAr: 'السلة', labelEn: 'Cart', icon: ShoppingCart },
];

const adminNav = [
  { to: '/admin', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: BarChart3 },
  { to: '/admin/reports', labelAr: 'التقارير', labelEn: 'Reports', icon: BarChart3 },
  { to: '/admin/analytics', labelAr: 'التحليلات', labelEn: 'Analytics', icon: BarChart3 },
  { to: '/admin/customers', labelAr: 'العملاء', labelEn: 'Customers', icon: Users },
  { to: '/admin/settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
];

import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const SidebarNav = () => {
  const { pathname } = useLocation();
  const { locale } = useLanguage();
  const { user } = useAuth() || {};
  const { setting } = useSettings() || {};
  const isAdmin = user?.role === 'admin';
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on route change (mobile)
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const renderLink = (item) => {
    const active = pathname === item.to;
    const text = locale === 'ar' ? item.labelAr : item.labelEn;
    const Icon = item.icon;
    const iconEl = typeof Icon === 'string'
      ? Icon
      : (Icon ? <Icon size={16} /> : null);
    return (
      <li key={item.to} className="nav-item">
        <Link
          to={item.to}
          className="nav-link"
          data-active={active}
          data-tip={collapsed ? text : undefined}
        >
          <span className="nav-icon" aria-hidden="true">{iconEl}</span>
          <span className="nav-label">{text}</span>
        </Link>
      </li>
    );
  };

  // Build dynamic nav (add طلباتي للمستخدم العادي)
  const coreNav = React.useMemo(() => {
    const list = [...baseCoreNav];
    if (user) {
      // Add My Orders entry if not admin or even if admin (still useful)
  list.push({ to: '/my-orders', labelAr: 'طلباتي', labelEn: 'My Orders', icon: ClipboardList });
    }
    return list;
  }, [user]);

  return (
    <>
      <aside
        className={`sidebar-modern ${isAdmin ? 'has-admin' : ''}`}
        data-collapsed={collapsed}
        data-open={mobileOpen}
        aria-label="Main sidebar navigation"
      >
        <div className="sidebar-modern__inner">
          <div className="sidebar-modern__head">
            <span className="sidebar-modern__brand">{locale==='ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store')}</span>
        
            <button
              type="button"
              className="sidebar-modern__toggle"
               onClick={() => setCollapsed(c => !c)}
              aria-label={mobileOpen ? (locale==='ar'?'إغلاق القائمة':'Close menu') : (locale==='ar'?'فتح القائمة':'Open menu')}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </div>
          <ul className="sidebar-modern__nav" role="list">
            <li className="nav-section-label">{locale==='ar'?'التصفح':'Browse'}</li>
            {coreNav.map(renderLink)}
            {isAdmin && (
              <>
                <li className="nav-section-label">{locale==='ar'?'الإدارة':'Admin'}</li>
                <li className="nav-item">
                  <Link
                    to={'/orders'}
                    className="nav-link"
                    data-active={pathname === '/orders'}
                    data-tip={collapsed ? (locale==='ar'?'كل الطلبات':'All Orders') : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true"><ReceiptText size={16} /></span>
                    <span className="nav-label">{locale==='ar'?'كل الطلبات':'All Orders'}</span>
                  </Link>
                </li>
                {adminNav.map(renderLink)}
              </>
            )}
          </ul>
          <div className="sidebar-modern__footer">
            <span className="sidebar-mini-badge">v1.0</span>
            {user && <span style={{fontSize:'.55rem', fontWeight:600, opacity:.75}}>{locale==='ar'?'دور:':'Role:'} {user.role}</span>}
            <small style={{fontSize:'.55rem', opacity:.55}}>{locale==='ar'?'وضع تجريبي':'Preview mode'}</small>
          </div>
        </div>
      </aside>
      <div
        className="sidebar-modern__backdrop"
        data-open={mobileOpen}
        onClick={() => setMobileOpen(false)}
      />
    </>
  );
};

export default SidebarNav;

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/sidebar-modern.scss';
import { useSettings } from '../../context/SettingsContext';
import { Home, BookOpen, Package, BadgePercent, Store, ShoppingCart, ClipboardList, BarChart3, Users, Settings, ReceiptText, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  // Load persisted collapsed state (desktop only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sb_collapsed');
      if (saved != null && !isMobile()) setCollapsed(saved === '1');
    } catch {}
    // close mobile on mount
    setMobileOpen(false);
  }, []);
  // Persist collapsed changes (desktop only)
  useEffect(() => {
    if (isMobile()) return;
    try { localStorage.setItem('sb_collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);
  // Lock body scroll when mobile nav open and close on ESC
  useEffect(() => {
    try { document.body.style.overflow = mobileOpen ? 'hidden' : ''; } catch {}
    const onKey = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try { document.body.style.overflow = ''; } catch {}
    };
  }, [mobileOpen]);

  // Close on route change (mobile)
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Listen to global sidebar toggle events (bridge from Header)
  useEffect(() => {
    const onToggle = (e) => {
      const cmd = (e && e.detail != null && typeof e.detail === 'object' && 'cmd' in e.detail) ? e.detail.cmd : e?.detail;
      if (cmd === 'toggle') setMobileOpen((v) => !v);
      else if (cmd === 'open') setMobileOpen(true);
      else if (cmd === 'close') setMobileOpen(false);
    };
    window.addEventListener('sidebar:toggle', onToggle);
    return () => window.removeEventListener('sidebar:toggle', onToggle);
  }, []);

  // Broadcast sidebar state so Header button can reflect it (aria-expanded/icon)
  useEffect(() => {
    try { window.dispatchEvent(new CustomEvent('sidebar:state', { detail: { open: mobileOpen } })); } catch {}
  }, [mobileOpen]);

  const renderLink = (item) => {
    // Active when pathname matches direct path or nested, accounting for locale prefixes
    const candidates = [item.to, `/en${item.to}`, `/fr${item.to}`];
    const active = candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));
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
          aria-current={active ? 'page' : undefined}
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
      if (user.role === 'seller' || user.role === 'admin') {
        list.push({ to: '/seller/kyc', labelAr: 'توثيق البائع', labelEn: 'Seller KYC', icon: Settings });
      }
      if (user.role === 'delivery' || user.role === 'admin') {
        list.push({ to: '/delivery', labelAr: 'التوصيل', labelEn: 'Delivery', icon: ClipboardList });
        list.push({ to: '/delivery/map', labelAr: 'خريطة التتبع', labelEn: 'Delivery Map', icon: '🗺️' });
        list.push({ to: '/delivery/history', labelAr: 'سجل التوصيل', labelEn: 'History', icon: '🕘' });
        list.push({ to: '/delivery/availability', labelAr: 'التوفر', labelEn: 'Availability', icon: '✅' });
      }
    }
    return list;
  }, [user]);

  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 980;
  const handleToggle = () => {
    if (isMobile()) {
      setMobileOpen((v) => !v);
    } else {
      setCollapsed((c) => !c);
    }
  };
  const expanded = isMobile() ? mobileOpen : !collapsed;

  return (
    <>
      <aside
        className={`sidebar-modern ${isAdmin ? 'has-admin' : ''}`}
        id="app-sidebar"
        data-collapsed={collapsed}
        data-open={mobileOpen}
        aria-label="Main sidebar navigation"
      >
        <div className="sidebar-modern__inner">
          <div className="sidebar-modern__head">
            <span className="sidebar-modern__brand">{locale==='ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store')}</span>
        
            <button
              type="button"
              className="sidebar-modern__toggle"
              onClick={handleToggle}
              aria-expanded={expanded}
              aria-controls="app-sidebar"
              aria-label={
                isMobile()
                  ? mobileOpen ? (locale==='ar'?'إغلاق القائمة':'Close menu') : (locale==='ar'?'فتح القائمة':'Open menu')
                  : collapsed ? (locale==='ar'?'توسيع الشريط الجانبي':'Expand sidebar') : (locale==='ar'?'طيّ الشريط الجانبي':'Collapse sidebar')
              }
              title={
                isMobile()
                  ? mobileOpen ? (locale==='ar'?'إغلاق القائمة':'Close menu') : (locale==='ar'?'فتح القائمة':'Open menu')
                  : collapsed ? (locale==='ar'?'توسيع الشريط الجانبي':'Expand sidebar') : (locale==='ar'?'طيّ الشريط الجانبي':'Collapse sidebar')
              }
            >
              {isMobile() ? (
                mobileOpen ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />
              ) : (
                collapsed ? <ChevronsRight size={16} aria-hidden="true" /> : <ChevronsLeft size={16} aria-hidden="true" />
              )}
              <span className="sr-only">
                {isMobile()
                  ? mobileOpen ? (locale==='ar'?'إغلاق القائمة':'Close menu') : (locale==='ar'?'فتح القائمة':'Open menu')
                  : collapsed ? (locale==='ar'?'توسيع الشريط الجانبي':'Expand sidebar') : (locale==='ar'?'طيّ الشريط الجانبي':'Collapse sidebar')}
              </span>
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
                    data-active={['/orders','/en/orders','/fr/orders'].some(c => pathname === c || pathname.startsWith(`${c}/`))}
                    aria-current={['/orders','/en/orders','/fr/orders'].some(c => pathname === c) ? 'page' : undefined}
                    data-tip={collapsed ? (locale==='ar'?'كل الطلبات':'All Orders') : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true"><ReceiptText size={16} /></span>
                    <span className="nav-label">{locale==='ar'?'كل الطلبات':'All Orders'}</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    to={'/admin/sellers/kyc'}
                    className="nav-link"
                    data-active={['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c)}
                    aria-current={['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c) ? 'page' : undefined}
                    data-tip={collapsed ? (locale==='ar'?'مراجعة KYC':'KYC Review') : undefined}
                  >
                    <span className="nav-icon" aria-hidden="true"><Settings size={16} /></span>
                    <span className="nav-label">{locale==='ar'?'مراجعة KYC':'KYC Review'}</span>
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

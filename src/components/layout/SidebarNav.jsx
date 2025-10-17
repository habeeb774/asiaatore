import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/sidebar-modern.scss';
import { useSettings } from '../../context/SettingsContext';
import { Home, BookOpen, Package, BadgePercent, Store, ShoppingCart, ClipboardList, BarChart3, Users, Settings, ReceiptText, Menu, X, ChevronsLeft, ChevronsRight, MessageCircle } from 'lucide-react';

/* Modern sidebar nav structure */
const baseCoreNav = [
  { to: '/', labelAr: 'الرئيسية', labelEn: 'Home', navKey: 'home', icon: Home },
  { to: '/catalog', labelAr: 'الكتالوج', labelEn: 'Catalog', navKey: 'catalog', icon: BookOpen },
  { to: '/products', labelAr: 'المنتجات', labelEn: 'Products', navKey: 'products', icon: Package },
  { to: '/offers', labelAr: 'العروض', labelEn: 'Offers', navKey: 'offers', icon: BadgePercent },
  { to: '/stores', labelAr: 'المتاجر', labelEn: 'Stores', navKey: 'stores', icon: Store },
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
import useEventListener from '../../hooks/useEventListener';
import { useSidebar } from '../../context/SidebarContext';

const SidebarNav = () => {
  const { pathname } = useLocation();
  const { locale, t } = useLanguage();
  const { user } = useAuth() || {};
  const { setting } = useSettings() || {};
  const isAdmin = user?.role === 'admin';
  const { open: ctxOpen, toggle: ctxToggle, setOpen: ctxSetOpen } = (() => { try { return useSidebar(); } catch { return {}; } })();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(Boolean(ctxOpen));
  const asideRef = useRef(null);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  // Mobile breakpoint helper
  const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 980;
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
    // Mark main content as inactive for screen readers when sidebar open
    try {
      const main = document.getElementById('main');
      if (main) {
        if (mobileOpen) main.setAttribute('aria-hidden', 'true');
        else main.removeAttribute('aria-hidden');
      }
    } catch {}
    const onKey = (e) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      try { document.body.style.overflow = ''; } catch {}
      try { const main = document.getElementById('main'); if (main) main.removeAttribute('aria-hidden'); } catch {}
    };
  }, [mobileOpen]);

  // Focus trap when mobile sidebar is open
  useEffect(() => {
    if (!mobileOpen) return;
    const root = asideRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    try { first && first.focus(); } catch {}
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      if (focusables.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last && last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first && first.focus();
        }
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  // Swipe-to-close on mobile: drag left on the sidebar to close
  useEffect(() => {
    if (!mobileOpen) return;
    const el = asideRef.current;
    if (!el) return;
    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      touchStartX.current = t.clientX;
      touchDeltaX.current = 0;
    };
    const onMove = (e) => {
      if (touchStartX.current == null) return;
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - touchStartX.current;
      touchDeltaX.current = dx;
      // Only consider left drag to dismiss (dx < 0)
      if (dx < 0) {
        // apply a small translate for visual feedback
        const tr = Math.max(dx, -120);
        el.style.transform = `translate3d(${tr}px,0,0)`;
        el.style.transition = 'transform 0s';
      }
    };
    const onEnd = () => {
      // threshold to close
      const dx = touchDeltaX.current || 0;
      el.style.transition = '';
      el.style.transform = '';
      touchStartX.current = null;
      touchDeltaX.current = 0;
      if (dx < -60) setMobileOpen(false);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      el.style.transition = '';
      el.style.transform = '';
    };
  }, [mobileOpen]);

  // Close on route change (mobile)
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Sync with SidebarContext and also listen to legacy events
  useEffect(() => {
    if (typeof ctxOpen === 'boolean') setMobileOpen(Boolean(ctxOpen));
  }, [ctxOpen]);
  // Only listen to legacy events if context hook is not available
  if (!ctxSetOpen && !ctxToggle) {
    useEventListener('sidebar:toggle', (e) => {
      const cmd = (e && e.detail != null && typeof e.detail === 'object' && 'cmd' in e.detail) ? e.detail.cmd : e?.detail;
      if (cmd === 'toggle') setMobileOpen((v) => !v);
      else if (cmd === 'open') setMobileOpen(true);
      else if (cmd === 'close') setMobileOpen(false);
    });
  }

  // Broadcast sidebar state so Header button can reflect it (aria-expanded/icon)
  useEffect(() => {
    // Update context if provided
    if (ctxSetOpen) ctxSetOpen(mobileOpen);
    // Legacy state event so Header icon stays in sync
    try { window.dispatchEvent(new CustomEvent('sidebar:state', { detail: { open: mobileOpen } })); } catch {}
  }, [mobileOpen, ctxSetOpen]);

  const renderLink = useCallback((item) => {
    // Active when pathname matches direct path or nested, accounting for locale prefixes
    const candidates = [item.to, `/en${item.to}`, `/fr${item.to}`];
    const active = candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));
    // Prefer shared i18n keys when available, fallback to per-item labels
    let text;
    try {
      const key = item.navKey ? `nav.${item.navKey}` : null;
      if (key) {
        const val = t(key);
        if (val && val !== key) text = val;
      }
    } catch {}
    if (!text) text = locale === 'ar' ? item.labelAr : item.labelEn;
    const Icon = item.icon;
    const iconEl = typeof Icon === 'string'
      ? <span style={{fontSize:'1.7rem'}}>{Icon}</span>
      : (Icon ? <Icon size={28} style={{filter:active?'drop-shadow(0 2px 8px #f6ad55)':'none'}} /> : null);
    return (
      <li key={item.to} className="nav-item" style={{width:'100%'}}>
        <Link
          to={item.to}
          className="nav-link"
          data-active={active}
          aria-current={active ? 'page' : undefined}
          data-tip={collapsed ? text : undefined}
          aria-label={collapsed ? text : undefined}
          style={{
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            width:'48px', height:'48px', borderRadius:'14px', margin:'0 auto',
            background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: active ? '2px solid #f6ad55' : '1.5px solid rgba(255,255,255,0.08)',
            boxShadow: active ? '0 2px 8px -2px #f6ad55' : 'none',
            color: active ? '#f6ad55' : '#fff',
            fontSize: '1.7rem',
            transition: 'all 0.18s',
            cursor: 'pointer',
            outline: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = active ? 'rgba(255,255,255,0.12)' : 'transparent'}
          onKeyDown={(e) => {
            try {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                const next = e.currentTarget.parentElement.nextElementSibling;
                if (next) next.querySelector('.nav-link')?.focus();
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                const prev = e.currentTarget.parentElement.previousElementSibling;
                if (prev) prev.querySelector('.nav-link')?.focus();
              } else if (e.key === 'Home') {
                e.preventDefault();
                const first = e.currentTarget.closest('.sidebar-modern__nav')?.firstElementChild;
                first?.querySelector('.nav-link')?.focus();
              } else if (e.key === 'End') {
                e.preventDefault();
                const list = e.currentTarget.closest('.sidebar-modern__nav');
                const last = list?.lastElementChild;
                last?.querySelector('.nav-link')?.focus();
              }
            } catch (err) {}
          }}
          onClick={() => {
            // Close drawer immediately on mobile to feel responsive
            if (isMobile()) {
              setMobileOpen(false);
              if (ctxSetOpen) ctxSetOpen(false);
            }
          }}
        >
          <span className="nav-icon" aria-hidden="true">{iconEl}</span>
          <span className="nav-label" style={{fontSize:'.72rem',marginTop:'2px',fontWeight:active?700:500,opacity:active?1:.8}}>{text}</span>
        </Link>
      </li>
    );
  }, [pathname, locale, collapsed]);

  // Build dynamic nav (add طلباتي للمستخدم العادي)
  const coreNav = React.useMemo(() => {
    const list = [...baseCoreNav];
    if (user) {
      // Add My Orders entry if not admin or even if admin (still useful)
  list.push({ to: '/my-orders', labelAr: 'طلباتي', labelEn: 'My Orders', navKey: 'myOrders', icon: ClipboardList });
      if (user.role === 'seller' || user.role === 'admin') {
        list.push({ to: '/seller/kyc', labelAr: 'توثيق البائع', labelEn: 'Seller KYC', navKey: 'sellerKyc', icon: Settings });
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

  // moved isMobile above
  const handleToggle = () => {
    if (isMobile()) {
      // Manage local state; sync context open state instead of calling toggle to avoid double flips
      setMobileOpen((v) => {
        const next = !v;
        if (ctxSetOpen) ctxSetOpen(next);
        return next;
      });
    } else {
      setCollapsed((c) => !c);
    }
  };
  const expanded = isMobile() ? mobileOpen : !collapsed;
  const listRef = useRef(null);

  return (
    <>
      {/** small i18n helper for admin labels */}
      {null}
      {/* Edge-swipe opener for mobile: a slim invisible area to start opening from screen edge */}
      <div
        aria-hidden="true"
        style={{
          position:'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: 14,
          zIndex: 1020,
          touchAction: 'pan-y'
        }}
        onTouchStart={(e)=>{
          if (!isMobile() || mobileOpen) return;
          const t = e.touches?.[0];
          if (!t) return;
          // Only trigger if touch started near the very edge (<= 14px)
          if (t.clientX <= 14) {
            setMobileOpen(true);
            if (ctxSetOpen) ctxSetOpen(true);
          }
        }}
      />
      <aside
        className={`sidebar-modern ${isAdmin ? 'has-admin' : ''}`}
        id="app-sidebar"
        data-collapsed={collapsed}
        data-open={mobileOpen}
        role={isMobile() ? 'dialog' : undefined}
        aria-modal={isMobile() ? 'true' : undefined}
        tabIndex={isMobile() ? -1 : undefined}
        ref={asideRef}
        aria-label="Main sidebar navigation"
        style={{
          background: 'linear-gradient(180deg,#178a3d 0%,#0f3c1e 100%)',
          minHeight: '100vh',
          boxShadow: '2px 0 16px -8px rgba(0,0,0,0.10)',
          borderRadius: '0 18px 18px 0',
          width: collapsed ? '68px' : '88px',
          transition: 'width 0.18s',
          zIndex: 1301,
        }}
      >
  <div className="sidebar-modern__inner" ref={listRef} style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div className="sidebar-modern__head">
            <span className="sidebar-modern__brand" style={{fontWeight:700,fontSize:'.95rem',color:'#fff',letterSpacing:'.5px'}}>{locale==='ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store')}</span>
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
              style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:'8px',padding:'6px',color:'#fff',marginTop:'6px',cursor:'pointer'}}
            >
              {isMobile() ? (
                mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />
              ) : (
                collapsed ? <ChevronsRight size={18} aria-hidden="true" /> : <ChevronsLeft size={18} aria-hidden="true" />
              )}
              <span className="sr-only">
                {isMobile()
                  ? mobileOpen ? (locale==='ar'?'إغلاق القائمة':'Close menu') : (locale==='ar'?'فتح القائمة':'Open menu')
                  : collapsed ? (locale==='ar'?'توسيع الشريط الجانبي':'Expand sidebar') : (locale==='ar'?'طيّ الشريط الجانبي':'Collapse sidebar')}
              </span>
            </button>
          </div>
          <ul className="sidebar-modern__nav" role="list" aria-label="Main navigation" style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'18px'}}>
            <li className="nav-section-label" style={{color:'#f6ad55',fontWeight:700,fontSize:'.75rem',marginBottom:'2px'}}>{locale==='ar'?'التصفح':'Browse'}</li>
            {coreNav.map(renderLink)}
            {isAdmin && (
              <>
                <li className="nav-section-label" style={{color:'#f6ad55',fontWeight:700,fontSize:'.75rem',marginTop:'12px'}}>{(t('nav.admin') !== 'nav.admin' ? t('nav.admin') : (locale==='ar'?'الإدارة':'Admin'))}</li>
                <li className="nav-item" style={{width:'100%'}}>
                  <Link
                    to={'/orders'}
                    className="nav-link"
                    data-active={['/orders','/en/orders','/fr/orders'].some(c => pathname === c || pathname.startsWith(`${c}/`))}
                    aria-current={['/orders','/en/orders','/fr/orders'].some(c => pathname === c) ? 'page' : undefined}
                    data-tip={collapsed ? (locale==='ar'?'كل الطلبات':'All Orders') : undefined}
                    style={{
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                      width:'48px',height:'48px',borderRadius:'14px',margin:'0 auto',
                      background:['/orders','/en/orders','/fr/orders'].some(c => pathname === c || pathname.startsWith(`${c}/`)) ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border:['/orders','/en/orders','/fr/orders'].some(c => pathname === c || pathname.startsWith(`${c}/`)) ? '2px solid #f6ad55' : '1.5px solid rgba(255,255,255,0.08)',
                      boxShadow:['/orders','/en/orders','/fr/orders'].some(c => pathname === c || pathname.startsWith(`${c}/`)) ? '0 2px 8px -2px #f6ad55' : 'none',
                      color:['/orders','/en/orders','/fr/orders'].some(c => pathname === c || pathname.startsWith(`${c}/`)) ? '#f6ad55' : '#fff',
                      fontSize:'1.7rem',transition:'all 0.18s',cursor:'pointer',outline:'none',
                    }}
                  >
                    <span className="nav-icon" aria-hidden="true"><ReceiptText size={28} /></span>
                    <span className="nav-label" style={{fontSize:'.72rem',marginTop:'2px',fontWeight:700,opacity:1}}>{(t('nav.orders') !== 'nav.orders' ? t('nav.orders') : (locale==='ar'?'الطلبات':'Orders'))}</span>
                  </Link>
                </li>
                <li className="nav-item" style={{width:'100%'}}>
                  <Link
                    to={'/admin/sellers/kyc'}
                    className="nav-link"
                    data-active={['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c)}
                    aria-current={['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c) ? 'page' : undefined}
                    data-tip={collapsed ? (locale==='ar'?'مراجعة KYC':'KYC Review') : undefined}
                    style={{
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                      width:'48px',height:'48px',borderRadius:'14px',margin:'0 auto',
                      background:['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c) ? 'rgba(255,255,255,0.12)' : 'transparent',
                      border:['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c) ? '2px solid #f6ad55' : '1.5px solid rgba(255,255,255,0.08)',
                      boxShadow:['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c) ? '0 2px 8px -2px #f6ad55' : 'none',
                      color:['/admin/sellers/kyc','/en/admin/sellers/kyc','/fr/admin/sellers/kyc'].some(c => pathname === c) ? '#f6ad55' : '#fff',
                      fontSize:'1.7rem',transition:'all 0.18s',cursor:'pointer',outline:'none',
                    }}
                  >
                    <span className="nav-icon" aria-hidden="true"><Settings size={28} /></span>
                    <span className="nav-label" style={{fontSize:'.72rem',marginTop:'2px',fontWeight:700,opacity:1}}>{(t('nav.sellerKyc') !== 'nav.sellerKyc' ? t('nav.sellerKyc') : (locale==='ar'?'توثيق البائع':'Seller KYC'))}</span>
                  </Link>
                </li>
                {adminNav.map(renderLink)}
              </>
            )}
          </ul>
          <div className="sidebar-modern__footer" style={{marginTop:'auto',padding:'10px 0',textAlign:'center'}}>
            {/* Quick access to chat */}
            <Link
              to="/chat"
              className="sidebar-mini-badge"
              aria-label={locale==='ar' ? 'الدردشة' : 'Chat'}
              title={locale==='ar' ? 'الدردشة' : 'Chat'}
              style={{
                display:'inline-flex',alignItems:'center',justifyContent:'center',
                width:32,height:32,borderRadius:'50%',
                background:'#16a34a', color:'#fff', border:'1px solid rgba(255,255,255,0.18)',
                marginInlineEnd:8
              }}
            >
              <MessageCircle size={16} aria-hidden="true" />
              <span className="sr-only">{locale==='ar' ? 'الدردشة' : 'Chat'}</span>
            </Link>
            <span className="sidebar-mini-badge" style={{background:'#f6ad55',color:'#fff',borderRadius:'8px',padding:'2px 10px',fontWeight:700,fontSize:'.7rem'}}>v1.0</span>
            {user && <span style={{fontSize:'.55rem', fontWeight:600, opacity:.75,display:'block',marginTop:'4px',color:'#fff'}}>{locale==='ar'?'دور:':'Role:'} {user.role}</span>}
            <small style={{fontSize:'.55rem', opacity:.55,display:'block',marginTop:'2px',color:'#fff'}}>{locale==='ar'?'وضع تجريبي':'Preview mode'}</small>
          </div>
        </div>
      </aside>
      <div
        className="sidebar-modern__backdrop"
        data-open={mobileOpen}
        role="button"
        tabIndex={mobileOpen ? 0 : -1}
        aria-label="Close menu"
        onClick={() => {
          setMobileOpen(false);
          if (ctxSetOpen) ctxSetOpen(false);
        }}
        onKeyDown={(e)=>{
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setMobileOpen(false);
            if (ctxSetOpen) ctxSetOpen(false);
          }
        }}
      />
    </>
  );
};

export default SidebarNav;

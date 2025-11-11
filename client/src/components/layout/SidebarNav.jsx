import React, { useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../../stores/SettingsContext';
import { Home, BookOpen, Package, BadgePercent, Store, ShoppingCart, ClipboardList, BarChart3, Users, Settings, ReceiptText, Menu, X, MessageCircle, Sun, Moon, Globe } from 'lucide-react';
import { Tooltip } from '../../components/ui';
import { useLanguage } from '../../stores/LanguageContext';
import { useTheme } from '../../stores/ThemeContext';
import { useAuth } from '../../stores/AuthContext';
import useEventListener from '../../hooks/useEventListener';
import { useSidebar } from '../../stores/SidebarContext';

// Centralized reducer for sidebar UI state
function sidebarReducer(state, action) {
  switch (action.type) {
    case 'SET_MOBILE_OPEN':
      return { ...state, mobileOpen: !!action.value };
    case 'TOGGLE_MOBILE_OPEN':
      return { ...state, mobileOpen: !state.mobileOpen };
    case 'SET_COLLAPSED':
      return { ...state, collapsed: !!action.value };
    case 'TOGGLE_COLLAPSED':
      return { ...state, collapsed: !state.collapsed };
    case 'SET_BADGES':
      return { ...state, badges: action.value || {} };
    case 'UPDATE_BADGE':
      return { ...state, badges: { ...state.badges, [action.key]: Number(action.value) || 0 } };
    default:
      return state;
  }
}

// Memoized nav item component
const NavLinkItem = React.memo(function NavLinkItem({ 
  item, 
  pathname, 
  locale, 
  collapsed, 
  mobileMode, 
  closeMobile, 
  t,
  badges = {}
}) {
  const candidates = [item.to, `/en${item.to}`, `/fr${item.to}`];
  const active = candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));

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
  const badgeCount = badges[item.navKey] || 0;

  // Support for submenus
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const [open, setOpen] = React.useState(() => {
    // open by default if current path is inside children
    try {
      return hasChildren && item.children.some(c => pathname && (pathname === c.to || pathname.startsWith(c.to + '/')));
    } catch { return false; }
  });

  React.useEffect(() => {
    if (hasChildren) {
      const should = item.children.some(c => pathname && (pathname === c.to || pathname.startsWith(c.to + '/')));
      if (should !== open) setOpen(should);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleOpen = React.useCallback((e) => {
    e && e.preventDefault();
    setOpen(v => !v);
  }, []);

  const NavMain = (
    <Link
      to={item.to}
      className="nav-link"
      data-active={active}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? text : undefined}
      data-tip={collapsed ? text : undefined}
      onClick={(e) => {
        // Prevent default only if it's a submenu toggle
        if (hasChildren) {
          e.preventDefault();
          toggleOpen();
        } else if (mobileMode) {
          closeMobile();
        }
      }}
      role="menuitem"
      tabIndex={0}
      aria-haspopup={hasChildren ? 'true' : undefined}
      aria-expanded={hasChildren ? !!open : undefined}
    >
      <span className="nav-icon" aria-hidden="true">
        {typeof Icon === 'string' ? (
          <span style={{ fontSize: '1.4rem' }}>{Icon}</span>
        ) : Icon ? (
          <Icon size={20} />
        ) : null}
        {badgeCount > 0 && (
          <span className="nav-badge" aria-hidden="true">{Math.min(badgeCount, 99)}</span>
        )}
      </span>
      <span className="nav-label">{text}</span>
      {hasChildren && (
        <button
          aria-label={open ? (locale === 'ar' ? 'إغلاق' : 'Collapse') : (locale === 'ar' ? 'فتح' : 'Expand')}
          className={`nav-submenu-toggle ${open ? 'open' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleOpen();
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleOpen(); } }}
          tabIndex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </Link>
  );

  return (
    <li className="nav-item" role="none">
      <Tooltip 
        content={text} 
        placement={locale === 'ar' ? 'left' : 'right'} 
        disabled={!collapsed || mobileMode}
      >
        {NavMain}
      </Tooltip>

      {hasChildren && (
        <ul className={`nav-submenu ${open ? 'open' : ''}`} role="group" aria-label={text}>
          {item.children.map(ch => (
            <li key={ch.to} className="nav-item" role="none">
              <Link to={ch.to} className="nav-link" data-active={pathname === ch.to || pathname?.startsWith(ch.to + '/')} role="menuitem" onClick={() => mobileMode && closeMobile()}>
                <span className="nav-icon" aria-hidden>
                  {ch.icon ? (typeof ch.icon === 'string' ? <span style={{fontSize:14}}>{ch.icon}</span> : <ch.icon size={18} />) : null}
                </span>
                <span className="nav-label">{locale === 'ar' ? ch.labelAr : ch.labelEn}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
});

// Navigation structure
const baseCoreNav = [
  { to: '/', labelAr: 'الرئيسية', labelEn: 'Home', navKey: 'home', icon: Home },
  { to: '/products', labelAr: 'المنتجات', labelEn: 'Products', navKey: 'products', icon: Package },
  { to: '/catalog', labelAr: 'الكتالوج', labelEn: 'Catalog', navKey: 'catalog', icon: BookOpen },
  { to: '/offers', labelAr: 'العروض', labelEn: 'Offers', navKey: 'offers', icon: BadgePercent },
  { to: '/cart', labelAr: 'السلة', labelEn: 'Cart', navKey: 'cart', icon: ShoppingCart },
  { to: '/stores', labelAr: 'المتاجر', labelEn: 'Stores', navKey: 'stores', icon: Store },
];

const adminNav = [
  { to: '/admin', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: BarChart3 },
  { to: '/admin/reports', labelAr: 'التقارير', labelEn: 'Reports', icon: ClipboardList },
  { to: '/admin/analytics', labelAr: 'التحليلات', labelEn: 'Analytics', icon: BarChart3 },
  { to: '/admin/customers', labelAr: 'العملاء', labelEn: 'Customers', icon: Users },
  { to: '/admin/settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
];

const SidebarNav = () => {
  const { pathname } = useLocation();
  const { locale, t, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth() || {};
  const { setting } = useSettings() || {};
  const isAdmin = user?.role === 'admin';
  const { open: ctxOpen, setOpen: ctxSetOpen } = useSidebar() || {};

  const [sb, dispatch] = useReducer(sidebarReducer, {
    mobileOpen: Boolean(ctxOpen),
    badges: {},
    collapsed: false,
  });

  const [hoverExpand, setHoverExpand] = React.useState(false);
  const hoverTimer = useRef(null);

  // track small screen / mobile state so we can disable the collapsed 'mini' sidebar there
  const [isMobile, setIsMobile] = React.useState(() => {
    try { return typeof window !== 'undefined' && window.innerWidth <= 768; } catch { return true; }
  });

  useEffect(() => {
    const onResize = () => {
      try { setIsMobile(window.innerWidth <= 768); } catch {}
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const asideRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const prevActiveElement = useRef(null);
  const touchStartX = useRef(null);

  // Start hidden always
  useEffect(() => {
    dispatch({ type: 'SET_MOBILE_OPEN', value: false });
  }, []);

  // Load persisted collapsed state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebar_collapsed');
      if (raw !== null) dispatch({ type: 'SET_COLLAPSED', value: raw === '1' || raw === 'true' });
    } catch {}
  }, []);

  // Sync with context
  useEffect(() => {
    if (typeof ctxOpen === 'boolean') {
      dispatch({ type: 'SET_MOBILE_OPEN', value: ctxOpen });
    }
  }, [ctxOpen]);

  // Ensure collapsed state is disabled on mobile screens
  useEffect(() => {
    if (isMobile && sb.collapsed) {
      dispatch({ type: 'SET_COLLAPSED', value: false });
    }
  }, [isMobile]);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', sb.collapsed ? '1' : '0');
    } catch {}
  }, [sb.collapsed]);

  // Body scroll lock when open
  useEffect(() => {
    document.body.style.overflow = sb.mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sb.mobileOpen]);

  // Manage focus when opening/closing mobile drawer and implement a simple focus trap
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDownTrap = (e) => {
      if (!sb.mobileOpen) return;
      if (e.key !== 'Tab') return;
      const focusables = Array.from(aside.querySelectorAll(focusableSelector)).filter(el => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    if (sb.mobileOpen) {
      // save previously focused element and move focus into drawer
      prevActiveElement.current = document.activeElement;
      // focus first focusable element inside the aside, or the aside itself
      setTimeout(() => {
        const first = aside.querySelector(focusableSelector);
        (first || aside).focus();
      }, 50);
      document.addEventListener('keydown', handleKeyDownTrap, true);
    } else {
      document.removeEventListener('keydown', handleKeyDownTrap, true);
      // restore focus to toggle button or previously active element
      setTimeout(() => {
        try {
          if (toggleBtnRef.current) toggleBtnRef.current.focus();
          else if (prevActiveElement.current && prevActiveElement.current.focus) prevActiveElement.current.focus();
        } catch {}
      }, 50);
    }

    return () => document.removeEventListener('keydown', handleKeyDownTrap, true);
  }, [sb.mobileOpen]);

  // Improved drag-to-close with resistance and snap animation
  useEffect(() => {
    const aside = asideRef.current;
    const backdrop = document.querySelector('.sidebar-modern__backdrop');
    if (!aside) return;

    let startX = null;
    let currentX = 0;
    let dragging = false;
    let raf = null;
    const isRTL = document.dir === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl';

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const update = () => {
      if (!dragging) return;
      const delta = currentX - startX;
      // For LTR: delta negative => move left. For RTL: delta positive => move right.
      const translate = isRTL ? Math.max(0, delta) : Math.min(0, delta);
      // resistance effect: reduce movement after 60% of width
      const width = aside.offsetWidth || window.innerWidth * 0.85;
      const max = isRTL ? width : -width;
      const eased = translate * (Math.abs(translate) > Math.abs(max) ? 0.35 : 1);
      aside.style.transition = 'none';
      aside.style.transform = `translateX(${eased}px)`;

      if (backdrop) {
        const progress = clamp(Math.abs(eased) / width, 0, 1);
        backdrop.style.transition = 'none';
        backdrop.style.opacity = `${1 - progress}`;
        backdrop.style.pointerEvents = progress < 0.98 ? 'auto' : 'none';
      }
      raf = null;
    };

    const onTouchStart = (e) => {
      if (!sb.mobileOpen) return;
      startX = e.touches?.[0]?.clientX || null;
      currentX = startX;
      dragging = true;
      aside.style.willChange = 'transform';
    };

    const onTouchMove = (e) => {
      if (!dragging) return;
      currentX = e.touches?.[0]?.clientX || currentX;
      if (!raf) raf = requestAnimationFrame(update);
    };

    const onTouchEnd = () => {
      if (!dragging) return;
      dragging = false;
      const delta = currentX - startX;
      const width = aside.offsetWidth || window.innerWidth * 0.85;
      const threshold = Math.max(44, width * 0.32); // px to close
      const shouldClose = isRTL ? delta > threshold : delta < -threshold;

      aside.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
      if (shouldClose) {
        // animate off-screen then close
        const endTranslate = isRTL ? width : -width;
        aside.style.transform = `translateX(${endTranslate}px)`;
        if (backdrop) { backdrop.style.transition = 'opacity 220ms ease'; backdrop.style.opacity = '0'; }
        setTimeout(() => {
          dispatch({ type: 'SET_MOBILE_OPEN', value: false });
          ctxSetOpen?.(false);
          // reset inline transforms
          aside.style.transform = '';
          if (backdrop) { backdrop.style.opacity = ''; backdrop.style.pointerEvents = ''; backdrop.style.transition = ''; }
        }, 260);
      } else {
        // snap back
        aside.style.transform = '';
        if (backdrop) { backdrop.style.transition = 'opacity 220ms ease'; backdrop.style.opacity = ''; backdrop.style.pointerEvents = 'auto'; }
      }
      startX = null;
      currentX = 0;
    };

    aside.addEventListener('touchstart', onTouchStart, { passive: true });
    aside.addEventListener('touchmove', onTouchMove, { passive: true });
    aside.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      aside.removeEventListener('touchstart', onTouchStart);
      aside.removeEventListener('touchmove', onTouchMove);
      aside.removeEventListener('touchend', onTouchEnd);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sb.mobileOpen]);

  // Keyboard shortcuts
  const onKey = useCallback((e) => {
    if (e.key === 'Escape') {
      if (sb.mobileOpen) dispatch({ type: 'SET_MOBILE_OPEN', value: false });
      return;
    }

    if (e.altKey && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'M' || e.key === 'm')) {
      e.preventDefault();
      // Toggle mobile open on small screens, collapse on desktop
      try {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 769;
        if (isDesktop) dispatch({ type: 'TOGGLE_COLLAPSED' });
        else dispatch({ type: 'TOGGLE_MOBILE_OPEN' });
      } catch { dispatch({ type: 'TOGGLE_MOBILE_OPEN' }); }
    }
  }, [sb.mobileOpen]);
  useEventListener('keydown', onKey);

  // Build core nav dynamically
  const coreNav = useMemo(() => {
    const list = [...baseCoreNav];
    if (user) {
      list.push({ to: '/my-orders', labelAr: 'طلباتي', labelEn: 'My Orders', navKey: 'myOrders', icon: ClipboardList });
      if (user.role === 'seller' || user.role === 'admin') {
        list.push({ to: '/seller/kyc', labelAr: 'توثيق البائع', labelEn: 'Seller KYC', navKey: 'sellerKyc', icon: Settings });
      }
      if (user.role === 'delivery') {
        list.push({ to: '/delivery', labelAr: 'التوصيل', labelEn: 'Delivery', icon: ClipboardList });
        list.push({ to: '/delivery/map', labelAr: 'خريطة التتبع', labelEn: 'Delivery Map', icon: '🗺️' });
        list.push({ to: '/delivery/history', labelAr: 'سجل التوصيل', labelEn: 'History', icon: '🕘' });
        list.push({ to: '/delivery/availability', labelAr: 'التوفر', labelEn: 'Availability', icon: '✅' });
      }
    }
    return list;
  }, [user]);

  // WhatsApp contact configuration
  const whatsappNumber = setting?.supportWhatsapp?.toString().replace(/\D+/g, '');
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  // Unified toggle
  const handleToggle = () => {
    try {
      const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 769;
      if (isDesktop) {
        dispatch({ type: 'TOGGLE_COLLAPSED' });
      } else {
        const next = !sb.mobileOpen;
        dispatch({ type: 'SET_MOBILE_OPEN', value: next });
        ctxSetOpen?.(next);
      }
    } catch {
      const next = !sb.mobileOpen;
      dispatch({ type: 'SET_MOBILE_OPEN', value: next });
      ctxSetOpen?.(next);
    }
  };

  // Hover-expand handlers (desktop only)
  const onMouseEnterAside = () => {
    if (!sb.collapsed) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // small delay to avoid accidental triggers
    hoverTimer.current = setTimeout(() => setHoverExpand(true), 120);
  };
  const onMouseLeaveAside = () => {
    if (!sb.collapsed) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // small delay to avoid jitter
    hoverTimer.current = setTimeout(() => setHoverExpand(false), 180);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="sidebar-modern__backdrop"
        data-open={sb.mobileOpen}
        role="button"
        tabIndex={sb.mobileOpen ? 0 : -1}
        aria-hidden={!sb.mobileOpen}
        aria-label="Close menu"
        onClick={() => dispatch({ type: 'SET_MOBILE_OPEN', value: false })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            dispatch({ type: 'SET_MOBILE_OPEN', value: false });
          }
        }}
      />

      {/* Sidebar */}
      <aside
        ref={asideRef}
        className="sidebar-modern"
        data-open={sb.mobileOpen}
        data-collapsed={sb.collapsed && !isMobile}
        data-hover={hoverExpand}
        onMouseEnter={onMouseEnterAside}
        onMouseLeave={onMouseLeaveAside}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-brand"
        id="app-sidebar"
        tabIndex={-1}
        style={{ background: 'var(--color_heading)', color: 'var(--white_color)' }}
      >
        <div className="sidebar-modern__inner">
          {/* Header */}
          <div className="sidebar-modern__head">
            <span id="sidebar-brand" className="sidebar-modern__brand">
              {locale === 'ar' 
                ? (setting?.siteNameAr || 'متجر الأغذية الفاخر')
                : (setting?.siteNameEn || 'Premium Foods Store')
              }
            </span>
            <button
              type="button"
              className="sidebar-modern__toggle"
              ref={toggleBtnRef}
              onClick={handleToggle}
              aria-expanded={sb.mobileOpen}
              aria-controls="app-sidebar"
              aria-pressed={sb.collapsed}
              aria-label={sb.mobileOpen ? (locale==='ar'?'إغلاق القائمة':'Close menu') : (sb.collapsed ? (locale==='ar'?'تكبير الشريط':'Expand sidebar') : (locale==='ar'?'تصغير الشريط':'Collapse sidebar'))}
              data-testid={sb.mobileOpen ? 'sidebar-close' : undefined}
            >
              {sb.mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <ul className="sidebar-modern__nav" role="list" aria-label="Main navigation">
            <li className="nav-section-label">
              {locale === 'ar' ? 'التصفح' : 'Browse'}
            </li>
            
            {coreNav.map((item) => (
              <NavLinkItem
                key={item.to}
                item={item}
                pathname={pathname}
                locale={locale}
                // don't show collapsed/mini nav on mobile-sized screens
                collapsed={Boolean(sb.collapsed && !sb.mobileOpen && !hoverExpand && !isMobile)}
                mobileMode={isMobile}
                closeMobile={() => dispatch({ type: 'SET_MOBILE_OPEN', value: false })}
                t={t}
                badges={sb.badges}
              />
            ))}

            {/* Developer shortcut (visible to users with developer role) */}
            {user?.role === 'developer' && (
              <>
                <li className="nav-section-label">
                  {locale === 'ar' ? 'المطور' : 'Developer'}
                </li>
                <NavLinkItem
                  item={{
                    to: '/admin/developer-settings',
                    labelAr: 'اعدادات المطور',
                    labelEn: 'Developer Settings',
                    navKey: 'developerSettings',
                    icon: Settings
                  }}
                  pathname={pathname}
                  locale={locale}
                  collapsed={false}
                  mobileMode={isMobile}
                  closeMobile={() => dispatch({ type: 'SET_MOBILE_OPEN', value: false })}
                  t={t}
                />
              </>
            )}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <li className="nav-section-label">
                  {t('nav.admin') !== 'nav.admin' ? t('nav.admin') : (locale === 'ar' ? 'الإدارة' : 'Admin')}
                </li>
                
                <NavLinkItem
                  item={{
                    to: '/orders',
                    labelAr: 'الطلبات',
                    labelEn: 'Orders',
                    navKey: 'orders',
                    icon: ReceiptText
                  }}
                  pathname={pathname}
                  locale={locale}
                  collapsed={false}
                  mobileMode={isMobile}
                  closeMobile={() => dispatch({ type: 'SET_MOBILE_OPEN', value: false })}
                  t={t}
                  badges={sb.badges}
                />

                <NavLinkItem
                  item={{
                    to: '/admin/sellers/kyc',
                    labelAr: 'توثيق البائع',
                    labelEn: 'Seller KYC',
                    navKey: 'sellerKyc',
                    icon: Settings
                  }}
                  pathname={pathname}
                  locale={locale}
                  collapsed={false}
                  mobileMode={isMobile}
                  closeMobile={() => dispatch({ type: 'SET_MOBILE_OPEN', value: false })}
                  t={t}
                />

                {adminNav.map((item) => (
                  <NavLinkItem
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    locale={locale}
                    collapsed={false}
                    mobileMode={isMobile}
                    closeMobile={() => dispatch({ type: 'SET_MOBILE_OPEN', value: false })}
                    t={t}
                  />
                ))}
              </>
            )}
          </ul>

          {/* Footer */}
          <div className="sidebar-modern__footer">
            {/* Mobile-only quick actions container: theme + language remain here; search/profile moved to header */}
            <div className="mobile-footer-controls" style={{ padding: '0 0.5rem 0.5rem' }}>
              <div className="flex md:hidden" style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label={locale === 'ar' ? 'تبديل ثيم' : 'Toggle theme'}
                  className="footer-icon-btn theme-toggle"
                >
                  {theme === 'dark' ? <Moon size={18} className="lucide" /> : <Sun size={18} className="lucide" />}
                </button>

                <button
                  type="button"
                  onClick={() => { const langs = ['ar','en','fr']; const idx = Math.max(0, langs.indexOf(locale)); setLocale(langs[(idx+1)%langs.length]); }}
                  aria-label={locale === 'ar' ? 'تبديل اللغة' : 'Change language'}
                  className="footer-icon-btn language-toggle"
                >
                  <Globe size={18} className="lucide" />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {user?.avatar ? <img src={user.avatar} alt={user.name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/></svg>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.95rem', fontWeight: 700 }}>{user?.name || (locale === 'ar' ? 'ضيف' : 'Guest')}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--sb-text-muted)' }}>{user ? (locale === 'ar' ? `دور: ${user.role}` : `Role: ${user.role}`) : (locale === 'ar' ? 'غير مسجل' : 'Not signed in')}</div>
              </div>
              <div className="footer-actions">
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="footer-icon-btn theme-toggle"
                  aria-label={locale === 'ar' ? 'تبديل ثيم' : 'Toggle theme'}
                  title={locale === 'ar' ? 'تبديل الثيم' : 'Toggle theme'}
                >
                  {theme === 'dark' ? <Moon size={18} className="lucide" /> : <Sun size={18} className="lucide" />}
                  <span className="btn-label" aria-hidden>
                    {locale === 'ar' ? (theme === 'dark' ? 'داكن' : 'فاتح') : (theme === 'dark' ? 'Dark' : 'Light')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const langs = ['ar','en','fr']; const idx = Math.max(0, langs.indexOf(locale)); setLocale(langs[(idx+1)%langs.length]);
                  }}
                  className="footer-icon-btn language-toggle"
                  aria-label={locale === 'ar' ? 'تبديل اللغة' : 'Change language'}
                  title={locale === 'ar' ? 'تغيير اللغة' : 'Change language'}
                >
                  <Globe size={18} className="lucide" />
                  <span className="btn-label" aria-hidden>
                    {locale === 'ar' ? 'ع' : locale === 'en' ? 'EN' : 'FR'}
                  </span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '.5rem', marginTop: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="whatsapp-contact" aria-label="WhatsApp" title="WhatsApp">
                    <MessageCircle size={18} />
                  </a>
                )}
                <a href="mailto:support@example.com" style={{ color: 'var(--sb-text-muted)', fontSize: '.85rem' }} aria-label="Email support">support@example.com</a>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="sidebar-mini-badge">v2.0</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
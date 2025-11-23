import React, { useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { Home, BookOpen, Package, BadgePercent, Store, ShoppingCart, ClipboardList, Users, Settings, Menu, X, MessageCircle, Sun, Moon, Globe, LogOut } from 'lucide-react';
import { Tooltip } from './ui';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import useEventListener from '../hooks/useEventListener';
import { useSidebar } from '../contexts/SidebarContext';
import { useCart } from '../contexts/CartContext';
import SafeImage from './common/SafeImage';

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
    case 'SET_FAVORITES':
      return { ...state, favorites: action.value || [] };
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
 // { to: '/stores', labelAr: 'المتاجر', labelEn: 'Stores', navKey: 'stores', icon: Store },
];

const Sidebar = ({
  type = 'nav', // nav, cart, favorites, user
  open,
  onClose, // for panel types
  initialFavorites = [], // for favorites panel
}) => {
  const { pathname } = useLocation();
  const { locale, t, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth() || {};
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { setting } = useSettings() || {};
  const isAdmin = user?.role === 'admin';
  const isCartPanel = type === 'cart';

  const priceFormatter = useMemo(() => {
    try {
      const lang = locale === 'ar' ? 'ar-SA' : locale === 'fr' ? 'fr-FR' : 'en-US';
      return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' });
    } catch {
      return {
        format: (value) => `$${Number(value ?? 0).toFixed(2)}`,
      };
    }
  }, [locale]);
  const { open: ctxOpen, setOpen: ctxSetOpen, toggle: toggleCtx } = useSidebar() || {};

  const [sb, dispatch] = useReducer(sidebarReducer, {
    mobileOpen: false, // Start closed by default
    badges: {},
    collapsed: false,
    favorites: initialFavorites || [],
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

  // Load persisted collapsed state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sidebar_collapsed');
      if (raw !== null) dispatch({ type: 'SET_COLLAPSED', value: raw === '1' || raw === 'true' });
    } catch {}
  }, []);

  // Sync with context and `open` prop for panels
  useEffect(() => {
    if (type !== 'nav') {
      // For panels like 'cart', 'user', etc., visibility is controlled by the `open` prop.
      dispatch({ type: 'SET_MOBILE_OPEN', value: !!open });
    } else if (typeof ctxOpen === 'boolean') {
      // For the main navigation sidebar, visibility is controlled by the SidebarContext.
      dispatch({ type: 'SET_MOBILE_OPEN', value: ctxOpen });
    }
  }, [open, ctxOpen, type]);

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

  // Improved drag-to-close with resistance and snap animation (nav sidebar only)
  useEffect(() => {
    if (type !== 'nav') return;

    const aside = asideRef.current;
    const backdrop = aside?.parentElement?.querySelector('.sidebar-modern__backdrop');
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
  }, [sb.mobileOpen, type, ctxSetOpen]);

  // Keyboard shortcuts
  const onKey = useCallback((e) => {
    if (e.key === 'Escape') {
      if (sb.mobileOpen) {
        dispatch({ type: 'SET_MOBILE_OPEN', value: false });
        ctxSetOpen?.(false);
      }
      if (onClose) onClose();
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
  const whatsappNumber = setting?.supportWhatsapp ? String(setting.supportWhatsapp).replace(/\D+/g, '') : '';
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  // --- Handlers from SidebarUnified ---
  const handleRemoveFromCart = useCallback((productId) => {
    removeFromCart(productId);
  }, [removeFromCart]);

  const handleUpdateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      updateQuantity(productId, quantity);
    }
  }, [updateQuantity, handleRemoveFromCart]);

  const handleRemoveFromFavorites = useCallback((productId) => {
    dispatch({ type: 'SET_FAVORITES', value: sb.favorites.filter(item => item.id !== productId) });
  }, [sb.favorites]);
  // --- End Handlers ---


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
  const onMouseLeaveAside = () => {
    if (!sb.collapsed) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    // small delay to avoid jitter
    hoverTimer.current = setTimeout(() => setHoverExpand(false), 180);
  };

  const onMouseEnterAside = () => {
    if (!sb.collapsed) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverExpand(true);
  };

  const renderNavContent = () => (
    <>
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
            closeMobile={() => {
              dispatch({ type: 'SET_MOBILE_OPEN', value: false });
              ctxSetOpen?.(false);
            }}
            t={t}
            badges={sb.badges}
          />
        ))}
      </ul>

      {/* Footer */}
      <div className="sidebar-modern__footer">
        {/* User profile */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user?.avatar ? <img src={user.avatar} alt={user.name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={24} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '.95rem', fontWeight: 700 }}>{user?.name || (locale === 'ar' ? 'ضيف' : 'Guest')}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--sb-text-muted)' }}>{user ? (user.email) : (locale === 'ar' ? 'غير مسجل' : 'Not signed in')}</div>
          </div>
          {user && <button onClick={logout} aria-label={locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}><LogOut size={18} /></button>}
        </div>

        {/* Actions */}
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
    </>
  );

  const closePanel = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_OPEN', value: false });
    if (type === 'nav') {
      ctxSetOpen?.(false);
    }
    if (onClose) onClose();
  }, [ctxSetOpen, onClose, type]);

  const renderCartContent = () => {
    const hasItems = Array.isArray(cartItems) && cartItems.length > 0;

    return (
      <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between border-b border-slate-200/70 bg-white/90 px-6 py-5 dark:border-slate-700/60 dark:bg-slate-900/80">
          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-amber-500">
              {locale === 'ar' ? 'مقتنياتك' : 'Your Selection'}
            </p>
            <h2 id="cart-panel-title" className="text-lg font-semibold leading-6">
              {locale === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
            </h2>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent bg-slate-100 text-slate-700 transition hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label={locale === 'ar' ? 'إغلاق سلة التسوق' : 'Close cart'}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300/70 dark:scrollbar-thumb-slate-700/70">
          {!hasItems ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-slate-500 dark:text-slate-300">
              <ShoppingCart size={36} className="text-amber-500" aria-hidden />
              <p className="text-base font-semibold text-slate-700 dark:text-slate-100">
                {locale === 'ar' ? 'سلتك فارغة حالياً' : 'Your cart is empty'}
              </p>
              <p className="max-w-xs text-xs text-slate-500">
                {locale === 'ar'
                  ? 'استكشف مجموعتنا الفاخرة من المنتجات وأضف ما تحبه بنقرة واحدة.'
                  : 'Explore our curated collection and add something exquisite to your bag.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const quantity = Number(item.quantity ?? 1);
                const unitPrice = Number(item.salePrice ?? item.price ?? 0);
                const lineTotal = unitPrice * quantity;

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-black/[0.04] transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/70 dark:ring-white/[0.04]"
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl object-cover"
                    />

                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold leading-5 text-slate-800 dark:text-slate-50">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-500">
                            {locale === 'ar' ? 'منتج فاخر' : 'Signature Item'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                          aria-label={locale === 'ar' ? 'إزالة المنتج من السلة' : 'Remove item'}
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-2 py-1 text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:bg-slate-800"
                            aria-label={locale === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'}
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm font-semibold">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:bg-slate-800"
                            aria-label={locale === 'ar' ? 'زيادة الكمية' : 'Increase quantity'}
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                            {locale === 'ar' ? 'السعر' : 'Unit price'}
                          </p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                            {priceFormatter.format(unitPrice)}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {locale === 'ar' ? 'المجموع الفرعي' : 'Line total'}: {priceFormatter.format(lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {hasItems && (
          <div className="border-t border-slate-200/70 bg-white/90 px-6 py-5 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="flex items-center justify-between text-base font-semibold text-slate-900 dark:text-slate-50">
              <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <span>{priceFormatter.format(cartTotal ?? 0)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {locale === 'ar'
                ? 'جميع الأسعار تشمل الضريبة. استمتع بتجربة تسوق راقية وسريعة.'
                : 'Prices include applicable taxes. Enjoy a refined and fast checkout.'}
            </p>
            <Link
              to="/checkout"
              onClick={closePanel}
              className="mt-4 flex h-12 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold tracking-wide text-white shadow-lg transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-amber-500 dark:focus:ring-offset-slate-900"
            >
              {locale === 'ar' ? 'إتمام الشراء' : 'Proceed to Checkout'}
            </Link>
          </div>
        )}
      </div>
    );
  };

    const renderFavoritesContent = () => (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Favorites</h2>
          <button onClick={closePanel}><X size={20} /></button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
            {sb.favorites.length === 0 ? (
                <p>You have no favorite items.</p>
            ) : (
                <div className="space-y-4">
                    {sb.favorites.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4">
                            <SafeImage src={item.image} alt={item.name} className="w-16 h-16 rounded" />
                            <div className="flex-1">
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-gray-500">${item.price}</p>
                            </div>
                            <button onClick={() => handleRemoveFromFavorites(item.id)}><X size={16} /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );

  const renderUserContent = () => {
      const userLinks = [
        { name: 'Profile', path: '/profile', icon: Users },
        { name: 'My Orders', path: '/my-orders', icon: ClipboardList },
        { name: 'Settings', path: '/settings', icon: Settings },
      ];
      return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">My Account</h2>
              <button onClick={closePanel}><X size={20} /></button>
            </div>
            <div className="p-4">
                {user && (
                    <div className="flex items-center space-x-4 mb-4">
                        <img src={user.avatar || '/placeholder-avatar.png'} alt={user.name} className="w-12 h-12 rounded-full" />
                        <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                )}
                <nav>
                    {userLinks.map(link => (
                    <Link key={link.path} to={link.path} onClick={closePanel} className="flex items-center space-x-3 py-2 px-3 rounded hover:bg-gray-100">
                            <link.icon size={20} />
                            <span>{link.name}</span>
                        </Link>
                    ))}
                </nav>
                {user && <button onClick={() => { logout(); closePanel(); }} className="w-full text-left flex items-center space-x-3 py-2 px-3 rounded hover:bg-gray-100 mt-4"><LogOut size={20} /><span>Logout</span></button>}
            </div>
        </div>
      );
  };


  const renderContent = () => {
    switch (type) {
      case 'cart':
        return renderCartContent();
      case 'favorites':
        return renderFavoritesContent();
      case 'user':
        return renderUserContent();
      case 'nav':
      default:
        return renderNavContent();
    }
  };

  if (isCartPanel) {
    return (
      <>
        <div
          className={`fixed inset-0 z-[65] bg-slate-900/60 transition-opacity duration-200 ${sb.mobileOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'}`}
          aria-hidden={!sb.mobileOpen}
          role="presentation"
          onClick={closePanel}
        />

        <div
          ref={asideRef}
          className={`fixed inset-0 z-[70] flex items-center justify-center px-4 sm:px-6 transition-all duration-200 ease-out ${sb.mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-panel-title"
          tabIndex={sb.mobileOpen ? 0 : -1}
        >
          <div
            className={`relative w-full max-w-xl transform rounded-[32px] bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-300 ease-out dark:bg-slate-900 dark:ring-white/10 ${sb.mobileOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-3'}`}
          >
            {renderCartContent()}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile backdrop / Panel overlay */}
      <div
        className="sidebar-modern__backdrop"
        data-open={sb.mobileOpen}
        role="button"
        tabIndex={sb.mobileOpen ? 0 : -1}
        aria-hidden={!sb.mobileOpen}
        aria-label="Close menu"
        onClick={closePanel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closePanel();
          }
        }}
      />

      {/* Sidebar */}
      <aside
        ref={asideRef}
        className="sidebar-modern"
        data-open={sb.mobileOpen}
        data-collapsed={sb.collapsed && !isMobile && type === 'nav'}
        data-hover={hoverExpand && type === 'nav'}
        data-panel-type={type !== 'nav' ? type : undefined}
        onMouseEnter={onMouseEnterAside}
        onMouseLeave={onMouseLeaveAside}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-brand"
        id="app-sidebar"
        tabIndex={-1}
      >
        <div className="sidebar-modern__inner">
          {renderContent()}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

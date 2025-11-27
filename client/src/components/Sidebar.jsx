import React, { useEffect, useRef, useCallback, useReducer, useMemo, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import useEventListener from '../hooks/useEventListener';
import { useSidebar } from '../contexts/SidebarContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

const NavContent = lazy(() => import('./sidebar/SidebarNavContent'));
const CartContent = lazy(() => import('./sidebar/SidebarCartContent'));
const FavoritesContent = lazy(() => import('./sidebar/SidebarFavoritesContent'));
const UserContent = lazy(() => import('./sidebar/SidebarUserContent'));

const SidebarContentFallback = () => (
  <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-300">
    Loading...
  </div>
);

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


const Sidebar = ({
  type = 'nav', // nav, cart, favorites, user
  open,
  onClose, // for panel types
  initialFavorites = [], // for favorites panel
  onRemoveFromCart, // callback for removing from cart
  onUpdateQuantity, // callback for updating quantity
  onRemoveFromFavorites, // callback for removing from favorites
}) => {
  // Handle remove item from cart
  const handleRemoveFromCart = useCallback((productId) => {
    if (onRemoveFromCart) {
      onRemoveFromCart(productId);
    }
  }, [onRemoveFromCart]);

  // Handle update item quantity in cart
  const handleUpdateQuantity = useCallback((productId, newQuantity) => {
    if (onUpdateQuantity) {
      onUpdateQuantity(productId, newQuantity);
    }
  }, [onUpdateQuantity]);

  // Handle remove item from favorites
  const handleRemoveFromFavorites = useCallback((productId) => {
    if (onRemoveFromFavorites) {
      onRemoveFromFavorites(productId);
    }
  }, [onRemoveFromFavorites]);
  const { pathname } = useLocation();
  const { locale, t } = useLanguage();
  const { user, logout } = useAuth() || {};
  const { cartItems, cartTotal } = useCart();
  const { wishlistItems = [] } = useWishlist() || {};
  const { setting } = useSettings() || {};
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
  const { open: ctxOpen, setOpen: ctxSetOpen } = useSidebar() || {};

  const [sb, dispatch] = useReducer(sidebarReducer, {
    mobileOpen: false, // Start closed by default
    badges: {},
    collapsed: false,
    favorites: initialFavorites || [],
  });

  const [search, setSearch] = useState('');
  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search]);

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

  // WhatsApp contact configuration
  const whatsappNumber = setting?.supportWhatsapp ? String(setting.supportWhatsapp).replace(/\D+/g, '') : '';
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  // Update wishlist badge count
  useEffect(() => {
    try { dispatch({ type: 'UPDATE_BADGE', key: 'wishlist', value: Array.isArray(wishlistItems) ? wishlistItems.length : 0 }); } catch {}
  }, [wishlistItems]);

  const totalCartItems = Array.isArray(cartItems)
    ? cartItems.reduce((sum, item) => sum + Number(item.quantity ?? 1), 0)
    : 0;
  const pendingOrders = sb.badges?.orders ?? sb.badges?.myOrders ?? 0;
  const favoriteCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;

  // --- End Handlers ---

  // Unified toggle
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

  const closePanel = useCallback(() => {
    dispatch({ type: 'SET_MOBILE_OPEN', value: false });
    if (type === 'nav') {
      ctxSetOpen?.(false);
    }
    if (onClose) onClose();
  }, [ctxSetOpen, onClose, type]);

  const isCollapsed = sb.collapsed && !hoverExpand && !isMobile;

  const navContent = (
    <Suspense fallback={<SidebarContentFallback />}>
      <NavContent
        locale={locale}
        t={t}
        user={user}
        closePanel={closePanel}
        collapsed={isCollapsed}
        isMobile={isMobile}
        search={search}
        setSearch={setSearch}
        normalizedSearch={normalizedSearch}
        pathname={pathname}
        badges={sb.badges}
        setting={setting}
        logout={logout}
        totalCartItems={totalCartItems}
        pendingOrders={pendingOrders}
        favoriteCount={favoriteCount}
        whatsappHref={whatsappHref}
      />
    </Suspense>
  );

  const cartContent = (
    <Suspense fallback={<SidebarContentFallback />}>
      <CartContent
        locale={locale}
        closePanel={closePanel}
        cartItems={cartItems}
        cartTotal={cartTotal}
        priceFormatter={priceFormatter}
        handleRemoveFromCart={handleRemoveFromCart}
        handleUpdateQuantity={handleUpdateQuantity}
      />
    </Suspense>
  );

  const favoritesContent = (
    <Suspense fallback={<SidebarContentFallback />}>
      <FavoritesContent
        favorites={sb.favorites}
        locale={locale}
        closePanel={closePanel}
        handleRemoveFromFavorites={handleRemoveFromFavorites}
      />
    </Suspense>
  );

  const userContent = (
    <Suspense fallback={<SidebarContentFallback />}>
      <UserContent user={user} logout={logout} closePanel={closePanel} locale={locale} />
    </Suspense>
  );

  const renderContent = () => {
    switch (type) {
      case 'cart':
        return cartContent;
      case 'favorites':
        return favoritesContent;
      case 'user':
        return userContent;
      case 'nav':
      default:
        return navContent;
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
            {cartContent}
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
        data-collapsed={isCollapsed && type === 'nav'}
        data-hover={hoverExpand && type === 'nav'}
        data-panel-type={type !== 'nav' ? type : undefined}
        onMouseEnter={onMouseEnterAside}
        onMouseLeave={onMouseLeaveAside}
        role="navigation"
        aria-label="القائمة الرئيسية"
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

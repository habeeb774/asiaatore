import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { localizeName } from '../../utils/locale';
import { BookOpen, Package, BadgePercent, Store as StoreIcon, Home as HomeIcon, Menu as MenuIcon, X as CloseIcon, BarChart3 } from 'lucide-react';

const HeaderNav = () => {
  const [openPanel, setOpenPanel] = useState(null);
  const { t, locale, available, setLocale } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, devLoginAs, logout } = useAuth() || {};
  const { pathname } = useLocation();
  const { setting } = useSettings() || {};
  const { cartItems = [], updateQuantity, removeFromCart } = useCart() || {};
  const prefix = locale === 'ar' ? '' : `/${locale}`;
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : (locale==='ar' ? 'حسابي' : 'My Account'));
  const isDev = !!(import.meta && import.meta.env && import.meta.env.DEV);

  const cartCount = useMemo(() => (Array.isArray(cartItems) ? cartItems.reduce((s,i)=>s+(i.quantity||1),0) : 0), [cartItems]);
  const cartTotal = useMemo(() => (Array.isArray(cartItems) ? cartItems.reduce((s,i)=> s + ((i.price||i.salePrice||0)*(i.quantity||1)), 0) : 0), [cartItems]);
  const cartIconRef = useRef(null);
  const menuToggleRef = useRef(null);
  const menuPanelRef = useRef(null);
  const menuCloseBtnRef = useRef(null);
  const qtyBtn = { background:'#e2e8f0', border:0, borderRadius:6, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'.7rem', fontWeight:600, color:'#0f172a' };

  useEffect(() => {
    const bump = () => {
      const el = cartIconRef.current; if (!el) return;
      el.classList.remove('bump');
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      el.offsetWidth;
      el.classList.add('bump');
      setTimeout(()=> el.classList.remove('bump'), 350);
    };
    window.addEventListener('cart:icon-bump', bump);
    return () => window.removeEventListener('cart:icon-bump', bump);
  }, []);

  // Lock body scroll when any panel is open and allow closing by Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (openPanel) document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && openPanel) setOpenPanel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [openPanel]);

  // Sidebar bridge: reflect sidebar mobile state in header button
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const onState = (e) => {
      if (e?.detail && typeof e.detail.open === 'boolean') setIsMenuOpen(e.detail.open);
    };
    window.addEventListener('sidebar:state', onState);
    return () => window.removeEventListener('sidebar:state', onState);
  }, []);
  const lastOpenRef = useRef(openPanel);
  useEffect(() => {
    // Restore focus to toggle after closing the menu
    if (lastOpenRef.current === 'menu' && openPanel !== 'menu') {
      menuToggleRef.current?.focus?.();
    }
    lastOpenRef.current = openPanel;
  }, [openPanel]);

  // Focus trap for the mobile menu when open
  useEffect(() => {
    if (!isMenuOpen) return;
    // Move focus to close button first for quick escape
    const btn = menuCloseBtnRef.current;
    if (btn) btn.focus();

    const panel = menuPanelRef.current;
    if (!panel) return;

    const getFocusable = () => Array.from(panel.querySelectorAll(
      'a[href], button:not([disabled]), select, textarea, input, [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panel.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="header" data-menu-open={isMenuOpen ? 'true' : 'false'}>
      <style>{`
        @keyframes cart-bump { 50%{ transform: scale(1);} 35%{ transform: scale(1.12);} 100%{ transform: scale(1);} }
        .cart-icon.bump { animation: cart-bump 320ms cubic-bezier(.2,.9,.3,1); }
        /* Dim/blur overlay for panels */
        .panel-overlay.open { background: rgba(0,0,0,.4); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
        /* Side drawer animation (mobile) */
        .header-panels .floating-panel.side { width: min(84vw, 360px); transition: transform .36s cubic-bezier(.2,.9,.3,1), opacity .24s; }
        .header-panels .floating-panel.side.right { inset-inline-end: 0; transform: translateX(100%); }
        .header-panels .floating-panel.side.left { inset-inline-start: 0; transform: translateX(-100%); }
        .header-panels .floating-panel.side.open { transform: translateX(0); }
        /* Mobile menu: use a side drawer; hide inline nav on small screens and show a toggle button near the logo */
        @media (max-width: 980px){
          .header { position: relative; }
          .nav { display: none; }
          .menu-toggle { display: inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border:1px solid #e2e8f0; border-radius:10px; background:#fff; cursor:pointer; margin-inline-start:.5rem; box-shadow: 0 1px 2px rgba(0,0,0,.04); }
          .menu-toggle:active { transform: scale(.98); }
          .menu-toggle svg { color:#0f172a; }
        }
        @media (min-width: 981px){ .menu-toggle { display: none; } }
        @media (prefers-color-scheme: dark){
          .menu-toggle { background:#0b1220; border-color:#1f2a3a; }
          .menu-toggle svg { color:#e5e7eb; }
        }
      `}</style>
      <div className="header-start">
        <Link to={prefix || '/'} className="logo" aria-label="Logo">
          <span style={{ display:'inline-flex', alignItems:'center', gap:8, fontWeight:700 }}>
            <span className="nav-icon" aria-hidden="true"><HomeIcon size={18} /></span>
            {locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store')}
          </span>
        </Link>
        {/* Mobile menu toggle next to store name */}
        <button
          type="button"
          className="menu-toggle"
          aria-label={locale==='ar' ? 'القائمة' : 'Menu'}
          aria-expanded={isMenuOpen}
          aria-controls="app-sidebar"
          onClick={() => {
            try { window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { cmd: 'toggle' } })); } catch {}
          }}
          title={locale==='ar' ? 'القائمة' : 'Menu'}
          ref={menuToggleRef}
        >
          <span aria-hidden="true" style={{lineHeight:1, display:'inline-flex'}}>
            {isMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </span>
        </button>
      </div>
      <nav id="main-nav" className="nav" aria-label="Main navigation" onClick={() => { if (isMenuOpen) setOpenPanel(null); }}>
        <ul className="nav-list">
          <li className="nav-item">
            <Link className="nav-link" to={`${prefix}/catalog`} style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <span className="nav-icon" aria-hidden="true"><BookOpen size={16} /></span>
              <span className="nav-label">{t('catalog')}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={`${prefix}/products`} style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <span className="nav-icon" aria-hidden="true"><Package size={16} /></span>
              <span className="nav-label">{t('products')}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={`${prefix}/offers`} style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <span className="nav-icon" aria-hidden="true"><BadgePercent size={16} /></span>
              <span className="nav-label">{t('offers')}</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to={`${prefix}/stores`} style={{display:'inline-flex',alignItems:'center',gap:6}}>
              <span className="nav-icon" aria-hidden="true"><StoreIcon size={16} /></span>
              <span className="nav-label">{t('stores') || (locale==='ar'?'المتاجر':'Stores')}</span>
            </Link>
          </li>
          {user?.role === 'seller' && (
            <li className="nav-item">
              <Link className="nav-link" to={`/SellerDashboard`} style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <span className="nav-icon" aria-hidden="true"><BarChart3 size={16} /></span>
                <span className="nav-label">{locale==='ar' ? 'لوحة البائع' : 'Seller Dashboard'}</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
  <div className="header-actions" style={{display:'flex', alignItems:'center', gap:'.45rem'}}>
        {/* Language & Theme controls */}
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <select
            aria-label={locale==='ar' ? 'اللغة' : 'Language'}
            value={locale}
            onChange={(e)=> setLocale(e.target.value)}
            style={{fontSize:12, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer', padding:'4px 8px', borderRadius:6}}
          >
            {(available||['ar','en','fr']).map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <select
            aria-label={locale==='ar' ? 'الوضع' : 'Theme'}
            value={theme}
            onChange={(e)=> setTheme(e.target.value)}
            style={{fontSize:12, border:'1px solid #d1d5db', background:'#fff', cursor:'pointer', padding:'4px 8px', borderRadius:6}}
          >
            <option value="system">{locale==='ar'?'حسب النظام':'System'}</option>
            <option value="light">{locale==='ar'?'فاتح':'Light'}</option>
            <option value="dark">{locale==='ar'?'داكن':'Dark'}</option>
          </select>
        </div>
        {user && (
          <span className="role-badge" style={{
            background: user.role==='admin'? 'linear-gradient(90deg,#69be3c,#f6ad55)' : '#e2e8f0',
            color: user.role==='admin'? '#fff':'#1f2933',
            padding: '.4rem .6rem',
            fontSize: '.6rem',
            borderRadius: '8px',
            fontWeight: 600,
            letterSpacing: '.5px'
          }}>
            {locale==='ar' ? (user.role==='admin' ? 'مشرف' : user.role==='seller' ? 'بائع' : 'مستخدم') : (user.role==='admin' ? 'Admin' : user.role==='seller' ? 'Seller' : 'User')}
          </span>
        )}
        
        <button
          ref={cartIconRef}
          className="btn-chip panel-trigger cart-icon"
          aria-expanded={openPanel === 'cart'}
          onClick={() => setOpenPanel(p => p === 'cart' ? null : 'cart')}
          aria-label={locale==='ar' ? `السلة${cartCount? ` - ${cartCount} عنصر`: ''}` : `Cart${cartCount? ` - ${cartCount} items`: ''}`}
          title={locale==='ar' ? 'السلة' : 'Cart'}
        >
          {t('cart')}
          {cartCount > 0 && <span className="badge" style={{marginInlineStart:6}}>{cartCount}</span>}
          {cartTotal > 0 && <span className="cart-total" style={{marginInlineStart:6, fontSize:'.65rem', opacity:.9}}>{cartTotal.toFixed(2)} ر.س</span>}
        </button>
        {/* Login vs User name */}
        {!user ? (
          <Link to={`${prefix}/login`} className="btn-outline" style={{ fontSize: '.7rem' }}>{t('login')}</Link>
        ) : (
          <Link to={`${prefix}/account/profile`} className="btn-outline" style={{ fontSize: '.7rem' }} title={locale==='ar'?'حسابي':'My account'}>
            {displayName}
          </Link>
        )}
      </div>

      {/* Panels container */}
      {/* Mobile menu panel removed in favor of unified SidebarNav. The header button now toggles SidebarNav on mobile via events. */}
      {openPanel === 'cart' && (
        <div className="header-panels">
          <div className={`floating-panel side right open`} role="dialog" aria-modal="true">
            <div className="panel-header">
              <h3>{locale==='ar'?'سلة المشتريات':'Cart'}</h3>
              <button className="panel-close" onClick={() => setOpenPanel(null)}>✕</button>
            </div>
            <div className="panel-body scroll-y">
              {cartItems.length ? (
                <ul className="mini-list mini-cart-items" style={{display:'flex',flexDirection:'column',gap:10}}>
                  {cartItems.map(c => {
                    const q = c.quantity || 1;
                    const price = (c.price || c.salePrice || 0);
                    const oldP = c.oldPrice ?? c.originalPrice;
                    const op = oldP != null ? +oldP : NaN;
                    const hasDisc = Number.isFinite(op) && op > price;
                    const discPct = hasDisc ? Math.round((1 - (price/op)) * 100) : 0;
                    return (
                      <li key={c.id} style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:52,height:52,flexShrink:0, background:'#f1f5f9',borderRadius:12,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <img src={c.images?.[0] || c.image || '/images/placeholder.jpg'} alt={localizeName({ name: c.name || c.title }, locale) || ''} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        </div>
                        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:4}}>
                          <span style={{fontSize:'.7rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ localizeName({ name: c.name || c.title }, locale) }</span>
                          <span style={{fontSize:'.6rem',color:'#475569'}}>
                            {price.toFixed(2)} ر.س × {q} = <strong style={{color:'#0f172a'}}>{(price*q).toFixed(2)} ر.س</strong>
                            {hasDisc && (
                              <>
                                {' '}
                                <span style={{textDecoration:'line-through', opacity:.7}}>{op.toFixed(2)}</span>
                                <span className="badge" style={{marginInlineStart:6, fontSize:'.55rem'}}> -{discPct}%</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          <button aria-label={locale==='ar'?'إنقاص الكمية':'Decrease'} onClick={()=> updateQuantity && updateQuantity(c.id, Math.max(1, q-1))} style={qtyBtn}>-</button>
                          <span style={{fontSize:'.6rem',minWidth:18,textAlign:'center'}}>{q}</span>
                          <button aria-label={locale==='ar'?'زيادة الكمية':'Increase'} onClick={()=> updateQuantity && updateQuantity(c.id, (q+1))} style={qtyBtn}>+</button>
                          <button aria-label={locale==='ar'?'حذف':'Remove'} onClick={()=> removeFromCart && removeFromCart(c.id)} className="btn-link" style={{color:'#dc2626'}}>
                            {locale==='ar'?'حذف':'Remove'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="empty">{locale==='ar'?'السلة فارغة':'Cart is empty'}</p>}
            </div>
            <div className="panel-summary">
              <div className="summary-row">
                <span>{locale==='ar'?'الإجمالي':'Total'}</span>
                <strong>{cartTotal.toFixed(2)} ر.س</strong>
              </div>
              {cartTotal < 200 && (
                <div className="free-ship-hint" style={{fontSize:'.65rem', color:'#334155', marginTop:4}}>
                  {locale==='ar' ? `أضِف ${(200 - cartTotal).toFixed(2)} ر.س للحصول على شحن مجاني` : `Add ${(200 - cartTotal).toFixed(2)} SAR to get free shipping`}
                </div>
              )}
            </div>
            <div className="panel-footer gap">
              <Link to={`${prefix}/cart`} onClick={() => setOpenPanel(null)} className="btn-outline w-full">{locale==='ar'?'تفاصيل السلة':'View cart'}</Link>
              <Link to={`${prefix}/checkout`} onClick={() => setOpenPanel(null)} className="btn-primary w-full">{locale==='ar'?'إتمام الشراء':'Checkout'}</Link>
            </div>
          </div>
        </div>
      )}
  {openPanel && <div className="panel-overlay open" role="presentation" aria-hidden="true" onClick={() => setOpenPanel(null)} />}
    </header>
  );
};

export default HeaderNav;

const qsBtn = { background:'#f1f5f9', border:'1px solid #d1d9e2', borderRadius:6, cursor:'pointer', fontSize:'.55rem', padding:'.35rem .5rem', fontWeight:600 };
const qsBtnAdmin = { ...qsBtn, background:'linear-gradient(90deg,#69be3c,#f6ad55)', color:'#fff', border:'0' };

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCart } from '../../context/CartContext';
import { localizeName } from '../../utils/locale';
import { BookOpen, Package, BadgePercent, Store as StoreIcon } from 'lucide-react';

const HeaderNav = () => {
  const [openPanel, setOpenPanel] = useState(null);
  const { t, locale } = useLanguage();
  const { user, loginAs, logout } = useAuth() || {};
  const { pathname } = useLocation();
  const { setting } = useSettings() || {};
  const { cartItems = [], updateQuantity, removeFromCart } = useCart() || {};
  const prefix = locale === 'ar' ? '' : `/${locale}`;
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : (locale==='ar' ? 'حسابي' : 'My Account'));
  const isDev = !!(import.meta && import.meta.env && import.meta.env.DEV);

  const cartCount = useMemo(() => (Array.isArray(cartItems) ? cartItems.reduce((s,i)=>s+(i.quantity||1),0) : 0), [cartItems]);
  const cartTotal = useMemo(() => (Array.isArray(cartItems) ? cartItems.reduce((s,i)=> s + ((i.price||i.salePrice||0)*(i.quantity||1)), 0) : 0), [cartItems]);
  const cartIconRef = useRef(null);
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

  return (
    <header className="header">
      <style>{`
        @keyframes cart-bump { 50%{ transform: scale(1);} 35%{ transform: scale(1.12);} 100%{ transform: scale(1);} }
        .cart-icon.bump { animation: cart-bump 320ms cubic-bezier(.2,.9,.3,1); }
      `}</style>
      <div className="header-start">
        <Link to={prefix || '/'} className="logo" aria-label="Logo">
          <span style={{ fontWeight: 700 }}>{locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store')}</span>
        </Link>
      </div>
      <nav className="nav" aria-label="Main navigation">
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
        </ul>
      </nav>
  <div className="header-actions" style={{display:'flex', alignItems:'center', gap:'.45rem'}}>
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
            {locale==='ar' ? (user.role==='admin'?'مشرف': user.role==='seller'?'بائع':'مستخدم') : user.role}
          </span>
        )}
        {/* Developer quick role switch — يظهر فقط في وضع التطوير */}
        <div className="role-switcher" style={{display:'flex', gap:4}}>
          {isDev && !user && <button onClick={()=>loginAs('user')} style={qsBtn}>User</button>}
          {isDev && !user && <button onClick={()=>loginAs('seller')} style={qsBtn}>Seller</button>}
          {isDev && !user && <button onClick={()=>loginAs('admin')} style={qsBtnAdmin}>Admin</button>}
          {user && <button onClick={logout} style={qsBtn}>{locale==='ar'?'خروج':'Logout'}</button>}
        </div>
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
          <Link to={`${prefix}/my-orders`} className="btn-outline" style={{ fontSize: '.7rem' }} title={locale==='ar'?'حسابي':'My account'}>
            {displayName}
          </Link>
        )}
      </div>

      {/* Panels container */}
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
                    return (
                      <li key={c.id} style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:52,height:52,flexShrink:0, background:'#f1f5f9',borderRadius:12,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <img src={c.images?.[0] || c.image || '/images/placeholder.jpg'} alt={localizeName({ name: c.name || c.title }, locale) || ''} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        </div>
                        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:4}}>
                          <span style={{fontSize:'.7rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ localizeName({ name: c.name || c.title }, locale) }</span>
                          <span style={{fontSize:'.6rem',color:'#475569'}}>{price.toFixed(2)} ر.س × {q} = <strong style={{color:'#0f172a'}}>{(price*q).toFixed(2)} ر.س</strong></span>
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
      {openPanel && <div className="panel-overlay open" onClick={() => setOpenPanel(null)} />}
    </header>
  );
};

export default HeaderNav;

const qsBtn = { background:'#f1f5f9', border:'1px solid #d1d9e2', borderRadius:6, cursor:'pointer', fontSize:'.55rem', padding:'.35rem .5rem', fontWeight:600 };
const qsBtnAdmin = { ...qsBtn, background:'linear-gradient(90deg,#69be3c,#f6ad55)', color:'#fff', border:'0' };

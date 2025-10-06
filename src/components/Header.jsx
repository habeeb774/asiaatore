import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SearchTypeahead from './SearchTypeahead';
import {
  ShoppingCart,
  Heart,
  Search,
  User,
  X,
  PanelLeft,          // fallback
  PanelLeftOpen,      // أيقونة إظهار
  PanelLeftClose      // أيقونة إخفاء
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAdmin } from '../context/AdminContext'; // ← استيراد السياق الإداري
import { FeaturesContext } from '../App'; // استخدام السياق الجديد
import { useLanguage } from '../context/LanguageContext';
import { localizeName } from '../utils/locale';
import { useOrders } from '../context/OrdersContext'; // لإحضار قائمة الطلبات
import { CheckoutContext } from '../App';
import { useSettings } from '../context/SettingsContext';

const smallChipStyle = {
  background:'#f1f5f9',
  border:0,
  borderRadius:10,
  padding:'6px 10px',
  fontSize:'.6rem',
  fontWeight:600,
  cursor:'pointer'
};

const Header = ({ sidebarOpen, onToggleSidebar }) => {
  const { setting } = useSettings() || {};
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // كان يُفتح تلقائياً
  const [isHiddenOnScroll, setIsHiddenOnScroll] = useState(false);
  const lastScrollYRef = useRef(window.scrollY || 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // 'cart' | 'wishlist' | 'account' | null
  const cartContext = useCart() || {};
  const { locale } = useLanguage ? useLanguage() : { locale: 'ar' };
  const wishlistContext = useWishlist() || {};
  const { user, loginAs, logout } = useAuth() || {};
  const isDev = !!(import.meta && import.meta.env && import.meta.env.DEV);
  const { theme, toggle } = useTheme() || { theme: 'light', toggle: () => {} };
  const cartItems = cartContext.cartItems || [];
  const wishlistItems = wishlistContext.wishlistItems || [];
  const { orders = [] } = useOrders?.() || {}; // قائمة الطلبات الحالية
  const { totals, coupon, applyCoupon, clearCoupon } = useContext(CheckoutContext) || {};
  const navigate = useNavigate();
  const location = useLocation();
  const searchWrapperRef = useRef();
  const searchInputRef = useRef(null);
  const adminMenuRef = useRef(null);
  const panelsRef = useRef(null);
  const cartIconRef = useRef(null);
  const { addProduct, updateProduct, deleteProduct,
          addUser, updateUser, deleteUser,
          addOrder, updateOrder, deleteOrder } = useAdmin() || {};

  const openTriggerRef = useRef(null); // لإرجاع التركيز بعد إغلاق المودال

  // نقل تعريف المودال للأعلى (كان مُعرّفاً أسفل ويُستخدم هنا في مؤثرات مبكرة)
  const [adminModal, setAdminModal] = useState({ open: false, type: null, edit: null });
  const adminModalRef = useRef(null);

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState(null);
  // توست للإشعارات السريعة (إضافة للسلة وغيرها)
  const [toasts, setToasts] = useState([]);
  const qtyBtnStyle = {background:'#e2e8f0',border:0,borderRadius:6,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'.7rem',fontWeight:600,color:'#0f172a'};

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      setIsScrolled(y > 50);
      const last = lastScrollYRef.current;
      const delta = Math.abs(y - last);
      // إخفاء الشريط عند التمرير لأسفل بسرعة معقولة وإظهاره عند التمرير للأعلى
      if (delta > 6) {
        const goingDown = y > last;
        setIsHiddenOnScroll(goingDown && y > 120);
        lastScrollYRef.current = y;
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // إشعار عند إضافة عنصر للسلة
  useEffect(() => {
    const handler = (e) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
      const productId = e?.detail?.productId;
      setToasts(ts => [...ts, { id, message: productId ? 'تمت إضافة المنتج للسلة' : 'تم تحديث السلة' }]);
      setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 3000);
    };
    window.addEventListener('cart:add', handler);
    return () => window.removeEventListener('cart:add', handler);
  }, []);

  // تأثير bump لأيقونة السلة عند cart:icon-bump
  useEffect(() => {
    const bump = () => {
      const el = cartIconRef.current;
      if (!el) return;
      el.classList.remove('bump');
      // Force reflow to restart animation
      // eslint-disable-next-line no-unused-expressions
      el.offsetWidth;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 350);
    };
    window.addEventListener('cart:icon-bump', bump);
    return () => window.removeEventListener('cart:icon-bump', bump);
  }, []);

  // إغلاق البحث عند تغيير المسار
  useEffect(() => {
    setIsSearchOpen(false);
    setIsAdminMenuOpen(false);
    closePanels();
  }, [location.pathname]);

  // تركيز الحقل عند الفتح
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => {
    setIsAdminMenuOpen(false);
  }, [location.pathname]);

  // إغلاق المودال عند الضغط خارج
  useEffect(() => {
    if (!adminModal.open) return;
    const fn = (e) => {
      if (adminModalRef.current && !adminModalRef.current.contains(e.target)) closeAdminModal();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [adminModal.open]);

  // إغلاق بـ Esc
  useEffect(() => {
    if (!adminModal.open) return;
    const onKey = (e) => e.key === 'Escape' && closeAdminModal();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [adminModal.open]);

  // مستمع اختصارات ( / للبحث ، Esc للإغلاق العام )
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 30);
      } else if (e.key === '?') {
        e.preventDefault();
        setActivePanel(p => p === 'features' ? null : 'features');
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAdminMenuOpen(false);
        closePanels();
        closeAdminModal();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line
  }, []);

  // أداة عامة للنقر خارج عنصر
  const useOutside = (active, ref, onClose) => {
    useEffect(() => {
      if (!active) return;
      const fn = (e) => ref.current && !ref.current.contains(e.target) && onClose();
      document.addEventListener('mousedown', fn);
      return () => document.removeEventListener('mousedown', fn);
    }, [active, ref, onClose]);
  };
  useOutside(isSearchOpen, searchWrapperRef, () => setIsSearchOpen(false));
  useOutside(isAdminMenuOpen, adminMenuRef, () => setIsAdminMenuOpen(false));
  useOutside(activePanel, panelsRef, () => closePanels());

  // مودال الإدارة (تركيز + خروج)
  useEffect(() => {
    if (adminModal.open) {
      const firstInput = adminModalRef.current?.querySelector('input,select,button');
      firstInput && firstInput.focus();
    }
  }, [adminModal.open]);

  const openAdminModal = (type, edit = null, opener = null) => {
    if (!user || user.role !== 'admin') return;
    openTriggerRef.current = opener || null;
    setAdminModal({ open: true, type, edit });
  };
  const closeAdminModal = useCallback(() => {
    setAdminModal({ open: false, type: null, edit: null });
    setTimeout(() => {
      openTriggerRef.current && openTriggerRef.current.focus?.();
    }, 30);
  }, []);

  // منع تنفيذ CRUD إن لم يكن admin
  const safe = (fn) => (...args) => {
    if (!user || user.role !== 'admin') return;
    return fn?.(...args);
  };

  const cartCount = Array.isArray(cartItems) ? cartItems.reduce((s,i)=>s+(i.quantity||1),0) : 0;
  const wishlistCount = Array.isArray(wishlistItems) ? wishlistItems.length : 0;
  const cartTotal = Array.isArray(cartItems) ? cartItems.reduce((s,i)=>s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0) : 0;
  const { updateQuantity, removeFromCart, maxPerItem } = cartContext;

  // ترتيب جديد + يمكن التوسعة لاحقاً
  const navItems = [
    { path: '/', label: 'الرئيسية' },
    { path: '/about', label: 'من نحن' },
    { path: '/products', label: 'المنتجات' },
    { path: '/contact', label: 'اتصل بنا' }
  ];

  const handleSearch = (e) => {
    e && e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const adminItems = [
    { label: 'نظرة عامة', query: 'overview' },
    { label: 'الطلبات', query: 'orders' },
    { label: 'المنتجات', query: 'products' },
    { label: 'المستخدمون', query: 'users' },
    { label: 'الإعدادات', query: 'settings' }
  ];

  const isAdminRoot = location.pathname === '/admin';

  const togglePanel = (key) => {
    setActivePanel(p => (p === key ? null : key));
  };
  const closePanels = () => setActivePanel(null);

  // نماذج أولية لكل نوع
  const initialForms = {
    product: { name: '', price: '', stock: '', status: 'active' },
    user: { name: '', role: 'user', active: true },
    order: { customer: '', total: '', items: 1, status: 'pending' }
  };
  const [formData, setFormData] = useState(initialForms.product);

  // تحديث النموذج عند فتح / تعديل
  useEffect(() => {
    if (!adminModal.open) return;
    if (adminModal.edit) {
      // تعيين بيانات التعديل
      const { type, edit } = adminModal;
      if (type === 'product') {
        setFormData({ name: edit.name, price: edit.price, stock: edit.stock, status: edit.status });
      } else if (type === 'user') {
        setFormData({ name: edit.name, role: edit.role, active: edit.active });
      } else if (type === 'order') {
        setFormData({ customer: edit.customer, total: edit.total, items: edit.items, status: edit.status });
      }
    } else {
      setFormData(initialForms[adminModal.type]);
    }
    // eslint-disable-next-line
  }, [adminModal]);

  const onChange = (k, v) => setFormData(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') return;
    const { type, edit } = adminModal;
    try {
      if (type === 'product') {
        if (edit) updateProduct(edit.id, {
          name: formData.name,
          price: +formData.price || 0,
          stock: +formData.stock || 0,
          status: formData.status
        }); else addProduct(formData);
      } else if (type === 'user') {
        if (edit) updateUser(edit.id, {
          name: formData.name,
          role: formData.role,
          active: !!formData.active
        }); else addUser(formData);
      } else if (type === 'order') {
        if (edit) updateOrder(edit.id, {
          customer: formData.customer,
          total: +formData.total || 0,
          items: +formData.items || 1,
          status: formData.status
        }); else addOrder(formData);
      }
      closeAdminModal();
    } catch (err) {
      console.error('Admin action failed', err);
    }
  };

  const handleDelete = () => {
    const { type, edit } = adminModal;
    if (!edit) return;
    if (!window.confirm('تأكيد الحذف؟')) return;
    if (type === 'product') deleteProduct(edit.id);
    if (type === 'user') deleteUser(edit.id);
    if (type === 'order') deleteOrder(edit.id);
    closeAdminModal();
  };

  // دالة فتح مودال تعديل الطلب (تعيد استخدام adminModal الموجود)
  const editOrderFromPanel = (o) => openAdminModal('order', {
    id: o.id,
    customer: o.customer?.name || o.customer?.fullName || '',
    total: o.totals?.grandTotal || 0,
    items: o.items?.length || 1,
    status: o.status || 'pending'
  });

  const handleDeleteOrderDirect = (id) => {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('حذف هذا الطلب؟')) return;
    deleteOrder && deleteOrder(id);
  };

  const features = useContext(FeaturesContext) || { phases:{}, isEnabled:()=>false, list:()=>({}) };
  const featurePhases = typeof features.list === 'function' ? features.list() : (features.phases || {});

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon && applyCoupon(couponInput.trim());
    if (res?.success) {
      setCouponMsg('تم تطبيق الكود');
    } else {
      setCouponMsg('كود غير صالح');
    }
    setTimeout(()=> setCouponMsg(null), 2500);
    setCouponInput('');
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''} ${isHiddenOnScroll ? 'hidden-on-scroll' : ''}`}>
        <div className="container-custom header-inner reorganized">
          <div className="header-section header-start">
            <Link to="/" className="logo">
              {setting?.logo ? (
                <img src={setting.logo} alt={setting?.siteNameAr || setting?.siteNameEn || 'Logo'} style={{ height: 34, objectFit:'contain' }} />
              ) : (
                <h5>{setting?.siteNameAr || setting?.siteNameEn || 'متجري'}</h5>
              )}
            </Link>
          </div>

          <nav className="header-section header-nav" aria-label="التنقل الرئيسي">
            <ul className="nav-list">
              {/* الخيار (4) - وضع الأيقونة كأول عنصر داخل القائمة
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-link nav-link-icon sidebar-toggle-btn"
                  aria-label={sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
                  aria-pressed={sidebarOpen}
                  aria-controls="app-sidebar"
                  onClick={onToggleSidebar}
                  style={{ cursor:'pointer', background:'transparent', border:'none' }}
                >
                  <PanelLeft size={18} />
                </button>
              </li>
              */}
              {navItems.map(i => {
                const active = location.pathname === i.path;
                return (
                  <li key={i.path} className="nav-item">
                    <Link
                      to={i.path}
                      className={`nav-link${active ? ' active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                    >
                      {i.label}
                    </Link>
                  </li>
                );
              })}

              {/* مدير: قائمة منسدلة */}
              {user?.role === 'admin' && (
                <li
                  className={`nav-item nav-dropdown admin-dropdown${isAdminMenuOpen ? ' open' : ''}`}
                  ref={adminMenuRef}
                >
                  <button
                    type="button"
                    className={`nav-link dropdown-trigger${isAdminRoot ? ' active' : ''}`}
                    aria-haspopup="true"
                    aria-expanded={isAdminMenuOpen}
                    onClick={() => setIsAdminMenuOpen(o => !o)}
                  >
                    لوحة المدير
                    <span className="chevron" aria-hidden="true" />
                  </button>
                  <ul className="dropdown-menu" role="menu" aria-label="قائمة لوحة المدير">
                    {adminItems.map(item => {
                      const active = isAdminRoot && (new URLSearchParams(location.search).get('view') || 'overview') === item.query;
                      return (
                        <li key={item.query} role="none">
                          <Link
                            role="menuitem"
                            to={`/admin?view=${item.query}`}
                            className={`dropdown-link${active ? ' active' : ''}`}
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                    <li role="none">
                      <Link
                        to="/admin"
                        role="menuitem"
                        className="dropdown-link base-link"
                        onClick={() => setIsAdminMenuOpen(false)}
                      >
                        فتح لوحة كاملة
                      </Link>
                    </li>
                  </ul>
                </li>
              )}

              {/* بائع */}
              {user?.role === 'seller' && (
                <li className="nav-item">
                  <Link to="/seller" className={`nav-link${location.pathname.startsWith('/seller') ? ' active' : ''}`}>
                    لوحة البائع
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="header-section header-actions">
            {/* زر إظهار/إخفاء الشريط الجانبي */}
            {typeof onToggleSidebar === 'function' && (
              <button
                type="button"
                className="icon sidebar-toggle-btn moved-end"
                aria-label={sidebarOpen ? 'إخفاء الشريط الجانبي' : 'إظهار الشريط الجانبي'}
                aria-pressed={!!sidebarOpen}
                onClick={onToggleSidebar}
                title="القائمة الجانبية"
              >
                {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>
            )}
            {/* أزرار إدارة الطلبات (مدير فقط) */}
            {user?.role === 'admin' && (
              <div style={{ display:'flex', gap:'.4rem', marginInlineEnd:'.5rem' }}>
                <button
                  type="button"
                  onClick={(e)=>openAdminModal('order', null, e.currentTarget)}
                  style={smallChipStyle}
                >+ طلب</button>
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-controls="panel-admin-orders"
                  aria-expanded={activePanel === 'admin-orders'}
                  onClick={()=>togglePanel('admin-orders')}
                  style={{ ...smallChipStyle, background:'#eef2f5' }}
                >الطلبات</button>
              </div>
            )}

            {/* البحث */}
            <div className="action-block search-block" ref={searchWrapperRef} style={{ minWidth: isSearchOpen ? 320 : 'auto' }}>
              {!isSearchOpen && (
                <button className="icon" onClick={() => setIsSearchOpen(true)} aria-label="فتح البحث" aria-expanded={isSearchOpen}>
                  <Search />
                  <span className="kbd-hint" aria-hidden="true">/</span>
                </button>
              )}
              {isSearchOpen && (
                <div style={{ position:'relative', width:340, maxWidth:'70vw', background:'#f1f5f9', borderRadius:14, padding:'6px 10px' }}>
                  <SearchTypeahead
                    autoFocus
                    onClose={() => setIsSearchOpen(false)}
                  />
                  <button
                    type="button"
                    aria-label="إغلاق البحث"
                    onClick={() => setIsSearchOpen(false)}
                    style={{ position:'absolute', top:4, insetInlineEnd:4, background:'transparent', border:0, cursor:'pointer', padding:4 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* المفضلة (زر يفتح لوحة) */}
            <button
              type="button"
              className="icon action-block panel-trigger"
              title="المفضلة"
              aria-haspopup="dialog"
              aria-expanded={activePanel === 'wishlist'}
              aria-controls="panel-wishlist"
              onClick={() => togglePanel('wishlist')}
            >
              <Heart />
              {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </button>

            {/* السلة */}
            <button
              type="button"
              className="icon cart-icon action-block panel-trigger"
              title="السلة"
              aria-haspopup="dialog"
              aria-expanded={activePanel === 'cart'}
              aria-controls="panel-cart"
              onClick={() => togglePanel('cart')}
              ref={cartIconRef}
            >
              <ShoppingCart />
              {cartCount > 0 && <span className="badge" aria-label="عدد العناصر">{cartCount}</span>}
              {cartTotal > 0 && <span className="cart-total" aria-label="إجمالي السلة">{cartTotal.toFixed(2)} ر.س</span>}
            </button>

            {/* الحساب */}
            <button
              type="button"
              className="icon action-block panel-trigger"
              title="الحساب"
              aria-haspopup="dialog"
              aria-expanded={activePanel === 'account'}
              aria-controls="panel-account"
              onClick={() => togglePanel('account')}
            >
              <User />
            </button>

            {/* السمة */}
            <button
              className="icon action-block"
              title="تبديل السمة"
              onClick={toggle}
              aria-pressed={theme === 'dark'}
              aria-label="تبديل السمة"
            >
              {theme === 'dark' ? '🌙' : '☀️'}
            </button>

            {/* الدخول / الخروج */}
            <div className="auth-inline action-block">
              {!user ? (
                <div className="auth-buttons">
                  {isDev && <button className="text-sm text-gray-600" onClick={() => loginAs('user')}>مستخدم</button>}
                  {isDev && <button className="text-sm text-gray-600" onClick={() => loginAs('seller')}>بائع</button>}
                  {isDev && <button className="text-sm text-gray-600" onClick={() => loginAs('admin')}>مدير</button>}
                </div>  
              ) : (
                <div className="auth-user">
                  <span className="user-greet">مرحبا، {user.name || user.role}</span>
                  <button className="text-sm text-gray-600" onClick={logout}>خروج</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* حاوية التوست */}
        {toasts.length > 0 && (
          <div className="toast-stack" style={{position:'fixed', top:10, left:10, zIndex:4000, display:'flex', flexDirection:'column', gap:8}} aria-live="polite" aria-atomic="false">
            {toasts.map(t => (
              <div key={t.id} className="toast-item" style={{
                background:'#0f172a', color:'#fff', padding:'10px 14px', borderRadius:10,
                fontSize:'.7rem', boxShadow:'0 4px 12px rgba(0,0,0,.25)', display:'flex', alignItems:'center', gap:8,
                direction:'rtl'
              }}>
                <span style={{fontWeight:600}}>{t.message}</span>
                <button onClick={()=> setToasts(ts=> ts.filter(x=>x.id!==t.id))} aria-label="إغلاق" style={{
                  background:'transparent', color:'#fff', border:0, cursor:'pointer', padding:2
                }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* لوحات الهيدر العصرية */}
      <div className={`panel-overlay${activePanel ? ' open' : ''}`} onClick={closePanels} aria-hidden={!activePanel}></div>
      <div className="header-panels" ref={panelsRef}>
        {/* لوحة المفضلة */}
        <section
          id="panel-wishlist"
          className={`floating-panel side right ${activePanel === 'wishlist' ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-wishlist-title"
        >
          <div className="panel-header">
            <h3 id="panel-wishlist-title">المفضلة</h3>
            <button className="panel-close" onClick={closePanels} aria-label="إغلاق">
              <X size={16} />
            </button>
          </div>
          <div className="panel-body scroll-y">
            {wishlistItems.length ? (
              <ul className="mini-list">
                {wishlistItems.map(w => (
                  <li key={w.id}>
                    <span className="item-title">{ localizeName({ name: w.name || w.title }, locale) }</span>
                    {w.price && <span className="item-price">{w.price} ر.س</span>}
                  </li>
                ))}
              </ul>
            ) : <div className="empty">لا توجد عناصر مفضلة</div>}
          </div>
          <div className="panel-footer">
            <Link to="/wishlist" onClick={closePanels} className="btn-outline w-full">الانتقال إلى صفحة المفضلة</Link>
          </div>
        </section>

        {/* لوحة السلة */}
        <section
          id="panel-cart"
          className={`floating-panel side right ${activePanel === 'cart' ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-cart-title"
        >
          <div className="panel-header">
            <h3 id="panel-cart-title">سلة المشتريات</h3>
            <button className="panel-close" onClick={closePanels} aria-label="إغلاق">
              <X size={16} />
            </button>
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
                        <img src={c.images?.[0] || c.image || '/images/placeholder.jpg'} alt={ localizeName({ name: c.name || c.title }, locale) || '' } style={{width:'100%',height:'100%',objectFit:'cover'}} />
                      </div>
                      <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:4}}>
                        <span style={{fontSize:'.7rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{ localizeName({ name: c.name || c.title }, locale) }</span>
                        <span style={{fontSize:'.6rem',color:'#475569'}}>{price.toFixed(2)} ر.س × {q} = <strong style={{color:'#0f172a'}}>{(price*q).toFixed(2)} ر.س</strong></span>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <button aria-label="إنقاص الكمية" onClick={()=> updateQuantity && updateQuantity(c.id, Math.max(1, q-1))} style={qtyBtnStyle}>-</button>
                        <span style={{fontSize:'.6rem',minWidth:18,textAlign:'center'}}>{q}</span>
                        <button aria-label="زيادة الكمية" onClick={()=> updateQuantity && updateQuantity(c.id, Math.min((maxPerItem||10), q+1))} style={qtyBtnStyle}>+</button>
                        <button aria-label="حذف" onClick={()=> removeFromCart && removeFromCart(c.id)} style={{background:'transparent',border:0,cursor:'pointer',color:'#dc2626',padding:4}}>
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <div className="empty">السلة فارغة</div>}
          </div>
          <div className="panel-summary">
            <div className="summary-row">
              <span>الإجمالي</span>
              <strong>{cartTotal.toFixed(2)} ر.س</strong>
            </div>
            {/* Hint: توصيل مجاني بعد حد معين */}
            {cartTotal < 200 && (
              <div className="free-ship-hint" style={{fontSize:'.65rem', color:'#334155', marginTop:4}}>
                أضِف {(200 - cartTotal).toFixed(2)} ر.س للحصول على شحن مجاني
              </div>
            )}
          </div>
          <div className="panel-footer gap">
            <Link to="/cart" onClick={closePanels} className="btn-outline w-full">تفاصيل السلة</Link>
            <Link to="/checkout" onClick={closePanels} className="btn-primary w-full">إتمام الشراء</Link>
          </div>

          {/* إضافة واجهة إدخال كوبون سريعة هنا */}
          {totals && (
            <div style={{marginTop:'.75rem',fontSize:'.65rem',display:'grid',gap:'.4rem'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span>المجموع:</span><strong>{totals.formatted.itemsTotal}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span>الشحن:</span><strong>{totals.formatted.shipping}</strong>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span>الضريبة:</span><strong>{totals.formatted.tax}</strong>
              </div>
              {totals.discount > 0 && (
                <div style={{display:'flex',justifyContent:'space-between',color:'#16a34a'}}>
                  <span>الخصم:</span><strong>-{totals.formatted.discount}</strong>
                </div>
              )}
              <div style={{height:1,background:'rgba(0,0,0,.08)',margin:'.35rem 0'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontWeight:700}}>
                <span>الإجمالي:</span><span>{totals.formatted.grandTotal}</span>
              </div>
              <form onSubmit={handleApplyCoupon} style={{display:'flex',gap:4,marginTop:6}}>
                {coupon
                  ? (
                    <button
                      type="button"
                      onClick={clearCoupon}
                      style={{background:'#dc2626',color:'#fff',border:0,padding:'6px 10px',borderRadius:8,fontSize:'.6rem',cursor:'pointer'}}
                    >إزالة {coupon.code}</button>
                  )
                  : (
                    <>
                      <input
                        value={couponInput}
                        onChange={e=>setCouponInput(e.target.value)}
                        placeholder="كود خصم"
                        style={{flex:1,padding:'6px 8px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:'.6rem'}}
                      />
                      <button
                        type="submit"
                        style={{background:'#1e293b',color:'#fff',border:0,padding:'6px 10px',borderRadius:8,fontSize:'.6rem',cursor:'pointer'}}
                      >تطبيق</button>
                    </>
                  )
                }
              </form>
              {couponMsg && <div style={{fontSize:'.55rem',color:'#334155'}}>{couponMsg}</div>}
            </div>
          )}
        </section>

        {/* لوحة الحساب */}
        <section
          id="panel-account"
          className={`floating-panel side right ${activePanel === 'account' ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-account-title"
        >
          <div className="panel-header">
            <h3 id="panel-account-title">الحساب</h3>
            <button className="panel-close" onClick={closePanels} aria-label="إغلاق">
              <X size={16} />
            </button>
          </div>
          <div className="panel-body">
            {!user ? (
              <div className="auth-quick">
                <p className="muted">سجّل دخولاً سريعاً لأغراض الاختبار:</p>
                <div className="quick-buttons">
                  {isDev && <button onClick={() => { loginAs('user'); closePanels(); }} className="btn-chip">مستخدم</button>}
                  {isDev && <button onClick={() => { loginAs('seller'); closePanels(); }} className="btn-chip">بائع</button>}
                  {isDev && <button onClick={() => { loginAs('admin'); closePanels(); }} className="btn-chip">مدير</button>}
                </div>
              </div>
            ) : (
              <div className="account-box">
                <div className="account-row">
                  <span className="label">الاسم:</span>
                  <span>{user.name || '—'}</span>
                </div>
                <div className="account-row">
                  <span className="label">الدور:</span>
                  <span>{user.role}</span>
                </div>
                <div className="account-actions">
                  <Link to="/account" onClick={closePanels} className="btn-outline w-full">الملف الشخصي</Link>
                  <button onClick={() => { logout(); closePanels(); }} className="btn-danger w-full">تسجيل خروج</button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* لوحة الميزات */}
        <section
          id="panel-features"
          className={`floating-panel side right ${activePanel === 'features' ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="panel-features-title"
        >
          <div className="panel-header">
            <h3 id="panel-features-title">الميزات / خارطة الطريق</h3>
            <button className="panel-close" onClick={closePanels} aria-label="إغلاق">
              <X size={16} />
            </button>
          </div>
          <div className="panel-body scroll-y">
            {Object.entries(featurePhases).map(([phase, group]) => (
              <div key={phase} style={{ marginBottom:'1rem' }}>
                <h4 style={{ margin:'0 0 .5rem', fontSize:'.78rem', letterSpacing:'.5px', color:'#334155' }}>
                  {phase === 'phase1' ? 'المرحلة 1 (أساسي)' :
                   phase === 'phase2' ? 'المرحلة 2 (متوسط)' :
                   phase === 'phase3' ? 'المرحلة 3 (متقدم)' : phase}
                </h4>
                <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:'.35rem' }}>
                  {Object.entries(group).map(([k,v]) => (
                    <li key={k} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      background:'rgba(0,0,0,0.04)', padding:'.45rem .6rem', borderRadius:8,
                      fontSize:'.65rem'
                    }}>
                      <span style={{ textTransform:'none' }}>{k}</span>
                      <span style={{
                        fontSize:'.55rem',
                        padding:'.25rem .5rem',
                        borderRadius:20,
                        background: v ? 'linear-gradient(90deg,#69be3c,#f6ad55)' : '#e2e8f0',
                        color: v ? '#fff':'#334155',
                        fontWeight:600,
                        letterSpacing:'.5px'
                      }}>{v ? 'ON' : 'OFF'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!featurePhases || !Object.keys(featurePhases).length && (
              <div className="empty">لا توجد بيانات ميزات</div>
            )}
            <div style={{ fontSize:'.6rem', color:'#64748b', marginTop:'1rem' }}>
              اختصار لوحة الميزات: ? / البحث: /
            </div>
          </div>
          <div className="panel-footer">
            <button
              type="button"
              onClick={() => {
                // مستقبلاً: فتح إعدادات متقدمة
                closePanels();
              }}
              className="btn-outline w-full"
              style={{ fontSize:'.65rem' }}
            >إغلاق</button>
          </div>
        </section>

        {/* === لوحة إدارة الطلبات (مضافة) === */}
        {user?.role === 'admin' && (
          <section
            id="panel-admin-orders"
            className={`floating-panel side right ${activePanel === 'admin-orders' ? 'open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-admin-orders-title"
          >
            <div className="panel-header">
              <h3 id="panel-admin-orders-title">إدارة الطلبات</h3>
              <button className="panel-close" onClick={closePanels} aria-label="إغلاق"><X size={16} /></button>
            </div>
            <div className="panel-body scroll-y" style={{ gap:'.75rem' }}>
              <button
                type="button"
                onClick={()=>openAdminModal('order')}
                className="btn-primary"
                style={{ alignSelf:'flex-start', fontSize:'.6rem', padding:'.45rem .75rem' }}
              >+ طلب جديد</button>
              {orders && orders.length > 0 ? (
                <ul className="mini-list" style={{ fontSize:'.68rem' }}>
                  {orders.map(o => (
                    <li key={o.id} style={{ padding:'.55rem .6rem' }}>
                      <span className="item-title">#{o.id}</span>
                      <span className="item-meta">{o.customer?.name || o.customer?.fullName || 'عميل'}</span>
                      <span className="item-price">{(o.totals?.grandTotal || 0)} ر.س</span>
                      <div style={{ display:'flex', gap:'.35rem', marginTop:'.45rem', flexWrap:'wrap' }}>
                        <button
                          type="button"
                          onClick={()=>editOrderFromPanel(o)}
                          style={{ background:'#f1f5f9', border:0, borderRadius:8, padding:'.35rem .55rem', fontSize:'.55rem', cursor:'pointer' }}
                        >تعديل</button>
                        <button
                          type="button"
                          onClick={()=>handleDeleteOrderDirect(o.id)}
                          style={{ background:'#dc2626', color:'#fff', border:0, borderRadius:8, padding:'.35rem .55rem', fontSize:'.55rem', cursor:'pointer' }}
                        >حذف</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <div className="empty">لا توجد طلبات</div>}
            </div>
            <div className="panel-footer">
              <button type="button" onClick={closePanels} className="btn-outline w-full" style={{ fontSize:'.6rem' }}>إغلاق</button>
            </div>
          </section>
        )}
      </div>

      {/* ===== Admin Modal ===== */}
      {adminModal.open && (
        <div
          className="admin-modal-layer"
          style={{
            position:'fixed', inset:0, zIndex:1600,
            background:'rgba(15,23,42,0.45)',
            WebkitBackdropFilter:'blur(4px)', // دعم Safari
            backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:'1.25rem'
          }}
        >
          <div
            ref={adminModalRef}
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
            style={{
              width:'min(620px,100%)',
              background:'#fff',
              borderRadius:20,
              boxShadow:'0 18px 48px -12px rgba(0,0,0,.3)',
              display:'flex',
              flexDirection:'column',
              maxHeight:'90vh',
              overflow:'hidden',
              direction:'rtl'
            }}
          >
            <div style={{
              background:'linear-gradient(90deg,#69be3c,#f6ad55)',
              color:'#fff', padding:'1rem 1.25rem',
              display:'flex', alignItems:'center', justifyContent:'space-between'
            }}>
              <h3 id="admin-modal-title" style={{ margin:0, fontSize:'1rem', fontWeight:600 }}>
                {adminModal.edit
                  ? `تعديل ${adminModal.type === 'product' ? 'منتج' : adminModal.type === 'user' ? 'مستخدم' : 'طلب'}`
                  : `إضافة ${adminModal.type === 'product' ? 'منتج' : adminModal.type === 'user' ? 'مستخدم' : 'طلب'}`}
              </h3>
              <button
                type="button"
                onClick={closeAdminModal}
                style={{
                  background:'rgba(255,255,255,0.25)', border:0,
                  width:36, height:36, borderRadius:12,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', color:'#fff'
                }}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{
                padding:'1.1rem 1.25rem 1.35rem',
                overflowY:'auto',
                display:'flex', flexDirection:'column', gap:'.95rem'
              }}
            >
              {adminModal.type === 'product' && (
                <div style={modalGrid}>
                  <input
                    placeholder="اسم المنتج"
                    required
                    value={formData.name}
                    onChange={e => onChange('name', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="السعر"
                    required
                    value={formData.price}
                    onChange={e => onChange('price', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="المخزون"
                    required
                    value={formData.stock}
                    onChange={e => onChange('stock', e.target.value)}
                  />
                  <select
                    value={formData.status}
                    onChange={e => onChange('status', e.target.value)}
                  >
                    <option value="active">نشط</option>
                    <option value="draft">مسودة</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
              )}

              {adminModal.type === 'user' && (
                <div style={modalGrid}>
                  <input
                    placeholder="اسم المستخدم"
                    required
                    value={formData.name}
                    onChange={e => onChange('name', e.target.value)}
                  />
                  <select
                    value={formData.role}
                    onChange={e => onChange('role', e.target.value)}
                  >
                    <option value="user">مستخدم</option>
                    <option value="seller">بائع</option>
                    <option value="admin">مدير</option>
                  </select>
                  <select
                    value={formData.active ? '1' : '0'}
                    onChange={e => onChange('active', e.target.value === '1')}
                  >
                    <option value="1">مفعل</option>
                    <option value="0">موقوف</option>
                  </select>
                </div>
              )}

              {adminModal.type === 'order' && (
                <div style={modalGrid}>
                  <input
                    placeholder="اسم العميل"
                    required
                    value={formData.customer}
                    onChange={e => onChange('customer', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="الإجمالي"
                    required
                    value={formData.total}
                    onChange={e => onChange('total', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="عدد العناصر"
                    required
                    value={formData.items}
                    onChange={e => onChange('items', e.target.value)}
                  />
                  <select
                    value={formData.status}
                    onChange={e => onChange('status', e.target.value)}
                  >
                    <option value="pending">معلق</option>
                    <option value="paid">مدفوع</option>
                    <option value="shipped">تم الشحن</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              )}

              <div style={{
                display:'flex', gap:'.6rem', flexWrap:'wrap',
                marginTop:'.35rem'
              }}>
                <button
                  type="submit"
                  style={saveBtn}
                >
                  {adminModal.edit ? 'حفظ' : 'إضافة'}
                </button>
                {adminModal.edit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    style={deleteBtn}
                  >
                    حذف
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeAdminModal}
                  style={cancelBtn}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ===== /Admin Modal ===== */}
    </>
  );
};

// أنماط داخلية للمودال (استخدام كائنات تسهيلاً)
const modalGrid = {
  display:'grid',
  gap:'.65rem',
  gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'
};
const baseBtn = {
  border:0,
  cursor:'pointer',
  fontWeight:600,
  fontSize:'.75rem',
  padding:'.65rem 1.05rem',
  borderRadius:10,
  display:'inline-flex',
  alignItems:'center',
  justifyContent:'center',
  letterSpacing:'.3px'
};
const saveBtn = {
  ...baseBtn,
  background:'linear-gradient(90deg,#69be3c,#f6ad55)',
  color:'#fff',
  boxShadow:'0 6px 18px -8px rgba(0,0,0,.35)'
};
const deleteBtn = {
  ...baseBtn,
  background:'#dc2626',
  color:'#fff'
};
const cancelBtn = {
  ...baseBtn,
  background:'#f1f5f9',
  color:'#334155'
};

export default Header;
import React, { useState, createContext, useCallback, useMemo, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import { ToastProvider } from './components/ui/ToastProvider';
import Footer from './components/Footer';
import Preloader from './components/Preloader';
import Sidebar from './components/Sidebar';

// New contexts and pages
import { AuthProvider } from './context/AuthContext';
import { OrdersProvider, useOrders } from './context/OrdersContext';
import { ReviewsProvider } from './context/ReviewsContext';
import { AdminProvider } from './context/AdminContext';
import TawkProvider from './components/TawkProvider';

// استبدال الاستيرادات المباشرة للصفحات بـ lazy لتحسين الأداء
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetails = lazy(() => import('./pages/OrderDetails'));
const ProductManager = lazy(() => import('./pages/seller/ProductManager'));
const Account = lazy(() => import('./pages/account/Account'));
const Blog = lazy(() => import('./pages/Blog'));
const Offers = lazy(() => import('./pages/Offers'));
const Categories = lazy(() => import('./pages/Categories'));
const Category = lazy(() => import('./pages/Category'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Vendor = lazy(() => import('./pages/Vendor'));
const Collections = lazy(() => import('./pages/Collections'));
const Brands = lazy(() => import('./pages/Brands'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const Checkout = lazy(() => import('./pages/Checkout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const PaymentMethod = lazy(() => import('./pages/PaymentMethod'));
const PaymentSelect = lazy(() => import('./pages/PaymentSelect'));
const PaymentProcessing = lazy(() => import('./pages/PaymentProcessing'));

// ErrorBoundary داخلي بسيط
class AppErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={ hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(e){ console.error('App crashed:', e); }
  render(){
    if(this.state.hasError) return <div style={{padding:'2rem', textAlign:'center'}}>حدث خطأ غير متوقع، أعد المحاولة.</div>;
    return this.props.children;
  }
}

// سياق جديد لإتمام الشراء
export const CheckoutContext = createContext(null);

function CheckoutProvider({ children }) {
  const { cartItems = [], clearCart } = useCart();
  const { addOrder } = useOrders?.() || {};
  const CURRENCY_CODE = 'SAR';
  const formatCurrency = (val) =>
    new Intl.NumberFormat('ar-SA', { style: 'currency', currency: CURRENCY_CODE }).format(+val || 0);

  // دالة تقريب آمنة لتفادي 249.95000000000002
  const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

  // حالة الكوبون
  const [coupon, setCoupon] = useState(null); // { code, type:'percent'|'fixed', value }
  const applyCoupon = useCallback((code) => {
    // أمثلة ثابتة (يمكن استبدالها بنداء API)
    const bank = {
      SAVE10: { code:'SAVE10', type:'percent', value:10 },
      FLAT25: { code:'FLAT25', type:'fixed', value:25 }
    };
    const found = bank[code.toUpperCase()];
    if (!found) return { success:false, reason:'invalid' };
    setCoupon(found);
    return { success:true, coupon:found };
  }, []);
  const clearCoupon = useCallback(()=> setCoupon(null), []);

  const totals = useMemo(() => {
    const rawItemsTotal = cartItems.reduce((s,i)=> s + ((i.price || i.salePrice || 0) * (i.quantity || 1)), 0);
    const itemsTotal = round2(rawItemsTotal);
    const shipping = itemsTotal > 0 ? 25 : 0;
    const tax = round2(itemsTotal * 0.15);
    const discount = coupon
      ? round2(coupon.type === 'percent'
          ? itemsTotal * (coupon.value/100)
          : Math.min(coupon.value, itemsTotal))
      : 0;
    const grandTotal = round2(itemsTotal + shipping + tax - discount);
    return {
      itemsTotal, shipping, tax, discount, grandTotal,
      formatted: {
        itemsTotal: formatCurrency(itemsTotal),
        shipping: formatCurrency(shipping),
        tax: formatCurrency(tax),
        discount: formatCurrency(discount),
        grandTotal: formatCurrency(grandTotal)
      }
    };
  }, [cartItems, coupon]);

  const [lastOrder, setLastOrder] = useState(null);

  const placeOrder = useCallback(async (payload = {}) => {
    if (!cartItems.length) return { success:false, reason:'empty_cart' };
    const order = {
      id: Date.now().toString(),
      status: 'pending',
      currency: 'SAR',
      coupon: coupon ? { ...coupon } : null,
      items: cartItems.map(i => {
        const unit = i.price || i.salePrice || 0;
        const qty = i.quantity || 1;
        const subtotal = round2(unit * qty);
        return {
          id: i.id,
            title: i.title,
          price: unit,
          quantity: qty,
          subtotal,
          subtotalFormatted: formatCurrency(subtotal)
        };
      }),
      totals: { ...totals, currency:'SAR' },
      payment: payload.payment || { method:'cod' },
      shipping: payload.shipping || {},
      customer: payload.customer || {},
      notes: payload.notes || '',
      createdAt: new Date().toISOString()
    };
    try {
      if (addOrder) addOrder(order);
      else {
        const draft = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
        draft.push(order);
        localStorage.setItem('pendingOrders', JSON.stringify(draft));
      }
      clearCart && clearCart();
      setLastOrder(order);
      return { success:true, order };
    } catch(e) {
      console.error('Failed to place order', e);
      return { success:false, error:e.message };
    }
  }, [cartItems, totals, addOrder, clearCart, coupon, formatCurrency]);

  // دالة بدء الدفع: فقط تُستخدم لإعادة التوجيه من صفحة Checkout إلى صفحة الدفع
  const startPayment = (payMethod='card') => {
    switch (payMethod) {
      case 'applepay': return '/checkout/payment/applepay';
      case 'mada': return '/checkout/payment/mada';
      case 'card':
      default: return '/checkout/payment';
    }
  };

  const ctxValue = useMemo(()=>({
    cartItems,
    totals,
    currency: 'SAR',
    formatCurrency,
    placeOrder,
    startPayment,
    coupon,
    applyCoupon,
    clearCoupon,
    lastOrder
  }), [cartItems, totals, placeOrder, coupon, applyCoupon, clearCoupon, lastOrder]);

  return <CheckoutContext.Provider value={ctxValue}>{children}</CheckoutContext.Provider>;
}

// ====== (1) سياق الدفع الجديد المدمج (يدعم card / cod / applepay / mada) ======
export const PaymentContext = createContext(null);

function PaymentProvider({ children }) {
  const { placeOrder, totals, currency } = React.useContext(CheckoutContext) || {};
  const [method, setMethod] = useState(null);          // card | cod | applepay | mada
  const [status, setStatus] = useState('idle');        // idle | preparing | processing | succeeded | failed
  const [error, setError] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const reset = useCallback(() => {
    setMethod(null);
    setStatus('idle');
    setError(null);
    setTransactionId(null);
  }, []);

  // محاكاة بسيطة لبوابة دفع
  const simulateNetwork = (ms = 600) => new Promise(r => setTimeout(r, ms));

  const selectMethod = useCallback(async (m) => {
    reset();
    setMethod(m);
    if (m === 'cod') {
      // دفع عند الاستلام ينفذ أمر الشراء مباشرة
      setStatus('processing');
      const res = await placeOrder({ payment: { method: 'cod' } });
      if (res?.success) {
        setTransactionId('cod-' + res.order.id);
        setStatus('succeeded');
      } else {
        setError(res?.error || 'فشل تنفيذ الطلب');
        setStatus('failed');
      }
      return;
    }
    // الوسائل الأخرى تحتاج تهيئة intent (وهمية هنا)
    setStatus('preparing');
    await simulateNetwork(400);
    setStatus('processing');
  }, [placeOrder, reset]);

  // تأكيد الدفع للوسائل الإلكترونية
  const confirmPayment = useCallback(async () => {
    if (!method) return { success: false, error: 'لم يتم اختيار وسيلة' };
    if (method === 'cod') return { success: false, error: 'لا حاجة للتأكيد مع COD' };
    setStatus('processing');
    await simulateNetwork(900);

    // نسب فشل مختلفة
    const failRate = method === 'applepay'
      ? 0.05
      : method === 'mada'
        ? 0.07
        : 0.08; // افتراضي (مثلاً بطاقات عادية)

    if (Math.random() < failRate) {
      setError('فشل في بوابة الدفع، حاول مرة أخرى');
      setStatus('failed');
      return { success: false, error: 'gateway_failed' };
    }

    const tx = method + '_' + Math.floor(Math.random() * 1e8);
    setTransactionId(tx);

    // إنشاء الطلب بعد نجاح الحجز
    const orderRes = await placeOrder({
      payment: {
        method,
        transactionId: tx
      }
    });
    if (orderRes?.success) {
      setStatus('succeeded');
      return { success: true, order: orderRes.order };
    } else {
      setError(orderRes?.error || 'فشل إنشاء الطلب بعد الدفع');
      setStatus('failed');
      return { success: false, error: 'order_create_failed' };
    }
  }, [method, placeOrder]);

  const ctxValue = useMemo(() => ({
    method, status, error, totals, currency, transactionId,
    selectMethod, confirmPayment, reset
  }), [method, status, error, totals, currency, transactionId, selectMethod, confirmPayment, reset]);

  return (
    <PaymentContext.Provider value={ctxValue}>
      {children}
    </PaymentContext.Provider>
  );
}
// ====== /End Payment Context ======

// ====== (2) توسيع startPayment لدعم تمرير نوع الوسيلة ======

// ====== /End startPayment update ======

// ====== (3) صفحات داخلية بسيطة لــ Apple Pay و مدى (Inline Components) ======
const ApplePayPage = () => {
  const { method, status, error, totals, selectMethod, confirmPayment, reset } = React.useContext(PaymentContext);
  React.useEffect(() => {
    if (method !== 'applepay') selectMethod('applepay');
  // eslint-disable-next-line
  }, [method]);

  return (
    <div style={payBox}>
      <h2 style={h2Style}>Apple Pay </h2>
      {totals && <p style={pStyle}>الإجمالي: <strong>{totals.formatted.grandTotal}</strong></p>}
      {status === 'preparing' && <p style={muted}>تهيئة التفويض...</p>}
      {status === 'processing' && <p style={muted}>جاري تنفيذ المعاملة...</p>}
      {status === 'failed' && (
        <div style={errBox}>
          {error || 'فشل العملية'}
          <div style={{ marginTop: 8 }}>
            <button style={retryBtn} onClick={() => { reset(); selectMethod('applepay'); }}>إعادة المحاولة</button>
          </div>
        </div>
      )}
      {status === 'succeeded' && <div style={okBox}>تم الدفع بنجاح ✅</div>}
      {(status === 'processing' || status === 'preparing') ? null : (
        status === 'succeeded'
          ? null
          : <button style={primaryBtn} disabled={status === 'processing' || status === 'preparing'} onClick={confirmPayment}>ادفع الآن</button>
      )}
    </div>
  );
};

const MadaPayPage = () => {
  const { method, status, error, totals, selectMethod, confirmPayment, reset } = React.useContext(PaymentContext);
  React.useEffect(() => {
    if (method !== 'mada') selectMethod('mada');
  // eslint-disable-next-line
  }, [method]);

  return (
    <div style={payBox}>
      <h2 style={h2Style}>مدى Mada</h2>
      {totals && <p style={pStyle}>الإجمالي: <strong>{totals.formatted.grandTotal}</strong></p>}
      {status === 'preparing' && <p style={muted}>تهيئة التفويض...</p>}
      {status === 'processing' && <p style={muted}>جاري تنفيذ المعاملة...</p>}
      {status === 'failed' && (
        <div style={errBox}>
          {error || 'فشل العملية'}
          <div style={{ marginTop: 8 }}>
            <button style={retryBtn} onClick={() => { reset(); selectMethod('mada'); }}>إعادة المحاولة</button>
          </div>
        </div>
      )}
      {status === 'succeeded' && <div style={okBox}>تم الدفع بنجاح ✅</div>}
      {(status === 'processing' || status === 'preparing') ? null : (
        status === 'succeeded'
          ? null
          : <button style={primaryBtn} disabled={status === 'processing' || status === 'preparing'} onClick={confirmPayment}>ادفع الآن</button>
      )}
    </div>
  );
};

// أنماط داخلية بسيطة
const payBox = { maxWidth: 480, margin: '2rem auto', background: '#fff', padding: '1.5rem 1.75rem', borderRadius: 14, boxShadow: '0 8px 24px -10px rgba(0,0,0,.08)', direction: 'rtl' };
const h2Style = { margin: '0 0 1rem', fontSize: '1.25rem' };
const pStyle = { margin: '0 0 1rem', fontSize: '.85rem', color: '#334155' };
const muted = { fontSize: '.8rem', color: '#64748b', margin: 0 };
const primaryBtn = { background: 'linear-gradient(90deg,#69be3c,#f6ad55)', color: '#fff', padding: '.8rem 1.1rem', border: 0, borderRadius: 10, fontSize: '.85rem', fontWeight: 600, cursor: 'pointer' };
const retryBtn = { background: '#1e293b', color: '#fff', padding: '.55rem .9rem', border: 0, borderRadius: 8, fontSize: '.75rem', cursor: 'pointer' };
const errBox = { background: '#fef2f2', color: '#b91c1c', padding: '.75rem .9rem', borderRadius: 10, fontSize: '.8rem' };
const okBox = { background: '#ecfdf5', color: '#047857', padding: '.75rem .9rem', borderRadius: 10, fontSize: '.8rem', marginBottom: '.75rem' };

// ==== Features Context ====
export const FeaturesContext = createContext(null);
function FeaturesProvider({ children }) {
  const phases = {
    phase1: {
      multiVendor: true,
      products: true,
      orders: true,
      payments: true,
      shipping: true,
      basicSecurity: true,
      wishlist: true,
      cart: true,
      search: true
    },
    phase2: {
      advancedReports: false,
      marketing: false,
      supportCenter: false
    },
    phase3: {
      aiRecommender: false,
      dynamicPricing: false,
      fraudDetection: false
    }
  };
  const value = useMemo(() => ({
    phases,
    list: () => phases,
    isEnabled: (key) => Object.values(phases).some(g => g[key])
  }), [phases]);
  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}
// ==== /Features Context ====

const GlobalCompatStyles = () => (
  <style>{`
    /* Compatibility patch: appearance */
    select,
    input[type=search],
    input[type=number],
    input[type=date],
    input[type=text],
    button,
    textarea {
      appearance: auto;
      -webkit-appearance: auto;
    }

    /* Patch: add touch-action alongside legacy -ms-touch-action */
    [role=button],
    button,
    a,
    .swipe-area,
    .draggable,
    .touch-manipulate {
      touch-action: manipulation;
      -ms-touch-action: manipulation; /* legacy (won't affect modern browsers) */
    }
  `}</style>
);

import PaymentStatusWatcher from './components/PaymentStatusWatcher';
import OrderEventsListener from './components/OrderEventsListener';
import { useToast } from './components/ui/ToastProvider';
import { useOrders } from './context/OrdersContext';
import ProtectedRoute from './components/ProtectedRoute';
import { MarketingProvider } from './context/MarketingContext';

function App() {
  // حالة إظهار / إخفاء القائمة الجانبية (تبقى هنا)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(o => !o);
  const { refresh } = useOrders() || {};
  const { push: pushToast } = useToast?.() || {};

  // ضبط الاتجاه عالمياً
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('dir', 'rtl');
    html.setAttribute('lang', 'ar');
    document.body.classList.add('rtl');
    return () => {
      // (إبقاء RTL عادة، لكن في حال تفكيك التطبيق)
      // html.removeAttribute('dir');
      // html.removeAttribute('lang');
      // document.body.classList.remove('rtl');
    };
  }, []);

  return (
    <>
      {/* wrap providers: Auth -> Orders -> Reviews -> Store -> Theme -> Cart -> Wishlist */}
      <AuthProvider>
        <OrdersProvider>
          <ReviewsProvider>
            <StoreProvider>
              <ThemeProvider>
                <CartProvider>
                  <WishlistProvider>
                    <AdminProvider>
                      <FeaturesProvider>
                        <MarketingProvider>
                        <Router>
                          <GlobalCompatStyles />
                          <div className="rtl-app" dir="rtl" style={{ direction:'rtl' }}>
                            {/* رابط تخطي للمحتوى (تحسين الوصول) */}
                            <a href="#main-content" className="skip-link">تخطي إلى المحتوى</a>
                            <Preloader />
                            <ToastProvider>
                            {/* Listen to realtime order events and refresh orders */}
                            <OrderEventsListener onOrderEvent={(type, payload) => {
                              try {
                                refresh && refresh();
                                if (pushToast && payload?.orderId) {
                                  const msg = type === 'order.updated' ? 'تم تحديث حالة الطلب' : 'تم إنشاء طلب جديد'
                                  pushToast(`${msg} (#${payload.orderId})`, { type: 'success', ttl: 2500 })
                                }
                              } catch {}
                            }} />
                            <Header
                              sidebarOpen={sidebarOpen}
                              onToggleSidebar={toggleSidebar}
                            />
                            <div className="app-layout professional-layout">
                              {sidebarOpen && (
                                <div id="app-sidebar">
                                  <Sidebar />
                                </div>
                              )}
                              <main id="main-content" className="site-main content-with-sidebar">
                                <AppErrorBoundary>
                                  <Suspense fallback={<div style={{padding:'2rem', textAlign:'center'}}>جاري التحميل...</div>}>
                                    <CheckoutProvider>
                                      <PaymentProvider>
                                        {typeof PaymentStatusWatcher === 'function' && <PaymentStatusWatcher />}
                                        <Routes>
                                          <Route path="/" element={<Home />} />
                                          <Route path="/products" element={<Products />} />
                                          <Route path="/product/:id" element={<ProductDetails />} />
                                          <Route path="/cart" element={<Cart />} />
                                          <Route path="/checkout" element={
                                            <ProtectedRoute requireCart>
                                              <Checkout />
                                            </ProtectedRoute>
                                          } />
                                          <Route path="/about" element={<About />} />
                                          <Route path="/contact" element={<Contact />} />
                                          <Route path="/blog" element={<Blog />} />
                                          <Route path="/offers" element={<Offers />} />
                                          <Route path="/categories" element={<Categories />} />
                                          <Route path="/category/:slug" element={<Category />} />
                                          <Route path="/wishlist" element={<Wishlist />} />
                                          <Route path="/search" element={<SearchResults />} />
                                          <Route path="/terms" element={<Terms />} />
                                          <Route path="/privacy" element={<Privacy />} />
                                          <Route path="/faq" element={<FAQ />} />
                                          <Route path="/vendor/:id" element={<Vendor />} />
                                          <Route path="/collections" element={<Collections />} />
                                          <Route path="/brands" element={<Brands />} />
                                          <Route path="/checkout/success" element={<CheckoutSuccess />} />
                                          {/* alias لمسار مكتوب بحروف كبيرة أو بصيغة مختلفة */}
                                          <Route path="/CheckoutSuccess" element={<Navigate to="/checkout/success" replace />} />
                                          {/* يمكن إضافة صيغ أخرى عند الحاجة */}
                                          <Route path="/checkout/payment" element={<PaymentSelect />} />
                                          <Route path="/checkout/payment/card" element={<PaymentMethod />} />
                                          <Route path="/checkout/payment/processing" element={<PaymentProcessing />} />
                                          <Route path="/checkout/payment/applepay" element={<ApplePayPage />} />
                                          <Route path="/checkout/payment/mada" element={<MadaPayPage />} />

                                          {/* dashboards */}
                                          <Route path="/admin" element={<AdminDashboard />} />
                                          <Route path="/seller" element={<SellerDashboard />} />
                                          <Route path="/orders" element={<Orders />} />
                                          <Route path="/order/:id" element={<OrderDetails />} />
                                          <Route path="/seller/products" element={<ProductManager />} />
                                          <Route path="/account" element={<Account />} />
                                        </Routes>
                                      </PaymentProvider>
                                    </CheckoutProvider>
                                  </Suspense>
                                </AppErrorBoundary>
                              </main>
                            </div>
                            <Footer />
                            </ToastProvider>
                          </div>
                        </Router>
                        </MarketingProvider>
                      </FeaturesProvider>
                    </AdminProvider>
                  </WishlistProvider>
                </CartProvider>
              </ThemeProvider>
            </StoreProvider>
          </ReviewsProvider>
        </OrdersProvider>
      </AuthProvider>
    </>
  );
}

export default App;
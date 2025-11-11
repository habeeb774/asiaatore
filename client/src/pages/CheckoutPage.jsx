import React, { useState, useMemo, useEffect } from 'react';
import ReactLeafletCompat from '../utils/reactLeafletCompat';
import * as paymentService from '../services/paymentService';
import { useCart } from '../stores/CartContext';
import { useAuth } from '../stores/AuthContext';
import { localizeName } from '../utils/locale';
import { useLanguage } from '../stores/LanguageContext';
import api from '../services/api/client';
import Button, { ButtonLink } from '../components/ui/Button';
import { useSettings } from '../stores/SettingsContext';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart() || {};
  const { user } = useAuth() || {};
  const { setting } = useSettings() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';
  const stripe = useStripe();
  const elements = useElements();

  const [open, setOpen] = useState({ address: true, payment: false, review: false, realpay: false, complete: false });
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));
  const ADDRESS_KEY = 'my_store_checkout_address';
  const loadAddress = () => {
    try { const raw = localStorage.getItem(ADDRESS_KEY); if (raw) return JSON.parse(raw); } catch {}
    return { name: user?.name || '', email: user?.email || '', country: 'SA', city: '', line1: '', phone: '', geo: null };
  };
  const [addr, setAddr] = useState(loadAddress);
  const [coords, setCoords] = useState(() => (loadAddress()?.geo || null));
  const [geolocating, setGeolocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addrId, setAddrId] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const COUPON_KEY = 'my_store_last_coupon';
  const [coupon, setCoupon] = useState(()=>{ try { return localStorage.getItem(COUPON_KEY)||''; } catch { return ''; } });
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponValidating, setCouponValidating] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  // Compute enabled payment methods from settings
  const enabledPayments = useMemo(() => {
    const s = setting || {};
    // Defaults: enable COD/bank/STC when not explicitly disabled; PayPal off by default
    return {
      cod: s.payCodEnabled !== false,
      bank: s.payBankEnabled !== false,
      stc: !!s.payStcEnabled,
      paypal: !!s.payPaypalEnabled,
      stripe: !!s.payStripeEnabled,
    };
  }, [setting]);
  const paymentOptions = useMemo(() => (
    ['cod','paypal','stc','bank','stripe'].filter(k => enabledPayments[k])
  ), [enabledPayments]);
  // Ensure selected method remains valid if settings change
  useEffect(() => {
    if (!paymentOptions.includes(paymentMethod) && paymentOptions.length) {
      setPaymentMethod(paymentOptions[0]);
    }
  }, [paymentOptions, paymentMethod]);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [bankInfo, setBankInfo] = useState(null);
  // Mobile swipe navigation
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  // Payment processing state
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [paypalButtonsVisible, setPaypalButtonsVisible] = useState(false);
  const [stcSession, setStcSession] = useState(null);
  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [stripeCardComplete, setStripeCardComplete] = useState(false);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left: go forward
      if (open.address && validate()) proceedAddress();
      else if (open.payment) goReview();
      else if (open.review) openRealPayment();
    } else if (isRightSwipe) {
      // Swipe right: go back
      if (open.realpay) setOpen(o => ({ ...o, realpay: false, review: true }));
      else if (open.review) setOpen(o => ({ ...o, review: false, payment: true }));
      else if (open.payment) setOpen(o => ({ ...o, payment: false, address: true }));
    }
  };

  // Auto-save address with debounce
  const saveAddressDebounced = useMemo(
    () => debounce(async (addressData) => {
      if (!user || !validate()) return;
      try {
        setSavingAddress(true);
        await api.addressesCreate(addressData);
        setAddressSaved(true);
        setTimeout(() => setAddressSaved(false), 2000);
      } catch (e) {
        console.warn('Auto-save address failed:', e);
      } finally {
        setSavingAddress(false);
      }
    }, 2000),
    [user]
  );

  // Debounce utility
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const subtotal = useMemo(()=> (cartItems||[]).reduce((s,i)=> s + (i.price||0)*(i.quantity||1),0), [cartItems]);

  // Distance-based shipping quote via backend
  useEffect(()=> {
    const run = async () => {
      const city = (addr.city||'').trim();
      if (!city) { setShippingCost(0); setShippingInfo(null); return; }
      try {
        const q = await api.shippingQuote({ city, country: addr.country, geo: addr?.geo || null });
        if (q?.ok) {
          setShippingCost(Number(q.shipping)||0);
          setShippingInfo({
            method: q.method,
            distanceKm: q.distanceKm,
            cityMatched: q.cityMatched,
            etaHoursMin: q.etaHoursMin,
            etaHoursMax: q.etaHoursMax,
            etaDaysMin: q.etaDaysMin,
            etaDaysMax: q.etaDaysMax,
          });
        } else {
          setShippingCost(25);
          setShippingInfo(null);
        }
      } catch {
        setShippingCost(25);
        setShippingInfo(null);
      }
    };
    run();
  }, [addr.city, addr.country, addr?.geo?.lat, addr?.geo?.lng]);

  const validateField = (name, value) => {
    const v = (value ?? '').toString();
    switch (name) {
      case 'name':
        return v.trim() ? '' : 'الاسم مطلوب';
      case 'email':
        return v.includes('@') && /.+@.+\..+/.test(v) ? '' : 'بريد غير صالح';
      case 'city':
        return v.trim() ? '' : 'المدينة مطلوبة';
      case 'line1':
        return v.trim() ? '' : 'العنوان مطلوب';
      case 'phone':
        return v.trim() ? '' : 'الهاتف مطلوب';
      default:
        return '';
    }
  };

  const validate = () => {
    const e = {
      name: validateField('name', addr.name),
      email: validateField('email', addr.email),
      city: validateField('city', addr.city),
      line1: validateField('line1', addr.line1),
      phone: validateField('phone', addr.phone),
    };
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    setErrors(e);
    // mark fields as touched so inline errors become visible after validation
    setTouched(t => ({ ...t, name: true, email: true, city: true, line1: true, phone: true }));
    return Object.keys(e).length === 0;
  };

  const focusFirstInvalidField = () => {
    try {
      const order = ['name','email','city','line1','phone'];
      const first = order.find(k => !!errors[k]) || order.find(k => validateField(k, addr[k]));
      if (!first) return;
      const id = `shipping-${first === 'line1' ? 'address' : first}`;
      const el = document.getElementById(id);
      if (el && typeof el.focus === 'function') {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Enhanced focus indicator
        try {
          el.classList.add('field-error-focus');
          setTimeout(() => el.classList.remove('field-error-focus'), 2000);
        } catch {}
      }
    } catch (e) { /* no-op */ }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to proceed to next step
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (open.address && validate()) {
          proceedAddress();
        } else if (open.payment) {
          goReview();
        } else if (open.review) {
          openRealPayment();
        }
      }
      // Escape to go back
      else if (e.key === 'Escape') {
        if (open.realpay) {
          setOpen(o => ({ ...o, realpay: false, review: true }));
        } else if (open.review) {
          setOpen(o => ({ ...o, review: false, payment: true }));
        } else if (open.payment) {
          setOpen(o => ({ ...o, payment: false, address: true }));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, addr]);
  useEffect(()=>{
    // Load saved addresses for logged-in user
    let live = true;
    (async () => {
      if (!user) return;
      try {
        const res = await api.addressesList();
        const items = res.addresses || res.items || [];
        if (!live) return;
        setSavedAddresses(items);
        const def = items.find(a => a.isDefault) || items[0];
        if (def) {
          setAddrId(def.id);
          setAddr(a => ({ ...a, name: def.name || a.name, email: a.email, country: def.country || a.country, city: def.city || a.city, line1: def.street || a.line1, phone: def.phone || a.phone }));
        }
      } catch {}
    })();
    return () => { live = false };
  }, [user?.id]);

  const discountFromCoupon = couponApplied?.amount || 0;
  const taxableBase = Math.max(0, subtotal - discountFromCoupon);
  const tax = +(taxableBase * 0.15).toFixed(2);
  const grandTotal = +(taxableBase + tax + (shippingCost || 0)).toFixed(2);

  // Memoized form validation to prevent calling validate() during render
  const isFormValid = useMemo(() => {
    const e = {
      name: validateField('name', addr.name),
      email: validateField('email', addr.email),
      city: validateField('city', addr.city),
      line1: validateField('line1', addr.line1),
      phone: validateField('phone', addr.phone),
    };
    Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
    return Object.keys(e).length === 0;
  }, [addr.name, addr.email, addr.city, addr.line1, addr.phone]);

  const onFieldChange = (name) => (e) => {
    const val = e?.target?.value ?? '';
    setAddr(a => ({ ...a, [name]: val }));
    setTouched(t => ({ ...t, [name]: true }));
    const msg = validateField(name, val);
    setErrors(prev => {
      const next = { ...prev };
      if (msg) next[name] = msg; else delete next[name];
      return next;
    });

    // Auto-save address for logged-in users
    if (user && ['name', 'email', 'city', 'line1', 'phone'].includes(name)) {
      const updatedAddr = { ...addr, [name]: val };
      if (Object.values(updatedAddr).every(v => v)) {
        saveAddressDebounced(updatedAddr);
      }
    }
  };

  const proceedAddress = () => { if (validate()) setOpen(o=>({...o,address:false,payment:true})); };
  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    const code = coupon.trim().toUpperCase();
    try {
      setCouponValidating(true);
      // Simulate API call for coupon validation
      await new Promise(resolve => setTimeout(resolve, 500));
      if (code === 'SAVE10') setCouponApplied({ code, amount: Math.min(10, subtotal * 0.2) });
      else if (code === 'FREESHIP') { setCouponApplied({ code, amount: 0 }); setShippingCost(0); }
      else if (code === 'SAVE20') setCouponApplied({ code, amount: Math.min(20, subtotal * 0.3) });
      else setCouponApplied(null);
    } catch (e) {
      setCouponApplied(null);
    } finally {
      setCouponValidating(false);
    }
    try { localStorage.setItem(COUPON_KEY, code); } catch {}
  };

  // Build order payload while normalizing local/demo product IDs (e.g. p_1) to 'custom'
  // so the backend does not attempt a DB lookup that would throw PRODUCT_NOT_FOUND.
  const buildOrderPayload = () => ({
    userId: user?.id || 'guest',
    items: (cartItems||[]).map(i => {
      const backendLikely = typeof i.id === 'string' && !i.id.startsWith('p_') && i.id.length > 10; // cuid length heuristic
      return {
        productId: backendLikely && typeof i.id === 'string' ? i.id : 'custom',
        name: { ar: i.name?.ar || i.name || 'صنف', en: i.name?.en || i.name || 'Item' },
        price: typeof i.price === 'number' ? i.price : Number(i.price || 0),
        quantity: Number.isFinite(Number(i.quantity)) ? Number(i.quantity) : 1,
        oldPrice: typeof i.oldPrice === 'number' ? i.oldPrice : (i.oldPrice ? Number(i.oldPrice) : null)
      };
    }),
    currency: 'SAR',
    paymentMethod,
    paymentMeta: { address: addr, coupon: couponApplied?.code || null, shipping: shippingCost },
    discount: discountFromCoupon,
    tax,
  });

  const ensureOrder = async (forceRebuild = false) => {
    setOrderError(null);
    const payload = buildOrderPayload();
    if (orderId && !forceRebuild) {
      // Try patch update (quantities, coupon, address meta) if items changed
      try {
        await api.updateOrder(orderId, { items: payload.items, paymentMethod: payload.paymentMethod, paymentMeta: payload.paymentMeta });
        return orderId;
      } catch (e) {
        // fallback to rebuild if patch forbidden
      }
    }
    setCreating(true);
    try {
      console.log('Order payload:', payload);
      const res = await api.createOrder(payload);
      if (!res?.order?.id) throw new Error('Create failed');
      setOrderId(res.order.id);
      return res.order.id;
    } catch (e) {
      // Enhanced debug: log full error and any structured data returned by the API
      try { console.error('[ORDER_CREATE_ERROR]', e); if (e?.data) console.error('[ORDER_CREATE_ERROR].data', e.data); } catch (logErr) {}
      // show friendly message to users while keeping detailed error in logs
      setOrderError('تعذر إنشاء الطلب حالياً. الرجاء المحاولة مرة أخرى.');
      throw e;
    } finally { setCreating(false); }
  };

  const goReview = async () => {
    // mark touched and validate; if invalid focus first invalid field
    if (!validate()) { focusFirstInvalidField(); return; }
    if (!cartItems?.length) { setOrderError('السلة فارغة'); return; }
    try {
      await ensureOrder();
      setOpen(o=>({...o,address:false,payment:false,review:true}));
    } catch (e) {
      // ensureOrder already set friendly order error; optionally focus
      focusFirstInvalidField();
    }
  };

  const openRealPayment = async () => {
    // Ensure shipping address is valid before allowing payment step
    if (!validate()) {
      // Reopen the address section to prompt the user to fill required fields
      setOpen(o => ({ ...o, address: true, payment: false, review: false, realpay: false }));
      focusFirstInvalidField();
      return;
    }
    try {
      // Make sure the latest address is persisted on the order
      await ensureOrder();
      setOpen(o=>({...o, realpay:true}));
    } catch {}
  };

  const finalize = () => {
    clearCart && clearCart();
    setOpen({ address:false,payment:false,review:false,realpay:false,complete:true });
  };

  const isCartEmpty = !(cartItems?.length) && !open.complete;

  // --- GPS & Map helpers ---
  const markerIcon = useMemo(() => ({
    // The actual Icon object will be created by reactLeafletCompat when leaflet is loaded.
    _placeholder: true
  }), []);

  const reverseGeocode = async (lat, lng) => {
    setGeoMsg('');
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=16&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('GEOCODE_FAILED');
      const data = await res.json();
      const a = data.address || {};
      const city = a.city || a.town || a.village || a.county || a.state || '';
      const line = a.road || a.neighbourhood || a.suburb || a.hamlet || a.quarter || data.display_name || '';
      setAddr(prev => ({ ...prev, city: city || prev.city, line1: line || prev.line1, geo: { lat, lng } }));
    } catch (e) {
      setAddr(prev => ({ ...prev, geo: { lat, lng } }));
      setGeoMsg('تعذر تحديد العنوان تلقائياً. يمكنك إدخال المدينة والعنوان يدوياً.');
    }
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) { setGeoMsg('المتصفح لا يدعم GPS'); return; }
    setGeolocating(true); setGeoMsg('جارِ تحديد موقعك...');
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setCoords({ lat: latitude, lng: longitude });
      reverseGeocode(latitude, longitude).finally(() => setGeolocating(false));
    }, (err) => {
      setGeolocating(false);
      setGeoMsg(err?.message ? `تعذر الوصول للموقع: ${err.message}` : 'تعذر الوصول للموقع');
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  };

  // MapClicker is rendered via the ReactLeafletCompat provider as
  // <LeafletComponents.MapClicker /> so the local hook-based implementation
  // is not needed here and caused a lint error for an undefined `useMapEvents`.

  // Progress: 4 steps => Cart(0) -> Address(1) -> Payment(2) -> Review(3) -> Complete(4)
  const stageIndex = open.complete ? 4 : open.realpay ? 3 : open.review ? 2 : open.payment ? 1 : open.address ? 0 : -1;
  const progressPercent = stageIndex >= 0 ? Math.round(((stageIndex + 1) / 4) * 100) : 0;

  const steps = [
    { name: 'السلة', icon: '🛒' },
    { name: 'العنوان', icon: '📍' },
    { name: 'الشحن والدفع', icon: '💳' },
    { name: 'المراجعة', icon: '✅' },
    { name: 'مكتمل', icon: '🎉' }
  ];

  return (
    <div
      className="container-custom px-4 py-12 checkout-page-enhanced"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isCartEmpty && (
        <div className="mb-6"><h2 className="text-xl font-bold">السلة فارغة</h2></div>
      )}
      {/* شريط تقدم محسن */}
      <div className="checkout-progress enhanced" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
        <div className="checkout-progress__bar">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="checkout-progress__steps">
          {steps.map((step, index) => (
            <div key={index} className={`step ${index <= stageIndex ? 'is-active' : ''} ${index === stageIndex ? 'is-current' : ''}`}>
              <span className="step-icon">{step.icon}</span>
              <span className="step-name">{step.name}</span>
            </div>
          ))}
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-6">الدفع (Checkout)</h1>
      {/* Keyboard shortcuts help */}
      <div className="text-xs text-gray-500 mb-4 text-center">
        <span>💡 </span>
        <span className="hidden sm:inline">استخدم Ctrl+Enter للمتابعة أو Escape للرجوع</span>
        <span className="sm:hidden">اسحب يميناً للرجوع أو يساراً للمتابعة</span>
      </div>
      {/* Stepper محسن */}
      <ol className="checkout-stepper">
        <li className={`step ${stageIndex >= 0 ? 'completed' : ''} ${stageIndex === 0 ? 'active' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">السلة</span>
        </li>
        <li className={`step ${stageIndex >= 1 ? 'completed' : ''} ${stageIndex === 1 ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">العنوان</span>
        </li>
        <li className={`step ${stageIndex >= 2 ? 'completed' : ''} ${stageIndex === 2 ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">الشحن والدفع</span>
        </li>
        <li className={`step ${stageIndex >= 3 ? 'completed' : ''} ${stageIndex === 3 ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">المراجعة</span>
        </li>
        <li className={`step ${stageIndex >= 4 ? 'completed' : ''}`}>
          <span className="step-number">5</span>
          <span className="step-label">مكتمل</span>
        </li>
      </ol>
  <div className="mb-4 border rounded overflow-hidden">
        <button type="button" onClick={()=>toggle('address')} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 text-sm font-semibold">
          <span>العنوان</span>
          <span>{open.address ? '−' : '+'}</span>
        </button>
        {open.address && (
        <div className="grid gap-4 max-w-xl p-4">
          {user && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">اختر عنوان محفوظ</label>
              <select className="border px-3 py-2" value={addrId} onChange={e=>{
                const id = e.target.value; setAddrId(id);
                const found = savedAddresses.find(a => a.id === id);
                if (found) setAddr(a=>({ ...a, name: found.name || a.name, country: found.country || a.country, city: found.city || a.city, line1: found.street || a.line1, phone: found.phone || a.phone }));
              }}>
                <option value="">— بدون —</option>
                {savedAddresses.map(a => (
                  <option key={a.id} value={a.id}>{a.label || a.city || a.street} {a.isDefault ? '• افتراضي' : ''}</option>
                ))}
              </select>
              <div className="text-xs">
                لإدارة العناوين: <a href="/account/addresses" className="text-primary-red">عناويني</a>
              </div>
            </div>
          )}
          <input id="shipping-name" name="name" autoComplete="name" className={`border px-3 py-2 ${touched.name && errors.name ? 'is-invalid' : ''}`} placeholder="الاسم" value={addr.name} onChange={onFieldChange('name')} onBlur={()=>setTouched(t=>({...t,name:true}))} aria-invalid={!!(touched.name && errors.name)} aria-describedby={touched.name && errors.name ? 'err-name' : undefined} />
          {touched.name && errors.name && <div id="err-name" className="field-hint">{errors.name}</div>}
          <input id="shipping-email" name="email" type="email" autoComplete="email" className={`border px-3 py-2 ${touched.email && errors.email ? 'is-invalid' : ''}`} placeholder="البريد" value={addr.email} onChange={onFieldChange('email')} onBlur={()=>setTouched(t=>({...t,email:true}))} aria-invalid={!!(touched.email && errors.email)} aria-describedby={touched.email && errors.email ? 'err-email' : undefined} />
          {touched.email && errors.email && <div id="err-email" className="field-hint">{errors.email}</div>}
          <div className="grid grid-cols-2 gap-4">
            <input id="shipping-country" name="country" autoComplete="country-name" className="border px-3 py-2" placeholder="الدولة" value={addr.country} onChange={e=>setAddr(a=>({...a,country:e.target.value}))} />
            <input id="shipping-city" name="city" autoComplete="address-level2" className={`border px-3 py-2 ${touched.city && errors.city ? 'is-invalid' : ''}`} placeholder="المدينة" value={addr.city} onChange={onFieldChange('city')} onBlur={()=>setTouched(t=>({...t,city:true}))} aria-invalid={!!(touched.city && errors.city)} aria-describedby={touched.city && errors.city ? 'err-city' : undefined} />
          </div>
          {touched.city && errors.city && <div id="err-city" className="field-hint">{errors.city}</div>}
          <input id="shipping-address" name="address1" autoComplete="address-line1" className={`border px-3 py-2 ${touched.line1 && errors.line1 ? 'is-invalid' : ''}`} placeholder="العنوان" value={addr.line1} onChange={onFieldChange('line1')} onBlur={()=>setTouched(t=>({...t,line1:true}))} aria-invalid={!!(touched.line1 && errors.line1)} aria-describedby={touched.line1 && errors.line1 ? 'err-line1' : undefined} />
          {touched.line1 && errors.line1 && <div id="err-line1" className="field-hint">{errors.line1}</div>}
          <input id="shipping-phone" name="tel" type="tel" autoComplete="tel" className={`border px-3 py-2 ${touched.phone && errors.phone ? 'is-invalid' : ''}`} placeholder="الهاتف" value={addr.phone} onChange={onFieldChange('phone')} onBlur={()=>setTouched(t=>({...t,phone:true}))} aria-invalid={!!(touched.phone && errors.phone)} aria-describedby={touched.phone && errors.phone ? 'err-phone' : undefined} />
          {touched.phone && errors.phone && <div id="err-phone" className="field-hint">{errors.phone}</div>}
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={useMyLocation} disabled={geolocating}>
              {geolocating ? '...جارِ التحديد' : 'تحديد العنوان عبر GPS'}
            </Button>
            {addr?.geo && <span className="text-xs text-gray-500">({addr.geo.lat?.toFixed(5)}, {addr.geo.lng?.toFixed(5)})</span>}
          </div>
          {geoMsg && <div className="text-xs text-gray-600">{geoMsg}</div>}
          {coords && (
            <div className="rounded border overflow-hidden" style={{ height: 260 }}>
              <ReactLeafletCompat>
                {(LeafletComponents) => (
                  <LeafletComponents.MapContainer center={[coords.lat, coords.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <LeafletComponents.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                    <LeafletComponents.Marker
                      position={[coords.lat, coords.lng]}
                      icon={markerIcon}
                      draggable
                      eventHandlers={{
                        dragend: (e) => {
                          const m = e.target;
                          const ll = m.getLatLng();
                          const next = { lat: ll.lat, lng: ll.lng };
                          setCoords(next);
                          reverseGeocode(next.lat, next.lng);
                        }
                      }}
                    />
                    <LeafletComponents.MapClicker onPick={(p) => { setCoords(p); reverseGeocode(p.lat, p.lng); }} />
                  </LeafletComponents.MapContainer>
                )}
              </ReactLeafletCompat>
              <div className="p-2 text-xs text-gray-500">يمكنك سحب العلامة أو النقر على الخريطة لاختيار نقطة التسليم.</div>
            </div>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" variant="primary" type="button" onClick={proceedAddress} disabled={!isFormValid}>
              حفظ و التالي
            </Button>
            <Button variant="secondary" type="button" onClick={()=>{ setAddr(loadAddress()); setErrors({}); }}>إعادة ضبط</Button>
            {user && (
              <div className="flex items-center gap-2 text-sm">
                {savingAddress && <span className="text-blue-600">جاري الحفظ...</span>}
                {addressSaved && <span className="text-green-600">✓ تم الحفظ</span>}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

  <div className="mb-4 border rounded overflow-hidden">
        <button type="button" onClick={()=>toggle('payment')} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 text-sm font-semibold">
          <span>الشحن و طريقة الدفع</span>
          <span>{open.payment ? '−' : '+'}</span>
        </button>
        {open.payment && (
          <div className="p-4 grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="font-bold mb-2 text-sm">طريقة الدفع</h3>
                <div className="grid gap-2 text-sm">
                  {paymentOptions.map(m => (
                    <label key={m} className={`border rounded p-2 flex items-center gap-2 cursor-pointer ${paymentMethod===m?'ring-2 ring-primary-red':''}`}>
                      <input type="radio" name="pm2" value={m} checked={paymentMethod===m} onChange={()=>setPaymentMethod(m)} />
                      <span>{m==='cod'?'الدفع عند الاستلام': m==='paypal'?'PayPal': m==='stc'?'STC Pay': m==='bank'?'تحويل بنكي':'Stripe'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-sm">قسيمة الخصم</h3>
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    name="coupon"
                    className="border px-3 py-2 flex-1 text-sm"
                    placeholder="رمز القسيمة"
                    value={coupon}
                    onChange={e=>setCoupon(e.target.value)}
                    disabled={couponValidating}
                  />
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponValidating || !coupon.trim()}
                  >
                    {couponValidating ? 'جاري التحقق...' : 'تطبيق'}
                  </Button>
                </div>
                {couponApplied && <div className="text-xs text-green-600 mt-1">تم تطبيق {couponApplied.code} خصم: {couponApplied.amount.toFixed(2)} ر.س</div>}
                {!couponApplied && coupon && !couponValidating && <div className="text-xs text-gray-500 mt-1">رمز غير صالح</div>}
              </div>
            </div>
            <div className="checkout-summary bg-white border rounded p-4 text-sm space-y-3">
              <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{subtotal.toFixed(2)} ر.س</span></div>
              <div className="flex justify-between"><span>الخصم</span><span>{discountFromCoupon.toFixed(2)}-</span></div>
              <div className="flex justify-between"><span>الشحن</span><span>{shippingCost.toFixed(2)} ر.س</span></div>
              {shippingInfo && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div>طريقة التسعير: {shippingInfo.method === 'distance' ? `حسب المسافة (~${shippingInfo.distanceKm} كم)` : 'افتراضي'}</div>
                  {(shippingInfo.etaDaysMin!=null || shippingInfo.etaHoursMin!=null) && (
                    <div>
                      تقدير الوصول: {shippingInfo.etaDaysMin!=null ? `${shippingInfo.etaDaysMin}–${shippingInfo.etaDaysMax} يوم` : `${shippingInfo.etaHoursMin}–${shippingInfo.etaHoursMax} ساعة`}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between"><span>الضريبة</span><span>{tax.toFixed(2)} ر.س</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>الإجمالي</span><span>{grandTotal.toFixed(2)} ر.س</span></div>
              <Button disabled={creating} className="w-full" variant="primary" type="button" onClick={goReview}>{creating?'...جاري الإنشاء':'مراجعة الطلب'}</Button>
              {orderError && <div className="field-hint">خطأ: {orderError}</div>}
            </div>
          </div>
        )}
      </div>

      {open.review && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border rounded p-4">
              <h3 className="font-bold mb-3">العنوان</h3>
              <div className="text-sm leading-relaxed">
                <div>{addr.name}</div>
                <div>{addr.email}</div>
                <div>{addr.country} - {addr.city}</div>
                <div>{addr.line1}</div>
                <div>{addr.phone}</div>
              </div>
              <Button variant="ghost" className="text-xs text-primary-red mt-2" onClick={()=>setOpen(o=>({...o,address:true,review:false}))}>تعديل</Button>
            </div>
            <div className="bg-white border rounded p-4">
              <h3 className="font-bold mb-3">العناصر</h3>
              <ul className="divide-y text-sm">
                {cartItems.map(i => (
                  <li key={i.id} className="py-2 flex items-center gap-3">
                    <span className="truncate flex-1 max-w-[160px]">{localizeName(i, locale)}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" className="px-2 border" type="button" onClick={()=>api /* placeholder */}>{/* minus */}-</Button>
                      <input value={i.quantity} readOnly className="w-10 border text-center text-xs" />
                      <Button variant="ghost" className="px-2 border" type="button" onClick={()=>api /* placeholder */}>+</Button>
                    </div>
                    <span className="text-xs whitespace-nowrap">{(i.price||0).toFixed(2)} × {i.quantity} = {((i.price||0)*(i.quantity||1)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <div className="checkout-summary bg-white border rounded p-4 text-sm space-y-2">
              <div className="flex justify-between"><span>الإجمالي الفرعي</span><strong>{subtotal.toFixed(2)} ر.س</strong></div>
              <div className="flex justify-between"><span>الخصم</span><strong>{discountFromCoupon.toFixed(2)}-</strong></div>
              <div className="flex justify-between"><span>الشحن</span><strong>{shippingCost.toFixed(2)} ر.س</strong></div>
              {shippingInfo && (
                <div className="text-xs text-gray-600 space-y-1">
                  <div>{shippingInfo.method === 'distance' ? `المسافة التقديرية: ~${shippingInfo.distanceKm} كم` : 'تسعير افتراضي للشحن'}</div>
                  {(shippingInfo.etaDaysMin!=null || shippingInfo.etaHoursMin!=null) && (
                    <div>
                      تقدير الوصول: {shippingInfo.etaDaysMin!=null ? `${shippingInfo.etaDaysMin}–${shippingInfo.etaDaysMax} يوم` : `${shippingInfo.etaHoursMin}–${shippingInfo.etaHoursMax} ساعة`}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between"><span>الضريبة</span><strong>{tax.toFixed(2)} ر.س</strong></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>الإجمالي</span><span>{grandTotal.toFixed(2)} ر.س</span></div>
              <div className="text-xs text-gray-500">رقم الطلب: {orderId || '—'} / طريقة: {paymentMethod}</div>
              <div className="grid gap-2">
                <Button className="w-full" variant="primary" onClick={finalize}>تأكيد وإكمال (دفع عند الاستلام)</Button>
                <Button type="button" className="w-full" variant="secondary" onClick={openRealPayment}>طرق دفع حقيقية</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {open.realpay && !open.complete && (
        <div className="mt-10 border rounded overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 flex justify-between items-center text-sm font-semibold">
            <span>طرق الدفع الحقيقية</span>
            <Button variant="ghost" onClick={()=>setOpen(o=>({...o,realpay:false}))}>إغلاق</Button>
          </div>
          <div className="p-4 space-y-6 max-w-xl">
            <div className="grid gap-3">
              {(['paypal','stc','bank','cod','stripe'].filter(m => enabledPayments[m])).map(m => (
                <label key={m} className={`border rounded p-3 cursor-pointer flex items-center justify-between ${paymentMethod===m?'ring-2 ring-primary-red':''}`}>
                  <span>
                    <input type="radio" name="pm4" value={m} checked={paymentMethod===m} onChange={()=>setPaymentMethod(m)} className="mr-2" />
                    {m==='paypal'?'PayPal': m==='stc'? 'STC Pay (محاكاة)' : m==='bank'? 'تحويل بنكي':'الدفع عند الاستلام'}
                    {m==='stripe'?'Stripe':''}
                  </span>
                  <span className="text-xs text-gray-500">{m==='paypal'?'الدفع الآمن': m==='stc'?'محفظة رقمية': m==='bank'?'دفع يدوي':'رسوم محتملة'}</span>
                </label>
              ))}
            </div>
            <Button className="w-full" variant="primary" disabled={processing} onClick={async ()=>{
              if (!cartItems?.length) { setMessage('السلة فارغة'); return; }
              try {
                setProcessing(true); setMessage('');
                const oid = await ensureOrder();
                switch (paymentMethod) {
                  case 'cod':
                    setMessage('سيتم الاكتفاء بالدفع عند الاستلام. يمكنك إنهاء الطلب.');
                    break;
                  case 'paypal': {
                    const payload = buildOrderPayload();
                    const data = await paymentService.createPayPalTransaction({ items: payload.items, currency: payload.currency });
                    if (data?.id) {
                      setPaypalOrderId(data.id);
                      setPaypalButtonsVisible(true);
                      setMessage('انقر على زر PayPal أدناه لإكمال الدفع');
                    } else {
                      throw new Error('فشل في إنشاء طلب PayPal');
                    }
                    break;
                  }
                  case 'stc': {
                    const data = await paymentService.createStcPayTransaction({ orderId: oid });
                    if (data?.sessionId) { setStcSession(data.sessionId); setMessage('تم إنشاء جلسة STC Pay'); } else throw new Error('فشل إنشاء الجلسة');
                    break;
                  }
                  case 'bank': {
                    const data = await paymentService.initBankTransfer({ orderId: oid });
                    if (data?.bank) { setBankInfo(data.bank); setMessage('تم تحميل بيانات البنك'); } else throw new Error('لا توجد بيانات بنك');
                    break;
                  }
                  case 'stripe': {
                    const payload = buildOrderPayload();
                    const data = await paymentService.createStripePaymentIntent({ ...payload, amount: grandTotal });
                    if (data?.clientSecret) { setStripeClientSecret(data.clientSecret); setMessage('أدخل بيانات البطاقة أدناه'); } else throw new Error('فشل في إنشاء Payment Intent');
                    break;
                  }
                  default: break;
                }
              } catch(e){ setMessage(e?.message || 'حدث خطأ أثناء بدء الدفع. الرجاء المحاولة مرة أخرى.'); } finally { setProcessing(false); }
            }}>{processing?'...جاري المعالجة':'بدء عملية الدفع'}</Button>
            {paymentMethod==='paypal' && paypalButtonsVisible && paypalOrderId && (
              <div className="bg-blue-50 border p-4 rounded text-sm space-y-2">
                <div>PayPal Order ID: {paypalOrderId}</div>
                <PayPalButtons
                  createOrder={() => Promise.resolve(paypalOrderId)}
                  onApprove={async (data) => {
                    try {
                      setProcessing(true);
                      setMessage('جاري تأكيد الدفع...');
                      const oid = await ensureOrder();
                      await paymentService.capturePayPalOrder({ paypalOrderId: data.orderID, localOrderId: oid });
                      finalize();
                      setMessage('تم الدفع بنجاح!');
                    } catch (e) {
                      setMessage('فشل في تأكيد الدفع: ' + e.message);
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  onError={(err) => {
                    setMessage('حدث خطأ في PayPal: ' + err.message);
                  }}
                />
              </div>
            )}
            {paymentMethod==='stc' && stcSession && (
              <div className="bg-purple-50 border p-4 rounded text-sm space-y-2">
                <div>Session ID: {stcSession}</div>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="primary" disabled={processing} onClick={async ()=>{ try { setProcessing(true); const oid = await ensureOrder(); await paymentService.confirmStcPay({ orderId: oid, sessionId: stcSession, success:true }); finalize(); } catch(e){ setMessage(e.message); } finally { setProcessing(false); } }}>تأكيد (محاكاة)</Button>
                  <Button className="flex-1" variant="secondary" disabled={processing} onClick={()=>{ setStcSession(null); setMessage('تم إلغاء جلسة STC'); }}>إلغاء</Button>
                </div>
              </div>
            )}
            {paymentMethod==='stripe' && stripeClientSecret && (
              <div className="bg-green-50 border p-4 rounded text-sm space-y-2">
                <div>أدخل بيانات البطاقة:</div>
                <div className="border p-3 rounded bg-white">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': { color: '#aab7c4' },
                        },
                        invalid: { color: '#9e2146' },
                      },
                    }}
                    onChange={(e) => setStripeCardComplete(e.complete)}
                  />
                </div>
                <Button
                  className="w-full"
                  variant="primary"
                  disabled={processing || !stripe || !elements || !stripeCardComplete}
                  onClick={async () => {
                    if (!stripe || !elements) return;
                    try {
                      setProcessing(true);
                      setMessage('جاري معالجة الدفع...');
                      const oid = await ensureOrder();
                      const { error, paymentIntent } = await stripe.confirmCardPayment(stripeClientSecret, {
                        payment_method: { card: elements.getElement(CardElement) }
                      });
                      if (error) {
                        setMessage('فشل الدفع: ' + error.message);
                      } else if (paymentIntent.status === 'succeeded') {
                        await paymentService.confirmStripePayment({
                          paymentIntentId: paymentIntent.id,
                          paymentMethodId: paymentIntent.payment_method
                        });
                        finalize();
                        setMessage('تم الدفع بنجاح!');
                      }
                    } catch (e) {
                      setMessage('حدث خطأ: ' + e.message);
                    } finally {
                      setProcessing(false);
                    }
                  }}
                >
                  {processing ? 'جاري المعالجة...' : `ادفع ${grandTotal.toFixed(2)} ر.س`}
                </Button>
              </div>
            )}
            {message && <div className="text-sm text-gray-700">{message}</div>}
          </div>
        </div>
      )}
      {open.complete && (
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold mb-4">تم إرسال الطلب</h2>
          <p className="text-sm text-gray-600 mb-4">سيتم توجيهك لصفحة الطلبات قريباً.</p>
          <ButtonLink to="/orders" variant="primary">عرض الطلبات</ButtonLink>
        </div>
      )}
      {/* CTA مثبت للأجهزة الصغيرة */}
      <div className="checkout-sticky-cta md:hidden">
        <div className="inner">
          <div className="sum">المجموع: <strong>{(subtotal + (shippingCost||0) - (couponApplied?.amount||0) + (+(Math.max(0, subtotal - (couponApplied?.amount||0)) * 0.15).toFixed(2))).toFixed(2)} ر.س</strong></div>
          <div className="flex gap-2 w-full">
          <Button variant="secondary" onClick={()=>{
            // Step backward
            if (open.realpay) {
              setOpen(o=>({...o, realpay:false, review:true}));
              try { document.querySelector('.checkout-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
              return;
            }
            if (open.review) {
              setOpen(o=>({...o, review:false, payment:true}));
              try { document.querySelector('button[onClick*="toggle(\'payment\')"]').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
              return;
            }
            if (open.payment) {
              setOpen(o=>({...o, payment:false, address:true}));
              try { document.querySelector('button[onClick*="toggle(\'address\')"]').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
              return;
            }
          }}>رجوع</Button>
          <Button className="flex-1" variant="primary" onClick={async ()=>{
            // Advance flow step-by-step on mobile
            if (open.address) {
              if (validate()) {
                setOpen(o=>({...o,address:false,payment:true}));
                // Smooth scroll to payment block
                try { document.querySelector('button[onClick*="toggle(\'payment\')"]').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
              } else {
                // Focus first invalid field and flash
                const order = ['name','email','city','line1','phone'];
                const first = order.find(k => !!errors[k]);
                if (first) {
                  const el = document.getElementById(`shipping-${first === 'line1' ? 'address' : first}`);
                  if (el && typeof el.focus === 'function') {
                    el.focus();
                    try { el.classList.add('field-flash'); setTimeout(()=> el.classList.remove('field-flash'), 1000); } catch {}
                  }
                }
              }
              return;
            }
            if (open.payment) {
              try {
                await ensureOrder();
                setOpen(o=>({...o,payment:false,review:true}));
                // Scroll to review panel
                try { document.querySelector('.checkout-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
              } catch {}
              return;
            }
            if (open.review) {
              setOpen(o=>({...o,realpay:true}));
              // Scroll to real payment section
              try { document.querySelector('div.mt-10.border.rounded.overflow-hidden')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch {}
              return;
            }
            if (open.realpay) {
              // If COD selected, just finalize, else start real payment flow
              if (paymentMethod==='cod') { finalize(); }
              else { /* prompt user to press primary within real payment panel */ }
              return;
            }
          }}>متابعة</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

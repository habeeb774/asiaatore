import React, { useState, useMemo, useEffect } from 'react';
import ReactLeafletCompat from '../utils/reactLeafletCompat';
import * as paymentService from '../services/paymentService';
import { useOrders } from '../context/OrdersContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { localizeName } from '../utils/locale';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';

const CheckoutPage = () => {
  const { cartItems, clearCart } = useCart() || {};
  const { user } = useAuth() || {};
  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';

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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const COUPON_KEY = 'my_store_last_coupon';
  const [coupon, setCoupon] = useState(()=>{ try { return localStorage.getItem(COUPON_KEY)||''; } catch { return ''; } });
  const [couponApplied, setCouponApplied] = useState(null);
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [bankInfo, setBankInfo] = useState(null);
  const [stcSession, setStcSession] = useState(null);
  const { refresh } = useOrders() || {};

  const subtotal = useMemo(()=> (cartItems||[]).reduce((s,i)=> s + (i.price||0)*(i.quantity||1),0), [cartItems]);

  // Distance-based shipping quote via backend
  useEffect(()=> {
    const run = async () => {
      const city = (addr.city||'').trim();
      if (!city) { setShippingCost(0); setShippingInfo(null); return; }
      try {
        const q = await api.shippingQuote({ city, country: addr.country });
        if (q?.ok) {
          setShippingCost(Number(q.shipping)||0);
          setShippingInfo({ method: q.method, distanceKm: q.distanceKm, cityMatched: q.cityMatched });
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
  }, [addr.city, addr.country]);

  useEffect(()=> { try { localStorage.setItem(ADDRESS_KEY, JSON.stringify(addr)); } catch {} }, [addr]);
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
        try { el.classList.add('field-flash'); setTimeout(()=> el.classList.remove('field-flash'), 900); } catch {}
      }
    } catch (e) { /* no-op */ }
  };

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
  };

  const proceedAddress = () => { if (validate()) setOpen(o=>({...o,address:false,payment:true})); };
  const applyCoupon = () => {
    if (!coupon.trim()) return;
    const code = coupon.trim().toUpperCase();
    if (code === 'SAVE10') setCouponApplied({ code, amount: Math.min(10, subtotal * 0.2) });
    else if (code === 'FREESHIP') { setCouponApplied({ code, amount: 0 }); setShippingCost(0); }
    else if (code === 'SAVE20') setCouponApplied({ code, amount: Math.min(20, subtotal * 0.3) });
    else setCouponApplied(null);
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

  // Editable items inside review
  const updateItemQty = (id, qty) => {
    const q = Math.max(1, Math.min(10, qty));
    // mutate cart context directly (simplified: reuse updateQuantity from context if exists)
    // We rely on cart context updateQuantity
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

  // Progress: 3 steps => Cart(0) -> Address(1) -> Payment(2)
  const stageIndex = open.review || open.payment || open.realpay || open.complete ? 2 : (open.address ? 1 : 0);
  const progressPercent = Math.round(((stageIndex + 1) / 3) * 100);

  return (
    <div className="container-custom px-4 py-12 checkout-page-enhanced">
      {isCartEmpty && (
        <div className="mb-6"><h2 className="text-xl font-bold">السلة فارغة</h2></div>
      )}
      {/* شريط تقدم علوي بسيط */}
      <div className="checkout-progress mobile-gutters" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
        <div className="checkout-progress__bar"><span style={{ width: `${progressPercent}%` }} /></div>
        <div className="checkout-progress__labels">
          <span className={stageIndex >= 0 ? 'is-active' : ''}>السلة</span>
          <span className={stageIndex >= 1 ? 'is-active' : ''}>العنوان</span>
          <span className={stageIndex >= 2 ? 'is-active' : ''}>الدفع</span>
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-6">الدفع (Checkout)</h1>
      {/* Stepper بسيط */}
      <ol className="flex items-center gap-3 text-xs text-gray-600 mb-4">
        <li className={`px-2 py-1 rounded ${open.address? 'bg-green-100 text-green-800':'bg-gray-100'}`}>1. العنوان</li>
        <li className={`px-2 py-1 rounded ${open.payment? 'bg-green-100 text-green-800':'bg-gray-100'}`}>2. الشحن والدفع</li>
        <li className={`px-2 py-1 rounded ${open.review? 'bg-green-100 text-green-800':'bg-gray-100'}`}>3. المراجعة</li>
        <li className={`px-2 py-1 rounded ${open.realpay? 'bg-green-100 text-green-800':'bg-gray-100'}`}>4. الدفع</li>
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
            <button type="button" className="btn-secondary" onClick={useMyLocation} disabled={geolocating}>
              {geolocating ? '...جارِ التحديد' : 'تحديد العنوان عبر GPS'}
            </button>
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
            <button className="btn-primary flex-1" type="button" onClick={proceedAddress}>حفظ و التالي</button>
            <button className="btn-secondary" type="button" onClick={()=>{ setAddr(loadAddress()); setErrors({}); }}>إعادة ضبط</button>
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
                  {['cod','paypal','stc','bank'].map(m => (
                    <label key={m} className={`border rounded p-2 flex items-center gap-2 cursor-pointer ${paymentMethod===m?'ring-2 ring-primary-red':''}`}>
                      <input type="radio" name="pm2" value={m} checked={paymentMethod===m} onChange={()=>setPaymentMethod(m)} />
                      <span>{m==='cod'?'الدفع عند الاستلام': m==='paypal'?'PayPal': m==='stc'?'STC Pay':'تحويل بنكي'}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold mb-2 text-sm">قسيمة الخصم</h3>
                <div className="flex gap-2">
                  <input id="coupon" name="coupon" className="border px-3 py-2 flex-1 text-sm" placeholder="رمز القسيمة" value={coupon} onChange={e=>setCoupon(e.target.value)} />
                  <button className="btn-secondary" type="button" onClick={applyCoupon}>تطبيق</button>
                </div>
                {couponApplied && <div className="text-xs text-green-600 mt-1">تم تطبيق {couponApplied.code} خصم: {couponApplied.amount.toFixed(2)} ر.س</div>}
                {!couponApplied && coupon && <div className="text-xs text-gray-500 mt-1">لا يوجد خصم فعلي (رمز غير معروف)</div>}
              </div>
            </div>
            <div className="checkout-summary bg-white border rounded p-4 text-sm space-y-3">
              <div className="flex justify-between"><span>الإجمالي الفرعي</span><span>{subtotal.toFixed(2)} ر.س</span></div>
              <div className="flex justify-between"><span>الخصم</span><span>{discountFromCoupon.toFixed(2)}-</span></div>
              <div className="flex justify-between"><span>الشحن</span><span>{shippingCost.toFixed(2)} ر.س</span></div>
              {shippingInfo && (
                <div className="text-xs text-gray-500">طريقة التسعير: {shippingInfo.method === 'distance' ? `حسب المسافة (~${shippingInfo.distanceKm} كم)` : 'افتراضي'}</div>
              )}
              <div className="flex justify-between"><span>الضريبة</span><span>{tax.toFixed(2)} ر.س</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>الإجمالي</span><span>{grandTotal.toFixed(2)} ر.س</span></div>
              <button disabled={creating} className="btn-primary w-full" type="button" onClick={goReview}>{creating?'...جاري الإنشاء':'مراجعة الطلب'}</button>
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
              <button className="text-xs text-primary-red mt-2" onClick={()=>setOpen(o=>({...o,address:true,review:false}))}>تعديل</button>
            </div>
            <div className="bg-white border rounded p-4">
              <h3 className="font-bold mb-3">العناصر</h3>
              <ul className="divide-y text-sm">
                {cartItems.map(i => (
                  <li key={i.id} className="py-2 flex items-center gap-3">
                    <span className="truncate flex-1 max-w-[160px]">{localizeName(i, locale)}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" className="px-2 border" onClick={()=>api /* placeholder */}>{/* minus */}-</button>
                      <input value={i.quantity} readOnly className="w-10 border text-center text-xs" />
                      <button type="button" className="px-2 border" onClick={()=>api /* placeholder */}>+</button>
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
                <div className="text-xs text-gray-500">{shippingInfo.method === 'distance' ? `المسافة التقديرية: ~${shippingInfo.distanceKm} كم` : 'تسعير افتراضي للشحن'}</div>
              )}
              <div className="flex justify-between"><span>الضريبة</span><strong>{tax.toFixed(2)} ر.س</strong></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>الإجمالي</span><span>{grandTotal.toFixed(2)} ر.س</span></div>
              <div className="text-xs text-gray-500">رقم الطلب: {orderId || '—'} / طريقة: {paymentMethod}</div>
              <div className="grid gap-2">
                <button className="btn-primary w-full" onClick={finalize}>تأكيد وإكمال (دفع عند الاستلام)</button>
                <button type="button" className="btn-secondary w-full" onClick={openRealPayment}>طرق دفع حقيقية</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {open.realpay && !open.complete && (
        <div className="mt-10 border rounded overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex justify-between items-center text-sm font-semibold">
            <span>طرق الدفع الحقيقية</span>
            <button onClick={()=>setOpen(o=>({...o,realpay:false}))}>إغلاق</button>
          </div>
          <div className="p-4 space-y-6 max-w-xl">
            <div className="grid gap-3">
              {['paypal','stc','bank','cod'].map(m => (
                <label key={m} className={`border rounded p-3 cursor-pointer flex items-center justify-between ${paymentMethod===m?'ring-2 ring-primary-red':''}`}>
                  <span>
                    <input type="radio" name="pm4" value={m} checked={paymentMethod===m} onChange={()=>setPaymentMethod(m)} className="mr-2" />
                    {m==='paypal'?'PayPal': m==='stc'? 'STC Pay (محاكاة)' : m==='bank'? 'تحويل بنكي':'الدفع عند الاستلام'}
                  </span>
                  <span className="text-xs text-gray-500">{m==='paypal'?'الدفع الآمن': m==='stc'?'محفظة رقمية': m==='bank'?'دفع يدوي':'رسوم محتملة'}</span>
                </label>
              ))}
            </div>
            <button className="btn-primary w-full" disabled={processing} onClick={async ()=>{
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
                    if (data?.approvalUrl) window.location.href = data.approvalUrl; else throw new Error('لا يوجد رابط موافقة');
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
                  default: break;
                }
              } catch(e){ setMessage(e?.message || 'حدث خطأ أثناء بدء الدفع. الرجاء المحاولة مرة أخرى.'); } finally { setProcessing(false); }
            }}>{processing?'...جاري المعالجة':'بدء عملية الدفع'}</button>
            {paymentMethod==='bank' && bankInfo && (
              <div className="bg-gray-50 border p-4 rounded text-sm space-y-1">
                <div>اسم الحساب: {bankInfo.accountName}</div>
                <div>IBAN: {bankInfo.iban}</div>
                <div>البنك: {bankInfo.bank}</div>
                <div>المرجع: <strong>{bankInfo.reference}</strong></div>
                <div className="text-xs text-gray-500">بعد التحويل سيتم تأكيد الطلب.</div>
              </div>
            )}
            {paymentMethod==='stc' && stcSession && (
              <div className="bg-purple-50 border p-4 rounded text-sm space-y-2">
                <div>Session ID: {stcSession}</div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" disabled={processing} onClick={async ()=>{ try { setProcessing(true); const oid = await ensureOrder(); await paymentService.confirmStcPay({ orderId: oid, sessionId: stcSession, success:true }); finalize(); } catch(e){ setMessage(e.message); } finally { setProcessing(false); } }}>تأكيد (محاكاة)</button>
                  <button className="btn-secondary flex-1" disabled={processing} onClick={()=>{ setStcSession(null); setMessage('تم إلغاء جلسة STC'); }}>إلغاء</button>
                </div>
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
          <a href="/orders" className="btn-primary">عرض الطلبات</a>
        </div>
      )}
      {/* CTA مثبت للأجهزة الصغيرة */}
      <div className="checkout-sticky-cta md:hidden">
        <div className="inner">
          <div className="sum">المجموع: <strong>{(subtotal + (shippingCost||0) - (couponApplied?.amount||0) + (+(Math.max(0, subtotal - (couponApplied?.amount||0)) * 0.15).toFixed(2))).toFixed(2)} ر.س</strong></div>
          <div className="flex gap-2 w-full">
          <button className="btn-secondary" onClick={()=>{
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
          }}>رجوع</button>
          <button className="btn-primary flex-1" onClick={async ()=>{
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
          }}>متابعة</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

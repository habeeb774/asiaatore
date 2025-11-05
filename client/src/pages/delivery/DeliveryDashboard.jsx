import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui';
import RoutePlanner from '../../components/RoutePlanner';
// Shared admin styles for skeletons
// Styles consolidated into `styles/index.scss`

// Inline lightweight SVG icons (to avoid importing the whole icon pack for this page)
const Truck = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 3h13v13H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M14 8h4l3 3v5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    <circle cx="7" cy="18" r="1.5" fill="currentColor" />
    <circle cx="19" cy="18" r="1.5" fill="currentColor" />
  </svg>
);
const RefreshCw = ({ className = '', size = 18 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M21 10a9 9 0 1 0-3 6.7L21 10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 3v7h-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CheckCircle2 = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);
const AlertCircle = ({ className = '', size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
    <path d="M12 8v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const FileSignature = ({ className = '', size = 14 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 13c.5-1 2-1 3 0s2 1 3 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const KeyRound = ({ className = '', size = 14 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="7" cy="11" r="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M9 11l9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 20v-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default function DeliveryDriverPage() {
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [failReason, setFailReason] = useState('');
  const [profile, setProfile] = useState(null);
  const [selectedStops, setSelectedStops] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active'); // active | accepted | out_for_delivery | delivered | failed | all
  const [pool, setPool] = useState(false); // show unassigned pool
  const watchIdRef = useRef(null);
  const pollingRef = useRef(null);
  const esRef = useRef(null);

  // استخدام useCallback لتحسين الأداء
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (pool) params.pool = 1;
      if (statusFilter !== 'active' && statusFilter !== 'all') params.status = statusFilter;
      const res = await api.deliveryList(params);
      let list = res?.orders || [];
      if (statusFilter === 'active') {
        list = list.filter((o) => ['accepted', 'out_for_delivery'].includes(o.deliveryStatus));
      }
      setOrders(list);
      setError(null);
    } catch (e) {
      console.error('fetchOrders error', e);
      setError(e?.response?.data?.message || e?.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [pool, statusFilter]);

  const fetchProfile = useCallback(async () => {
    try {
      const p = await api.deliveryProfileGet();
      setProfile(p?.profile || p || null);
    } catch (e) {
      console.warn('fetchProfile', e);
    }
  }, []);

  // دالة موحدة لمعالجة الإجراءات
  const handleOrderAction = useCallback(async (action, id, data = null) => {
    try {
      switch (action) {
        case 'accept':
          await api.deliveryAccept(id);
          break;
        case 'reject':
          await api.deliveryReject(id);
          break;
        case 'start':
          await api.deliveryStart(id);
          setActiveId(id);
          break;
        case 'complete':
          if (signatureFile) {
            const fd = new FormData();
            fd.append('signature', signatureFile);
            await api.deliverySignature(id, fd);
          }
          await api.deliveryComplete(id, {});
          setSignatureFile(null);
          setActiveId(null);
          break;
        case 'fail':
          await api.deliveryFail(id, data?.reason || failReason || 'تعذر التسليم');
          setActiveId(null);
          break;
        case 'otp':
          await api.deliveryOtpConfirm(id, otpCode);
          setOtpCode('');
          break;
        default:
          return;
      }
      await fetchOrders();
    } catch (e) {
      console.error(`${action} error`, e);
      setError(`فشل ${action}: ${e?.message || 'حدث خطأ'}`);
    }
  }, [signatureFile, otpCode, failReason, fetchOrders]);

  // تحسين نظام التتبع
  const startLocationWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('المتصفح لا يدخدم نظام الموقع');
      return;
    }
    
    try {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          if (activeId) {
            try {
              await api.deliveryLocation(activeId, { 
                lat: latitude, 
                lng: longitude 
              });
            } catch (e) {
              console.warn('location update failed', e);
            }
          }
        },
        (err) => {
          console.warn('geo error', err);
          setError('فشل في الحصول على الموقع');
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, 
          timeout: 15000 
        }
      );
      watchIdRef.current = id;
    } catch (e) {
      console.warn('startLocationWatch error', e);
    }
  }, [activeId]);

  const stopLocationWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (user && ['delivery', 'admin'].includes(user.role)) {
      fetchProfile();
      fetchOrders();
      startLocationWatch();
      
      pollingRef.current = setInterval(fetchOrders, 20000);
      // SSE events for real-time updates
      try {
        const es = new EventSource('/api/events');
        esRef.current = es;
        es.addEventListener('delivery.updated', (ev) => {
          try {
            const data = JSON.parse(ev.data || '{}');
            const { orderId, deliveryStatus } = data || {};
            if (!orderId) return;
            setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus } : o)));
          } catch {}
        });
        es.onerror = () => {};
      } catch {}
      
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        stopLocationWatch();
        if (esRef.current) { try { esRef.current.close(); } catch {} esRef.current = null; }
      };
    }
  }, [user, fetchOrders, fetchProfile, startLocationWatch, stopLocationWatch]);

  useEffect(() => {
    if (activeId) {
      startLocationWatch();
    } else {
      stopLocationWatch();
    }
  }, [activeId, startLocationWatch, stopLocationWatch]);

  function getCoordsFromOrder(o) {
    // try multiple common fields
    if (!o) return null;
    if (o.lat && o.lng) return { lat: +o.lat, lng: +o.lng };
    if (o.location && o.location.lat && o.location.lng) return { lat: +o.location.lat, lng: +o.location.lng };
    if (o.deliveryLocation && o.deliveryLocation.lat && o.deliveryLocation.lng) return { lat: +o.deliveryLocation.lat, lng: +o.deliveryLocation.lng };
    if (o.toLat && o.toLng) return { lat: +o.toLat, lng: +o.toLng };
    if (o.destination && o.destination.lat && o.destination.lng) return { lat: +o.destination.lat, lng: +o.destination.lng };
    if (o.address && o.address.lat && o.address.lng) return { lat: +o.address.lat, lng: +o.address.lng };
    // try nested coordinates strings
    if (o.coords && typeof o.coords === 'string') {
      const parts = o.coords.split(',').map(p => p.trim());
      if (parts.length >= 2) return { lat: +parts[0], lng: +parts[1] };
    }
    return null;
  }

  function toggleStopForOrder(o) {
    const exists = selectedStops.find(s => s.id === o.id);
    if (exists) {
      setSelectedStops(selectedStops.filter(s => s.id !== o.id));
      return;
    }
    const coords = getCoordsFromOrder(o);
    if (!coords) {
      setError('لا يمكن إضافة هذا الطلب للمسار — لا توجد إحداثيات.');
      return;
    }
    const label = (o.customer && (o.customer.name || o.customer.fullName)) || (o.address && (o.address.line1 || o.address.display)) || `#${String(o.id).slice(0,8)}`;
    setSelectedStops([...selectedStops, { id: o.id, lat: coords.lat, lng: coords.lng, label }]);
  }

  if (!user) return <div className="min-h-screen p-4 bg-gray-50">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="min-h-screen p-4 bg-gray-50">غير مصرح بالوصول</div>;
  }

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between py-4 mb-4 rounded-lg shadow-sm px-4" style={{ background:'var(--color-surface)', border:'1px solid var(--color-border-soft)' }}>
          <div className="flex items-center gap-3">
            <Truck className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>لوحة تحكم الموزع</h2>
              {profile && (
                <p className="text-xs mt-0.5" style={{ color:'var(--color-text-soft)' }}>
                  الحالة: {profile?.profile?.status || profile?.status || '—'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
              <span>عرض طلبات Pool</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1"
              title="تصفية الحالة"
            >
              <option value="active">نشطة</option>
              <option value="accepted">مقبولة</option>
              <option value="out_for_delivery">خارج للتسليم</option>
              <option value="delivered">تم التسليم</option>
              <option value="failed">تعذر التسليم</option>
              <option value="all">الكل</option>
            </select>
            <Button onClick={fetchOrders}><RefreshCw className="w-4 h-4" /></Button>
            <Button onClick={() => navigate('/delivery/summary')}>ملخص الرحلة</Button>
          </div>
        </header>

        {error && (
          <div className="p-3 mb-4 rounded-lg flex items-center gap-2" style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.25)', color:'#7f1d1d' }}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Orders list */}
          <div className="rounded-lg shadow-sm border p-3" style={{ background:'var(--color-surface)', borderColor:'var(--color-border-soft)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">الطلبات</div>
              <Badge color="neutral">{orders.length}</Badge>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-auto">
                  {loading && (
                    <div className="space-y-2">
                      {/* skeletons */}
                      <div className="skeleton h-12" />
                      <div className="skeleton h-12" />
                      <div className="skeleton h-12" />
                    </div>
                  )}
              {!loading && orders.length === 0 && (
                <div className="text-sm text-gray-500">لا توجد طلبات مطابقة للتصفية الحالية</div>
              )}
              {orders.map((o) => (
                <div key={o.id} className={`rounded border p-2`} style={activeId === o.id ? { borderColor: 'rgba(var(--color-primary-rgb),0.45)', background:'rgba(var(--color-primary-rgb),0.06)' } : { borderColor: 'var(--color-border-soft)', background:'var(--color-surface)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* select this order to include in the route planner */}
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedStops.find(s => s.id === o.id)}
                          onChange={() => toggleStopForOrder(o)}
                        />
                      </label>
                      <button className="text-right" onClick={() => setActiveId(o.id)}>
                      <div className="font-semibold" style={{ color:'var(--color-text)' }}>#{o.id.slice(0,8)}...</div>
                      <div className="text-xs" style={{ color:'var(--color-text-faint)' }}>الحالة: {o.deliveryStatus}</div>
                    </button>
                    </div>
                    <Badge color={o.deliveryStatus === 'out_for_delivery' ? 'info' : o.deliveryStatus === 'accepted' ? 'warning' : o.deliveryStatus === 'delivered' ? 'success' : o.deliveryStatus === 'failed' ? 'danger' : 'neutral'}>
                      {o.deliveryStatus}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pool && (
                      <Button size="sm" onClick={() => handleOrderAction('accept', o.id)}>استلام</Button>
                    )}
                    {!pool && o.deliveryStatus === 'accepted' && (
                      <Button size="sm" onClick={() => handleOrderAction('start', o.id)}>بدء التسليم</Button>
                    )}
                    {!pool && o.deliveryStatus === 'out_for_delivery' && (
                      <>
                        <label className="text-xs cursor-pointer inline-flex items-center gap-2">
                          <input type="file" className="hidden" onChange={(e) => setSignatureFile(e.target.files?.[0] || null)} />
                          <span className="px-2 py-1 border rounded inline-flex items-center gap-1"><FileSignature className="w-4 h-4" /> توقيع</span>
                        </label>
                        <Button size="sm" variant="success" onClick={() => handleOrderAction('complete', o.id)}><CheckCircle2 className="w-4 h-4" /> تم التسليم</Button>
                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 text-xs"
                            placeholder="سبب الفشل"
                            value={failReason}
                            onChange={(e) => setFailReason(e.target.value)}
                          />
                          <Button size="sm" variant="destructive" onClick={() => handleOrderAction('fail', o.id, { reason: failReason || 'تعذر الوصول' })}>تعذر التسليم</Button>
                        </div>
                      </>
                    )}
                    {o.deliveryStatus !== 'delivered' && (
                      <div className="flex items-center gap-2">
                        <input
                          className="border rounded px-2 py-1 text-xs"
                          placeholder="OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        <Button size="sm" variant="outline" onClick={() => handleOrderAction('otp', o.id)}><KeyRound className="w-4 h-4" /> تحقق</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active order details + Route planner */}
          <div className="rounded-lg shadow-sm border p-4" style={{ background:'var(--color-surface)', borderColor:'var(--color-border-soft)' }}>
            <h3 className="font-semibold mb-2">خريطة وتخطيط المسار</h3>
            <RoutePlanner stops={selectedStops} />
            <div className="mt-4">
              <h4 className="font-semibold mb-2">تفاصيل الطلب</h4>
              {!activeId && <div className="text-sm" style={{ color:'var(--color-text-faint)' }}>اختر طلباً من القائمة لعرض التفاصيل</div>}
              {activeId && (
                <div className="space-y-3">
                  <div className="text-sm" style={{ color:'var(--color-text)' }}>المعرف: <span className="font-mono">{activeId}</span></div>
                  <div className="text-xs" style={{ color:'var(--color-text-faint)' }}>استخدم الخريطة أعلاه لعرض الطريق الحي</div>
                  <div className="pt-2 border-t">
                    <Button onClick={fetchOrders} size="sm" variant="outline"><RefreshCw className="w-4 h-4" /> تحديث</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
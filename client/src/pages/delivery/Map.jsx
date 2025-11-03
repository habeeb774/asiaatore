import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import ReactLeafletCompat from '../../utils/reactLeafletCompat.jsx';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Navigation, Upload, AlertCircle } from 'lucide-react';
import DriverSupport from '../../components/DriverSupport.jsx';

// Leaflet setup is performed by reactLeafletCompat when the map components are requested.

export default function DeliveryMapPage() {
  const { user } = useAuth() || {};
  const [last, setLast] = useState(null);
  const [trail, setTrail] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [pool, setPool] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersErr, setOrdersErr] = useState('');
  const [tileErr, setTileErr] = useState('');
  const [useFallbackTiles, setUseFallbackTiles] = useState(false);
  const esRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [failReason, setFailReason] = useState('');

  // Load last known location from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lastLocation');
      if (saved) {
        const obj = JSON.parse(saved);
        if (obj && obj.lat && obj.lng) {
          setLast({ lat: obj.lat, lng: obj.lng, accuracy: obj.accuracy || null, at: obj.at || Date.now() });
          setTrail((t) => t.concat([[obj.lat, obj.lng]]));
        }
      }
    } catch {}
  }, []);

  // استخدام useCallback لتحسين الأداء
  const fetchOrders = useCallback(async () => {
    if (!(user && ['delivery', 'admin'].includes(user.role))) return;
    
    setLoadingOrders(true);
    setOrdersErr('');
    try {
      const params = {};
      if (pool) params.pool = 1;
      if (statusFilter !== 'active' && statusFilter !== 'all') params.status = statusFilter;
      
      const res = await api.deliveryList(params);
      let list = res.orders || [];
      
      if (statusFilter === 'active') {
        list = list.filter(o => ['accepted','out_for_delivery'].includes(o.deliveryStatus));
      }
      
      setOrders(list);
      if (list.length && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'فشل جلب الطلبات';
      setOrdersErr(msg);
      console.error('Fetch orders error:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, [user, statusFilter, pool, selectedId]);

  // تحسين نظام التتبع
  const startSharing = useCallback(async () => {
    if (!('geolocation' in navigator)) { 
      alert('المتصفح لا يدعم خدمة الموقع'); 
      return; 
    }
    if (!selectedId) { 
      alert('اختر طلب لإرسال موقعك إليه'); 
      return; 
    }
    
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try { 
          await api.deliveryLocation(selectedId, { 
            lat: latitude, 
            lng: longitude, 
            accuracy 
          }); 
          // Update local UI state and persist
          const loc = { lat: latitude, lng: longitude, accuracy, at: Date.now() };
          setLast(loc);
          setTrail((prev) => {
            const next = prev.concat([[latitude, longitude]]);
            return next.slice(-200); // cap trail length
          });
          try { localStorage.setItem('lastLocation', JSON.stringify(loc)); } catch {}
        } catch (error) {
          console.error('Location sharing error:', error);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setSharing(false);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 5000, 
        timeout: 15000 
      }
    );
  }, [selectedId]);

  const stopSharing = useCallback(() => {
    setSharing(false);
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // دالة موحدة للإجراءات
  const handleOrderAction = useCallback(async (action, orderId, data = null) => {
    if (!orderId) {
      setActionErr('اختر طلب أولاً');
      return;
    }
    
    setActionBusy(true);
    setActionErr('');
    
    try {
      switch (action) {
        case 'accept':
          await api.deliveryAccept(orderId);
          setPool(false);
          setStatusFilter('accepted');
          break;
        case 'start':
          await api.deliveryStart(orderId);
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, deliveryStatus: 'out_for_delivery' } : o
          ));
          break;
        case 'complete': {
          let body;
          if (proofFile) {
            const fd = new FormData();
            fd.append('proof', proofFile);
            body = fd;
          } else {
            body = { note: 'تم التسليم' };
          }
          await api.deliveryComplete(orderId, body);
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, deliveryStatus: 'delivered' } : o
          ));
          stopSharing();
          setProofFile(null);
          break;
        }
        case 'fail':
          if (!data?.reason) {
            setActionErr('اذكر سبب الفشل');
            return;
          }
          await api.deliveryFail(orderId, data.reason);
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, deliveryStatus: 'failed' } : o
          ));
          break;
        default:
          return;
      }
      
      await fetchOrders();
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.message || `فشل ${action}`;
      setActionErr(errorMsg);
      console.error(`${action} error:`, e);
    } finally {
      setActionBusy(false);
    }
  }, [proofFile, stopSharing, fetchOrders]);

  // Fetch orders on mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // SSE: subscribe to delivery events for live updates
  useEffect(() => {
    if (!(user && ['delivery', 'admin'].includes(user.role))) return;
    try {
      const es = new EventSource('/api/events');
      esRef.current = es;
      // delivery.updated events: update order list
      es.addEventListener('delivery.updated', (ev) => {
        try {
          const data = JSON.parse(ev.data || '{}');
          const { orderId, deliveryStatus } = data || {};
          if (!orderId) return;
          setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, deliveryStatus, ...data } : o)));
        } catch {}
      });
      // delivery.location events: only update selected order last location display
      es.addEventListener('delivery.location', (ev) => {
        try {
          const data = JSON.parse(ev.data || '{}');
          if (data?.deliveryLocation && data.orderId === selectedId) {
            const { lat, lng, accuracy } = data.deliveryLocation || {};
            if (lat && lng) {
              setLast({ lat, lng, accuracy: accuracy || null, at: Date.now() });
              setTrail((t) => t.concat([[lat, lng]]));
            }
          }
        } catch {}
      });
      es.onerror = () => {
        // Ignore; keep trying or let the connection retry automatically
      };
      return () => { es.close(); esRef.current = null; };
    } catch {}
  }, [user, selectedId]);



  // التحقق من الصلاحيات
  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="container mx-auto p-4">غير مصرح بالوصول</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Navigation className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">خريطة التوصيل</h1>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
            <span>عرض طلبات غير المخصصة (Pool)</span>
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
          <Button onClick={fetchOrders} disabled={loadingOrders}>{loadingOrders ? '...تحديث' : 'تحديث'}</Button>
        </div>
      </div>

      {ordersErr && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{ordersErr}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="h-[70vh] rounded overflow-hidden border">
            <ReactLeafletCompat>
              {(LeafletComponents) => {
                // Define small helpers here so they can access Leaflet's useMap from the loaded bundle
                const FitToMarker = () => {
                  const map = LeafletComponents.useMap();
                  useEffect(() => {
                    try {
                      const lastLoc = JSON.parse(localStorage.getItem('lastLocation'));
                      if (lastLoc?.lat && lastLoc?.lng) {
                        map.setView([lastLoc.lat, lastLoc.lng], Math.max(map.getZoom(), 14), { animate: true });
                      }
                    } catch {}
                  }, [map]);
                  return null;
                };

                const InvalidateSize = () => {
                  const map = LeafletComponents.useMap();
                  useEffect(() => {
                    const handleResize = () => map.invalidateSize();
                    const timer = setTimeout(handleResize, 100);
                    window.addEventListener('resize', handleResize);
                    return () => {
                      clearTimeout(timer);
                      window.removeEventListener('resize', handleResize);
                    };
                  }, [map]);
                  return null;
                };

                return (
                  <LeafletComponents.MapContainer center={[24.7136, 46.6753]} zoom={12} scrollWheelZoom className="h-full w-full">
                    <InvalidateSize />
                    <FitToMarker />
                    <LeafletComponents.TileLayer
                      url={useFallbackTiles ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
                      attribution='&copy; OpenStreetMap contributors'
                      eventHandlers={{ tileerror: () => { setUseFallbackTiles(true); setTileErr('فشل تحميل بلاطات الخريطة — سيتم استخدام خريطة بديلة'); } }}
                    />
                    {last?.lat && last?.lng && (
                      <LeafletComponents.Marker position={[last.lat, last.lng]} />
                    )}
                    {trail.length > 1 && (
                      <LeafletComponents.Polyline positions={trail} color="#3b82f6" weight={4} opacity={0.7} />
                    )}
                  </LeafletComponents.MapContainer>
                );
              }}
            </ReactLeafletCompat>
          </div>
          {tileErr && (
            <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">{tileErr}</div>
          )}
        </div>

        {/* Sidebar: orders and actions */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-3 bg-white space-y-3 max-h-[70vh] overflow-auto">
            <div className="flex items-center justify-between">
              <div className="font-semibold">الطلبات</div>
              <Badge color="neutral">{orders.length}</Badge>
            </div>
            {!orders.length && (
              <div className="text-sm text-gray-500">لا توجد طلبات مطابقة للتصفية الحالية</div>
            )}
            {orders.map((o) => (
              <div key={o.id} className={`rounded border p-2 ${selectedId === o.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <button className="text-right" onClick={() => setSelectedId(o.id)}>
                    <div className="font-semibold">#{o.id.slice(0,8)}...</div>
                    <div className="text-xs text-gray-500">الحالة: {o.deliveryStatus}</div>
                  </button>
                  <Badge color={o.deliveryStatus === 'out_for_delivery' ? 'info' : o.deliveryStatus === 'accepted' ? 'warning' : o.deliveryStatus === 'delivered' ? 'success' : o.deliveryStatus === 'failed' ? 'danger' : 'neutral'}>
                    {o.deliveryStatus}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pool && (
                    <Button size="sm" disabled={actionBusy} onClick={() => handleOrderAction('accept', o.id)}>استلام</Button>
                  )}
                  {!pool && o.deliveryStatus === 'accepted' && (
                    <Button size="sm" disabled={actionBusy} onClick={() => handleOrderAction('start', o.id)}>بدء التسليم</Button>
                  )}
                  {!pool && o.deliveryStatus === 'out_for_delivery' && (
                    <>
                      <label className="text-xs cursor-pointer inline-flex items-center gap-2">
                        <input type="file" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                        <span className="px-2 py-1 border rounded">إرفاق إثبات</span>
                      </label>
                      <Button size="sm" variant="success" disabled={actionBusy} onClick={() => handleOrderAction('complete', o.id)}>تم التسليم</Button>
                      <div className="flex items-center gap-2">
                        <input
                          className="border rounded px-2 py-1 text-xs"
                          placeholder="سبب الفشل"
                          value={failReason}
                          onChange={(e) => setFailReason(e.target.value)}
                        />
                        <Button size="sm" variant="destructive" disabled={actionBusy} onClick={() => handleOrderAction('fail', o.id, { reason: failReason || 'تعذر الوصول' })}>تعذر التسليم</Button>
                      </div>
                    </>
                  )}
                  {!!last && (
                    <a
                      className="text-xs text-blue-600 underline"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(last.lat + ',' + last.lng)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      فتح في الخرائط
                    </a>
                  )}
                </div>
              </div>
            ))}
            {actionErr && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{actionErr}</div>
            )}
            <div className="pt-3 border-t">
              <DriverSupport orderId={selectedId} user={user} />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t">
              {!sharing ? (
                <Button onClick={startSharing} disabled={!selectedId}>مشاركة موقعي</Button>
              ) : (
                <Button variant="outline" onClick={stopSharing}>إيقاف المشاركة</Button>
              )}
              {last && (
                <span className="text-xs text-gray-500">آخر تحديث: {new Date(last.at || Date.now()).toLocaleTimeString('ar-SA')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Note: helper map components are defined inline inside the ReactLeafletCompat render
// above so they use the LeafletComponents provided by the runtime wrapper. Keeping
// global definitions that call `useMap()` directly caused lint/runtime errors when
// Leaflet wasn't loaded during SSR or before the runtime wrapper runs.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/badge.jsx';

// Minimal map-less tracker: shows last known coordinates and live updates.
// You can later swap this for Leaflet/Google Maps rendering.
export default function DeliveryMapPage() {
  const { user } = useAuth() || {};
  const [logs, setLogs] = useState([]);
  const [last, setLast] = useState(null);
  const [trail, setTrail] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active | all | unassigned | accepted | out_for_delivery | delivered | failed
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

  // Fetch orders with filters (status/pool)
  useEffect(() => {
    if (!(user && (user.role === 'delivery' || user.role === 'admin'))) return;
    const fetchOrders = async () => {
      setLoadingOrders(true);
      setOrdersErr('');
      try {
        const params = {};
        if (pool) params.pool = 1;
        // Only one status is supported server-side; for "active" we fetch all and filter client-side
        if (statusFilter !== 'active' && statusFilter !== 'all') params.status = statusFilter;
        const res = await api.deliveryList(params);
        let list = res.orders || [];
        if (statusFilter === 'active') {
          list = list.filter(o => ['accepted','out_for_delivery'].includes(o.deliveryStatus));
        }
        setOrders(list);
        // Preserve selection if still present; otherwise select first
        if (list.length) {
          const keep = selectedId && list.some(o => o.id === selectedId);
          setSelectedId(keep ? selectedId : list[0].id);
        } else {
          setSelectedId('');
        }
      } catch (e) {
        const msg = e?.data?.error || e?.message || 'فشل جلب الطلبات';
        setOrdersErr(msg);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter, pool]);

  // Preload last known location from profile to avoid empty map before first update
  useEffect(() => {
    if (!(user && (user.role === 'delivery' || user.role === 'admin'))) return;
    (async () => {
      try {
        const r = await api.deliveryProfileGet();
        const loc = r?.profile?.lastKnownLocation;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          const row = { orderId: null, lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, ts: loc.at || new Date().toISOString() };
          setLast(row);
          setTrail(prev => [...prev, [row.lat, row.lng]].slice(-200));
        }
      } catch {}
    })();
  }, [user]);

  useEffect(() => {
    if (!(user && (user.role === 'delivery' || user.role === 'admin'))) return;
    const es = new EventSource('/api/events');
    esRef.current = es;
    es.addEventListener('delivery.location', (ev) => {
      try {
        const data = JSON.parse(ev.data);
        const { orderId, location } = data || {};
        if (!location) return;
        const row = { orderId, lat: location.lat, lng: location.lng, accuracy: location.accuracy, ts: location.at };
        setLast(row);
        setTrail(prev => {
          const next = [...prev, [row.lat, row.lng]];
          // cap to last 200 points
          return next.slice(-200);
        });
        setLogs((prev) => [{ t: new Date().toLocaleTimeString(), ...row }, ...prev].slice(0, 50));
      } catch (e) {
        // ignore
      }
    });
    return () => { es.close(); };
  }, [user]);

  async function startSharing() {
    if (!('geolocation' in navigator)) { alert('المتصفح لا يدعم الموقع'); return; }
    if (!selectedId) { alert('اختر طلب لإرسال موقعك إليه'); return; }
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      // Send location to backend; backend will broadcast to relevant users
      try { await api.deliveryLocation(selectedId, { lat: latitude, lng: longitude, accuracy }); }
      catch { /* swallow */ }
    }, (err) => {
      console.warn('geo err', err);
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  }

  function stopSharing() {
    setSharing(false);
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  // Leaflet default icon fix for bundlers
  const markerIcon = useMemo(() => new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  }), []);

  const center = last ? [last.lat || 24.7136, last.lng || 46.6753] : [24.7136, 46.6753]; // Riyadh fallback

  const FitToMarker = () => {
    const map = useMap();
    useEffect(() => {
      if (last?.lat && last?.lng) {
        map.setView([last.lat, last.lng], Math.max(map.getZoom(), 14), { animate: true });
      }
    }, [last, map]);
    return null;
  };

  // Invalidate size after mount and on container resize to avoid blank map
  const InvalidateSize = () => {
    const map = useMap();
    useEffect(() => {
      const handle = () => map.invalidateSize();
      const t = setTimeout(handle, 50);
      window.addEventListener('resize', handle);
      return () => { clearTimeout(t); window.removeEventListener('resize', handle); };
    }, [map]);
    return null;
  };

  const notLogged = !user;
  const notAllowed = !(user && (user.role === 'delivery' || user.role === 'admin'));

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedId), [orders, selectedId]);

  async function doAccept() {
    if (!selectedId) { setActionErr('اختر طلب أولاً'); return; }
    setActionBusy(true); setActionErr('');
    try {
      await api.deliveryAccept(selectedId);
      // بعد القبول انقل الفلاتر إلى "مقبولة" وأعد الجلب
      setPool(false);
      setStatusFilter('accepted');
      try {
        const res = await api.deliveryList({ status: 'accepted' });
        const list = res.orders || [];
        setOrders(list);
        if (list.some(o => o.id === selectedId)) setSelectedId(selectedId);
      } catch {}
    } catch (e) {
      setActionErr(e?.data?.error || e?.message || 'فشل قبول الطلب');
    } finally { setActionBusy(false); }
  }

  async function doStart() {
    if (!selectedId) { setActionErr('اختر طلب أولاً'); return; }
    setActionBusy(true); setActionErr('');
    try {
      await api.deliveryStart(selectedId);
      // حدث الحالة محلياً
      setOrders(prev => prev.map(o => o.id === selectedId ? { ...o, deliveryStatus: 'out_for_delivery' } : o));
    } catch (e) {
      setActionErr(e?.data?.error || e?.message || 'فشل بدء التوصيل');
    } finally { setActionBusy(false); }
  }

  async function doComplete() {
    if (!selectedId) { setActionErr('اختر طلب أولاً'); return; }
    setActionBusy(true); setActionErr('');
    try {
      let body;
      if (proofFile) {
        const fd = new FormData();
        fd.append('proof', proofFile);
        // اختياري: ملاحظة
        // fd.append('note', 'تم التسليم');
        body = fd;
      } else {
        body = { note: 'تم التسليم' };
      }
      await api.deliveryComplete(selectedId, body);
      setOrders(prev => prev.map(o => o.id === selectedId ? { ...o, deliveryStatus: 'delivered' } : o));
      setSharing(false); // إيقاف مشاركة الموقع بعد التسليم
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    } catch (e) {
      setActionErr(e?.data?.error || e?.message || 'فشل إكمال التسليم');
    } finally { setActionBusy(false); }
  }

  async function doFail() {
    if (!selectedId) { setActionErr('اختر طلب أولاً'); return; }
    if (!failReason) { setActionErr('اذكر سبب الفشل'); return; }
    setActionBusy(true); setActionErr('');
    try {
      await api.deliveryFail(selectedId, failReason);
      setOrders(prev => prev.map(o => o.id === selectedId ? { ...o, deliveryStatus: 'failed' } : o));
    } catch (e) {
      setActionErr(e?.data?.error || e?.message || 'فشل تسجيل محاولة فاشلة');
    } finally { setActionBusy(false); }
  }

  return (
    <div className="container mx-auto p-4">
      {notLogged && <div className="mb-2">يجب تسجيل الدخول</div>}
      {(!notLogged && notAllowed) && <div className="mb-2">غير مصرح</div>}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">خريطة التتبع</h1>
          {selectedOrder && (
            <div className="mt-1">
              <Badge color={selectedOrder.deliveryStatus==='delivered'?'success':selectedOrder.deliveryStatus==='failed'?'danger':selectedOrder.deliveryStatus==='out_for_delivery'?'info':selectedOrder.deliveryStatus==='accepted'?'warning':'neutral'}>
                الحالة: {selectedOrder.deliveryStatus}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!sharing ? (
            <Button variant="success" onClick={startSharing}>بدأ مشاركة موقعي</Button>
          ) : (
            <Button variant="outline" onClick={stopSharing}>إيقاف المشاركة</Button>
          )}
        </div>
      </div>
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">الترشيح:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border px-2 py-1 rounded">
            <option value="active">النشطة (قيد التسليم)</option>
            <option value="all">الكل</option>
            <option value="unassigned">غير المعينة</option>
            <option value="accepted">مقبولة</option>
            <option value="out_for_delivery">خارج للتسليم</option>
            <option value="delivered">تم التسليم</option>
            <option value="failed">فشل التسليم</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
          <span className="text-sm">إظهار المسبح (الطلبات غير المعينة)</span>
        </label>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">اختر طلب:</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="border px-2 py-2 rounded min-w-56 bg-white">
            <option value="">— اختر —</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>{o.id.slice(0,8)}… — {o.deliveryStatus}</option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={async () => {
              // manual refresh
              try {
                setLoadingOrders(true); setOrdersErr('');
                const params = {};
                if (pool) params.pool = 1;
                if (statusFilter !== 'active' && statusFilter !== 'all') params.status = statusFilter;
                const res = await api.deliveryList(params);
                let list = res.orders || [];
                if (statusFilter === 'active') list = list.filter(o => ['accepted','out_for_delivery'].includes(o.deliveryStatus));
                setOrders(list);
              } catch (e) { setOrdersErr(e?.data?.error || e?.message || 'فشل جلب الطلبات'); }
              finally { setLoadingOrders(false); }
            }}
            disabled={loadingOrders}
          >{loadingOrders ? 'يُحدّث…' : 'تحديث'}</Button>
          {/* Actions: Accept / Start */}
          <Button
            variant="success"
            onClick={doAccept}
            disabled={actionBusy || !selectedOrder || selectedOrder.deliveryStatus !== 'unassigned'}
            title="قبول الطلب لنفس السائق"
          >قبول</Button>
          <Button
            variant="warning"
            onClick={doStart}
            disabled={actionBusy || !selectedOrder || selectedOrder.deliveryStatus !== 'accepted'}
            title="بدء التوصيل (خارج للتسليم)"
          >بدء التوصيل</Button>
        </div>
      </div>
      {/* Complete / Fail controls */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">إثبات التسليم (اختياري):</label>
          <input type="file" accept="image/*" onChange={(e)=> setProofFile(e.target.files?.[0] || null)} />
          <Button
            variant="success"
            onClick={doComplete}
            disabled={actionBusy || !selectedOrder || selectedOrder.deliveryStatus !== 'out_for_delivery'}
          >إكمال التسليم</Button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">سبب الفشل:</label>
          <input className="border px-2 py-1 rounded" placeholder="مثال: العميل غير متاح" value={failReason} onChange={(e)=> setFailReason(e.target.value)} />
          <Button
            variant="danger"
            onClick={doFail}
            disabled={actionBusy || !selectedOrder || !['accepted','out_for_delivery'].includes(selectedOrder.deliveryStatus)}
          >فشل التسليم</Button>
        </div>
      </div>
      {ordersErr && (
        <div className="mb-3 text-sm text-red-600">
          {ordersErr === 'FORBIDDEN' ? 'ليس لديك صلاحية. تأكد أن الحساب بصلاحية عامل توصيل أو ادمن.' : ordersErr}
        </div>
      )}
      {selectedOrder && (
        <div className="mb-3 text-sm text-gray-700">
          الحالة الحالية للطلب المختار: <span className="font-semibold">{selectedOrder.deliveryStatus}</span>
        </div>
      )}
      {actionErr && (
        <div className="mb-3 text-sm text-red-600">{actionErr}</div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded border p-3 bg-white">
          <h2 className="font-semibold mb-2">آخر تحديث</h2>
          {last ? (
            <div className="text-sm">
              <div>lat: {last.lat}</div>
              <div>lng: {last.lng}</div>
              {last.accuracy != null && <div>دقة: {Math.round(last.accuracy)} م</div>}
              {last.orderId && <div>طلب: {String(last.orderId).slice(0,8)}...</div>}
              <div>زمن: {new Date(last.ts || Date.now()).toLocaleString()}</div>
            </div>
          ) : <p className="text-gray-600">لا يوجد بيانات بعد</p>}
        </div>
        <div className="rounded border p-3 bg-white">
          <h2 className="font-semibold mb-2">الخريطة</h2>
          <div className="h-64 md:h-[420px] rounded overflow-hidden">
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
              {!useFallbackTiles ? (
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                  eventHandlers={{
                    tileerror: (e) => {
                      console.error('Leaflet tile error', e?.error || e);
                      setTileErr('تعذر تحميل صور خريطة OSM. سيجري التبديل إلى مزود احتياطي.');
                      setUseFallbackTiles(true);
                    }
                  }}
                />
              ) : (
                <TileLayer
                  url="https://tile.openstreetmap.de/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                  eventHandlers={{
                    tileerror: (e) => {
                      console.error('Leaflet fallback tile error', e?.error || e);
                      setTileErr('تعذر تحميل صور الخريطة من المزود الاحتياطي أيضاً.');
                    }
                  }}
                />
              )}
              {last?.lat && last?.lng && (
                <Marker position={[last.lat, last.lng]} icon={markerIcon} />
              )}
              {trail.length > 1 && (
                <Polyline positions={trail} color="#1d4ed8" weight={4} opacity={0.7} />
              )}
              <FitToMarker />
              <InvalidateSize />
            </MapContainer>
          </div>
          {tileErr && (
            <div className="mt-2 text-sm text-red-600">
              {tileErr}
            </div>
          )}
        </div>
      </div>
      <div className="rounded border p-3 bg-white mt-4">
        <h2 className="font-semibold mb-2">التدفق المباشر</h2>
        <div className="h-48 overflow-auto text-sm space-y-1">
          {logs.map((l, i) => (
            <div key={i} className="font-mono">[{l.t}] lat {l.lat}, lng {l.lng} {l.orderId ? `order ${String(l.orderId).slice(0,6)}` : ''}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

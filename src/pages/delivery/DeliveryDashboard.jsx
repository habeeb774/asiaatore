import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import Modal from '../../components/ui/Modal.jsx';

const STATUS_COLORS = {
  delivered: 'success',
  failed: 'danger',
  out_for_delivery: 'info',
  accepted: 'warning',
  assigned: 'warning',
  unassigned: 'neutral',
};

const DEFAULT_CENTER = [24.7136, 46.6753]; // Riyadh fallback

const formatDuration = (start, end) => {
  if (!start) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;
  const diffSec = Math.max(0, Math.floor((end - startDate.getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;
  if (hours > 0) return `${hours}س ${minutes}د`;
  if (minutes > 0) return `${minutes}د ${seconds}ث`;
  return `${seconds}ث`;
};

const formatSecondsCompact = (seconds) => {
  if (seconds == null) return null;
  const sec = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remain = sec % 60;
  if (hours > 0) return `${hours}س ${minutes}د`;
  if (minutes > 0) return `${minutes}د ${remain}ث`;
  return `${remain}ث`;
};

export default function DeliveryDashboard() {
  const { user } = useAuth() || {};
  const [orders, setOrders] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [err, setErr] = useState('');
  const [banner, setBanner] = useState(null);
  const [lastLocation, setLastLocation] = useState(null);
  const [actionState, setActionState] = useState({ id: null, type: null });
  const [proofModal, setProofModal] = useState({ open: false, order: null, mode: null, busy: false, error: null });
  const [proofForm, setProofForm] = useState({ note: '', file: null, otp: '', hint: null, generating: false });
  const [nowTs, setNowTs] = useState(Date.now());
  const esRef = useRef(null);
  const bannerTimer = useRef(null);
  const selectedRef = useRef('');

  const showBanner = useCallback((text, tone = 'info') => {
    setBanner({ text, tone });
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 6000);
  }, []);

  useEffect(() => () => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadAssigned = useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const res = await api.deliveryAssigned();
      const list = res?.orders || [];
      setOrders(list);
      if (!selectedRef.current && list.length) setSelectedOrderId(list[0].id);
    } catch (e) {
      setErr(e?.data?.error || e?.message || 'تعذّر جلب الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    selectedRef.current = selectedOrderId;
  }, [selectedOrderId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.deliveryHistory({ limit: 12 });
      setHistory(res?.orders || []);
    } catch (_) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!(user && (user.role === 'delivery' || user.role === 'admin'))) return;
    loadAssigned();
    loadHistory();
    (async () => {
      try {
        const prof = await api.deliveryProfileGet();
        const loc = prof?.profile?.lastKnownLocation;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') setLastLocation(loc);
      } catch (_) { /* ignore */ }
    })();
  }, [user, loadAssigned, loadHistory]);

  useEffect(() => {
    if (!(user && (user.role === 'delivery' || user.role === 'admin'))) return;
    let active = true;
    const es = new EventSource('/api/events');
    esRef.current = es;

    const handleAssigned = async (payload) => {
      if (!active) return;
      try {
        const summary = payload?.order;
        const targetDriver = summary?.deliveryDriverId || payload?.driverId;
        if (user.role === 'delivery' && targetDriver && targetDriver !== user.id) return;
        let order = summary;
        if (!order && payload?.orderId) {
          try {
            const res = await api.deliveryGet(payload.orderId);
            order = res?.order;
          } catch (_) { /* ignore */ }
        }
        if (!order) return;
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === order.id);
          if (exists) {
            return prev.map((o) => (o.id === order.id ? { ...o, ...order } : o));
          }
          return [order, ...prev];
        });
        setSelectedOrderId((prev) => prev || order.id);
        if (user.role === 'delivery') {
          showBanner(`تم تعيين طلب جديد: ${order.id.slice(0, 8)}…`, 'info');
        }
      } catch (_) {
        // ignore
      }
    };

    const handleUpdated = (payload) => {
      if (!active || !payload?.orderId) return;
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === payload.orderId);
        if (idx === -1) return prev;
        const updated = {
          ...prev[idx],
          deliveryStatus: payload.deliveryStatus || prev[idx].deliveryStatus,
          deliveredAt: payload.deliveredAt || prev[idx].deliveredAt,
          failedAt: payload.failedAt || prev[idx].failedAt,
          acceptedAt: payload.acceptedAt || prev[idx].acceptedAt,
          outForDeliveryAt: payload.outForDeliveryAt || prev[idx].outForDeliveryAt,
          deliveryDurationSec: payload.deliveryDurationSec ?? prev[idx].deliveryDurationSec,
        };
        const next = [...prev];
        if (['delivered', 'failed'].includes(updated.deliveryStatus)) {
          next.splice(idx, 1);
          setHistory((hist) => [{ ...updated }, ...(hist || [])].slice(0, 20));
          if (selectedRef.current === updated.id) {
            const remaining = next[0]?.id || '';
            setSelectedOrderId(remaining);
          }
        } else {
          next[idx] = updated;
        }
        return next;
      });
    };

    const handleLocation = (payload) => {
      if (!active) return;
      try {
        const loc = payload?.location;
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') setLastLocation(loc);
      } catch (_) {
        // ignore
      }
    };

    es.addEventListener('delivery.assigned', (ev) => {
      try { handleAssigned(JSON.parse(ev.data)); } catch (_) { /* ignore */ }
    });
    es.addEventListener('delivery.updated', (ev) => {
      try { handleUpdated(JSON.parse(ev.data)); } catch (_) { /* ignore */ }
    });
    es.addEventListener('delivery.location', (ev) => {
      try { handleLocation(JSON.parse(ev.data)); } catch (_) { /* ignore */ }
    });

    return () => {
      active = false;
      es.close();
      esRef.current = null;
    };
  }, [user, showBanner]);

  const markerIcon = useMemo(() => new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }), []);

  const stats = useMemo(() => {
    const total = orders.length;
    const accepted = orders.filter((o) => o.deliveryStatus === 'accepted').length;
    const onTheWay = orders.filter((o) => o.deliveryStatus === 'out_for_delivery').length;
    const pending = orders.filter((o) => o.deliveryStatus === 'assigned' || o.deliveryStatus === 'unassigned').length;
    return { total, accepted, onTheWay, pending };
  }, [orders]);

  const selectedOrder = useMemo(() => orders.find((o) => o.id === selectedOrderId) || null, [orders, selectedOrderId]);

  const proofOrder = proofModal.order;
  const proofMode = proofModal.mode;
  const proofBusy = proofModal.busy;
  const proofError = proofModal.error;
  const proofGenerating = proofForm.generating;
  const hasProofFile = Boolean(proofForm.file);
  const proofOtpReady = (proofForm.otp || '').length === 6;
  const proofTitle = proofOrder ? `إثبات تسليم الطلب ${proofOrder.id.slice(0, 8)}…` : 'إثبات التسليم';

  const proofFooter = (() => {
    if (!proofModal.open) return null;
    if (!proofMode) {
      return (
        <div className="flex justify-end">
          <Button variant="outline" onClick={closeProofModal} disabled={proofBusy}>إغلاق</Button>
        </div>
      );
    }
    if (proofMode === 'photo') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={backToProofChoice} disabled={proofBusy}>تغيير الطريقة</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeProofModal} disabled={proofBusy}>إلغاء</Button>
            <Button variant="success" onClick={submitPhotoProof} disabled={proofBusy || !hasProofFile}>
              {proofBusy ? 'جارٍ الرفع…' : 'اعتماد صورة الإثبات'}
            </Button>
          </div>
        </div>
      );
    }
    if (proofMode === 'signature') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={backToProofChoice} disabled={proofBusy}>تغيير الطريقة</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeProofModal} disabled={proofBusy}>إلغاء</Button>
            <Button variant="success" onClick={submitSignatureProof} disabled={proofBusy || !hasProofFile}>
              {proofBusy ? 'جارٍ الرفع…' : 'حفظ التوقيع'}
            </Button>
          </div>
        </div>
      );
    }
    if (proofMode === 'otp') {
      return (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={backToProofChoice} disabled={proofBusy}>تغيير الطريقة</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeProofModal} disabled={proofBusy}>إلغاء</Button>
            <Button variant="success" onClick={submitOtpProof} disabled={proofBusy || !proofOtpReady}>
              {proofBusy ? 'جارٍ التأكيد…' : 'تأكيد الرمز'}
            </Button>
          </div>
        </div>
      );
    }
    return null;
  })();

  const resetProofState = useCallback(() => {
    setProofForm({ note: '', file: null, otp: '', hint: null, generating: false });
    setProofModal((prev) => ({ ...prev, error: null, busy: false }));
  }, []);

  const closeProofModal = useCallback(() => {
    setProofModal({ open: false, order: null, mode: null, busy: false, error: null });
    resetProofState();
  }, [resetProofState]);

  const openProofModal = useCallback((order) => {
    if (!order) return;
    resetProofState();
    setProofModal({ open: true, order, mode: null, busy: false, error: null });
  }, [resetProofState]);

  const selectProofMode = useCallback((mode) => {
    setProofForm({ note: '', file: null, otp: '', hint: null, generating: false });
    setProofModal((prev) => ({ ...prev, mode, error: null, busy: false }));
  }, []);

  const backToProofChoice = useCallback(() => {
    resetProofState();
    setProofModal((prev) => ({ ...prev, mode: null }));
  }, [resetProofState]);

  const handleProofFileInput = useCallback((event) => {
    const file = event?.target?.files?.[0] || null;
    setProofForm((prev) => ({ ...prev, file }));
    setProofModal((prev) => ({ ...prev, error: null }));
  }, []);

  const handleProofNoteChange = useCallback((event) => {
    const note = event?.target?.value || '';
    setProofForm((prev) => ({ ...prev, note }));
    setProofModal((prev) => ({ ...prev, error: null }));
  }, []);

  const handleProofOtpChange = useCallback((event) => {
    const raw = event?.target?.value || '';
    const otp = raw.replace(/\D/g, '').slice(0, 6);
    setProofForm((prev) => ({ ...prev, otp }));
    setProofModal((prev) => ({ ...prev, error: null }));
  }, []);

  const handleAccept = useCallback(async (order) => {
    if (!order) return;
    setActionState({ id: order.id, type: 'accept' });
    try {
      await api.deliveryAccept(order.id);
      showBanner(`تم قبول الطلب ${order.id.slice(0, 8)}…`, 'success');
      await loadAssigned();
    } catch (e) {
      showBanner(e?.data?.error || e?.message || 'تعذر قبول الطلب', 'danger');
    } finally {
      setActionState({ id: null, type: null });
    }
  }, [loadAssigned, showBanner]);

  const handleReject = useCallback(async (order) => {
    if (!order) return;
    const confirm = window.confirm('هل تريد رفض هذا الطلب وإعادته للمسبح؟');
    if (!confirm) return;
    setActionState({ id: order.id, type: 'reject' });
    try {
      await api.deliveryReject(order.id);
      showBanner(`تم رفض الطلب ${order.id.slice(0, 8)}…`, 'warning');
      await loadAssigned();
    } catch (e) {
      showBanner(e?.data?.error || e?.message || 'تعذر رفض الطلب', 'danger');
    } finally {
      setActionState({ id: null, type: null });
    }
  }, [loadAssigned, showBanner]);

  const handleStart = useCallback(async (order) => {
    if (!order) return;
    setActionState({ id: order.id, type: 'start' });
    try {
      await api.deliveryStart(order.id);
      showBanner(`تم وضع الطلب ${order.id.slice(0, 8)}… في حالة "خارج للتسليم"`, 'success');
      await loadAssigned();
    } catch (e) {
      showBanner(e?.data?.error || e?.message || 'فشل بدء التوصيل', 'danger');
    } finally {
      setActionState({ id: null, type: null });
    }
  }, [loadAssigned, showBanner]);

  const handleFail = useCallback(async (order) => {
    if (!order) return;
    const reason = window.prompt('اذكر سبب تعذر التسليم:');
    if (!reason) return;
    setActionState({ id: order.id, type: 'fail' });
    try {
      await api.deliveryFail(order.id, reason);
      showBanner(`تم تسجيل تعذر تسليم الطلب ${order.id.slice(0, 8)}…`, 'warning');
      await loadAssigned();
      loadHistory();
    } catch (e) {
      showBanner(e?.data?.error || e?.message || 'تعذر تسجيل الفشل', 'danger');
    } finally {
      setActionState({ id: null, type: null });
    }
  }, [loadAssigned, loadHistory, showBanner]);

  const submitPhotoProof = async () => {
    const order = proofModal.order;
    if (!order) return;
    if (!proofForm.file) {
      setProofModal((prev) => ({ ...prev, error: 'يرجى اختيار صورة إثبات.' }));
      return;
    }
    setProofModal((prev) => ({ ...prev, busy: true, error: null }));
    try {
      const fd = new FormData();
      fd.append('proof', proofForm.file);
      if (proofForm.note) fd.append('note', proofForm.note);
      await api.deliveryComplete(order.id, fd);
      showBanner(`تم توثيق تسليم الطلب ${order.id.slice(0, 8)}…`, 'success');
      closeProofModal();
      await loadAssigned();
      loadHistory();
    } catch (e) {
      setProofModal((prev) => ({ ...prev, error: e?.data?.error || e?.message || 'فشل رفع صورة الإثبات.' }));
    } finally {
      setProofModal((prev) => ({ ...prev, busy: false }));
    }
  };

  const submitSignatureProof = async () => {
    const order = proofModal.order;
    if (!order) return;
    if (!proofForm.file) {
      setProofModal((prev) => ({ ...prev, error: 'يرجى تحميل صورة التوقيع.' }));
      return;
    }
    setProofModal((prev) => ({ ...prev, busy: true, error: null }));
    try {
      await api.deliverySignature(order.id, proofForm.file);
      showBanner(`تم حفظ توقيع العميل للطلب ${order.id.slice(0, 8)}…`, 'success');
      closeProofModal();
      await loadAssigned();
      loadHistory();
    } catch (e) {
      setProofModal((prev) => ({ ...prev, error: e?.data?.error || e?.message || 'تعذر رفع التوقيع.' }));
    } finally {
      setProofModal((prev) => ({ ...prev, busy: false }));
    }
  };

  const generateOtp = async () => {
    const order = proofModal.order;
    if (!order) return;
    setProofForm((prev) => ({ ...prev, generating: true }));
    setProofModal((prev) => ({ ...prev, error: null }));
    try {
      const res = await api.deliveryOtpGenerate(order.id);
      setProofForm((prev) => ({ ...prev, hint: res?.hint || null, generating: false }));
      showBanner('تم إنشاء رمز OTP وإرساله للعميل.', 'info');
    } catch (e) {
      setProofModal((prev) => ({ ...prev, error: e?.data?.error || e?.message || 'تعذر إنشاء الرمز.' }));
      setProofForm((prev) => ({ ...prev, generating: false }));
    }
  };

  const submitOtpProof = async () => {
    const order = proofModal.order;
    if (!order) return;
    if (!proofForm.otp) {
      setProofModal((prev) => ({ ...prev, error: 'أدخل رمز OTP المكون من 6 أرقام.' }));
      return;
    }
    setProofModal((prev) => ({ ...prev, busy: true, error: null }));
    try {
      await api.deliveryOtpConfirm(order.id, proofForm.otp);
      showBanner(`تم تأكيد تسليم الطلب ${order.id.slice(0, 8)}… عبر OTP`, 'success');
      closeProofModal();
      await loadAssigned();
      loadHistory();
    } catch (e) {
      setProofModal((prev) => ({ ...prev, error: e?.data?.error || e?.message || 'تعذر تأكيد الرمز.' }));
    } finally {
      setProofModal((prev) => ({ ...prev, busy: false }));
    }
  };

  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!(user.role === 'delivery' || user.role === 'admin')) return <div className="container mx-auto p-4">غير مصرح</div>;

  return (
    <>
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">لوحة تحكم عامل التوصيل</h1>
            <p className="text-sm text-gray-600">تابع المهام المحددة لك مباشرة مع التحديث الفوري ومراقبة الموقع.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" onClick={loadAssigned} disabled={loading}>تحديث الطلبات</Button>
            <Link to="/delivery/map"><Button variant="outline">شاشة الخريطة</Button></Link>
            <Link to="/delivery/history"><Button variant="outline">سجل التسليم</Button></Link>
          </div>
        </div>

        {banner && (
          <div className={`rounded-md border px-4 py-3 text-sm ${banner.tone === 'success' ? 'border-green-200 bg-green-50 text-green-800' : banner.tone === 'danger' ? 'border-red-200 bg-red-50 text-red-700' : banner.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-sky-200 bg-sky-50 text-sky-800'}`}>
            {banner.text}
          </div>
        )}

        {err && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

        <div className="grid gap-4 lg:grid-cols-[2fr_1.1fr]">
          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">الطلبات النشطة ({orders.length})</h2>
              {loading && <span className="text-sm text-gray-500">جاري التحديث…</span>}
            </header>
            {orders.length === 0 && !loading ? (
              <div className="rounded border border-dashed bg-white p-6 text-center text-gray-500">لا يوجد طلبات قيد التوصيل حالياً.</div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    selected={order.id === selectedOrderId}
                    onSelect={() => setSelectedOrderId(order.id)}
                    onAccept={() => handleAccept(order)}
                    onReject={() => handleReject(order)}
                    onStart={() => handleStart(order)}
                    onProof={() => openProofModal(order)}
                    onFail={() => handleFail(order)}
                    actionState={actionState}
                    nowTs={nowTs}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">نظرة سريعة</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <StatItem label="إجمالي النشطة" value={stats.total} tone="text-slate-900" />
                <StatItem label="مقبولة" value={stats.accepted} tone="text-amber-600" />
                <StatItem label="خارج للتسليم" value={stats.onTheWay} tone="text-sky-600" />
                <StatItem label="بانتظار البدء" value={stats.pending} tone="text-slate-600" />
              </dl>
              {selectedOrder && (
                <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <div className="font-semibold text-slate-700">الطلب المحدد</div>
                  <div>ID: {selectedOrder.id}</div>
                  <div>الإجمالي: {selectedOrder.grandTotal ?? '—'}</div>
                  <div>الحالة: {selectedOrder.deliveryStatus}</div>
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">آخر موقع مرسل</h3>
              <div className="h-56 overflow-hidden rounded-md border border-slate-100">
                <MapPreview markerIcon={markerIcon} lastLocation={lastLocation} />
              </div>
              {lastLocation ? (
                <p className="mt-2 text-xs text-gray-600">أُرسل آخر تحديث في {lastLocation.at ? new Date(lastLocation.at).toLocaleString() : '—'}.</p>
              ) : (
                <p className="mt-2 text-xs text-gray-500">لم يتم إرسال الموقع بعد. استخدم شاشة الخريطة لبدء المشاركة.</p>
              )}
            </div>

            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">آخر عمليات التسليم</h3>
                {historyLoading && <span className="text-xs text-gray-400">يُحمَّل…</span>}
              </div>
              {history?.length ? (
                <ul className="space-y-2 text-sm">
                  {history.slice(0, 8).map((item) => (
                    <li key={`${item.id}-${item.deliveryStatus}`} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <div className="font-medium text-slate-800">{item.id.slice(0, 8)}…</div>
                        <div className="text-xs text-gray-500">{new Date(item.updatedAt || item.deliveredAt || item.failedAt || Date.now()).toLocaleString()}</div>
                      </div>
                      <Badge color={STATUS_COLORS[item.deliveryStatus] || 'neutral'}>توصيل: {item.deliveryStatus}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">لم يتم تسجيل عمليات بعد.</p>
              )}
            </div>
          </aside>
        </div>
      </div>

      <Modal
        open={proofModal.open}
        onClose={proofBusy ? undefined : closeProofModal}
        closeOnOutside={!proofBusy}
        size="lg"
        title={proofTitle}
        footer={proofFooter}
      >
        {proofOrder && (
          <div className="mb-4 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <div>ID: {proofOrder.id}</div>
            <div>الحالة الحالية: {proofOrder.deliveryStatus}</div>
            <div>قيمة الطلب: {proofOrder.grandTotal ?? '—'}</div>
          </div>
        )}
        {proofError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {proofError}
          </div>
        )}

        {!proofMode && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">اختر وسيلة إثبات التسليم المناسبة للحالة الحالية.</p>
            <div className="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                className="flex h-full flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:border-sky-300 hover:shadow"
                onClick={() => selectProofMode('photo')}
              >
                <span className="text-sm font-semibold text-slate-800">صورة إثبات</span>
                <span className="text-xs text-slate-500">التقط صورة للطرد أو توقيع العميل لإغلاق الطلب.</span>
              </button>
              <button
                type="button"
                className="flex h-full flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:border-sky-300 hover:shadow"
                onClick={() => selectProofMode('signature')}
              >
                <span className="text-sm font-semibold text-slate-800">رفع توقيع</span>
                <span className="text-xs text-slate-500">حمّل صورة للتوقيع بخط اليد أو إيصال الاستلام.</span>
              </button>
              <button
                type="button"
                className="flex h-full flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:border-sky-300 hover:shadow"
                onClick={() => selectProofMode('otp')}
              >
                <span className="text-sm font-semibold text-slate-800">رمز OTP</span>
                <span className="text-xs text-slate-500">اطلب من العميل إدخال الرمز المرسل لإتمام التسليم.</span>
              </button>
            </div>
          </div>
        )}

        {proofMode === 'photo' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">الرجاء رفع صورة واضحة للطرد بعد التسليم. يمكن إضافة ملاحظة اختيارية.</p>
            <div>
              <label className="text-xs font-medium text-slate-600">صورة الإثبات</label>
              <input type="file" accept="image/*" className="mt-1 w-full text-sm" disabled={proofBusy} onChange={handleProofFileInput} />
              {proofForm.file && <p className="mt-1 text-xs text-slate-500">تم اختيار: {proofForm.file.name}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">ملاحظات (اختياري)</label>
              <textarea
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-sky-300 focus:outline-none"
                rows={3}
                placeholder="مثال: تم التسليم للعميل مباشرة"
                value={proofForm.note}
                onChange={handleProofNoteChange}
                disabled={proofBusy}
              />
            </div>
          </div>
        )}

        {proofMode === 'signature' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">أرفق صورة أو ملف للتوقيع المعتمد من العميل لإغلاق الطلب.</p>
            <div>
              <label className="text-xs font-medium text-slate-600">ملف التوقيع</label>
              <input type="file" accept="image/*,application/pdf" className="mt-1 w-full text-sm" disabled={proofBusy} onChange={handleProofFileInput} />
              {proofForm.file && <p className="mt-1 text-xs text-slate-500">تم اختيار: {proofForm.file.name}</p>}
            </div>
            <p className="text-xs text-slate-500">يمكنك استخدام تطبيق توقيع رقمي ثم رفع الملف الناتج.</p>
          </div>
        )}

        {proofMode === 'otp' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">أنشئ رمزاً لمرة واحدة ثم اطلب من العميل قراءته لك لإتمام التسليم.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={generateOtp} disabled={proofBusy || proofGenerating}>
                {proofGenerating ? 'جارٍ الإرسال…' : 'إنشاء رمز جديد'}
              </Button>
              {proofForm.hint && <span className="text-xs text-slate-500">إشارة: {proofForm.hint}</span>}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">رمز OTP</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-center text-lg tracking-widest focus:border-sky-300 focus:outline-none"
                placeholder="••••••"
                value={proofForm.otp}
                onChange={handleProofOtpChange}
                disabled={proofBusy}
              />
              <p className="mt-1 text-xs text-slate-500">أدخل الرمز المكون من 6 أرقام كما أرسله النظام للعميل.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function OrderCard({ order, selected, onSelect, onAccept, onReject, onStart, onProof, onFail, actionState, nowTs }) {
  const statusColor = STATUS_COLORS[order.deliveryStatus] || 'neutral';
  const busyAction = actionState.id === order.id ? actionState.type : null;
  const acceptedSince = formatDuration(order.acceptedAt, nowTs);
  const enRouteSince = formatDuration(order.outForDeliveryAt || order.acceptedAt, nowTs);
  const deliveredDuration = formatSecondsCompact(order.deliveryDurationSec);

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm transition ${selected ? 'border-sky-400 shadow-md ring-1 ring-sky-200' : 'border-slate-200 hover:border-sky-200'}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button type="button" onClick={onSelect} className="text-left">
          <div className="font-semibold text-gray-900">{order.id.slice(0, 12)}…</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Badge color="neutral">طلب: {order.status}</Badge>
            <Badge color={statusColor}>توصيل: {order.deliveryStatus}</Badge>
            {order.grandTotal != null && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">الإجمالي: {order.grandTotal}</span>}
          </div>
          <div className="mt-1 text-xs text-gray-500">آخر تحديث: {new Date(order.updatedAt || Date.now()).toLocaleString()}</div>
          {order.deliveryStatus === 'accepted' && acceptedSince && (
            <div className="mt-1 text-xs text-amber-600">بانتظار الانطلاق منذ {acceptedSince}</div>
          )}
          {order.deliveryStatus === 'out_for_delivery' && enRouteSince && (
            <div className="mt-1 text-xs text-sky-600">في الطريق منذ {enRouteSince}</div>
          )}
          {order.deliveryStatus === 'delivered' && deliveredDuration && (
            <div className="mt-1 text-xs text-emerald-600">مدة التوصيل: {deliveredDuration}</div>
          )}
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {order.deliveryStatus === 'assigned' && (
            <Button variant="success" size="sm" onClick={onAccept} disabled={busyAction === 'accept'}>
              {busyAction === 'accept' ? 'جارٍ التعيين…' : 'قبول الطلب'}
            </Button>
          )}
          {order.deliveryStatus === 'assigned' && (
            <Button variant="outline" size="sm" onClick={onReject} disabled={busyAction === 'reject'}>
              {busyAction === 'reject' ? 'جارٍ الرفض…' : 'رفض الطلب'}
            </Button>
          )}
          {order.deliveryStatus === 'accepted' && (
            <Button variant="primary" size="sm" onClick={onStart} disabled={busyAction === 'start'}>
              {busyAction === 'start' ? 'جاري البدء…' : 'بدء التوصيل'}
            </Button>
          )}
          {order.deliveryStatus === 'accepted' && (
            <Button variant="outline" size="sm" onClick={onReject} disabled={busyAction === 'reject'}>
              {busyAction === 'reject' ? 'جارٍ الرفض…' : 'إرجاع للمسبح'}
            </Button>
          )}
          {order.deliveryStatus === 'out_for_delivery' && (
            <Button variant="success" size="sm" onClick={onProof}>
              تأكيد التسليم
            </Button>
          )}
          {(order.deliveryStatus === 'accepted' || order.deliveryStatus === 'out_for_delivery') && (
            <Button variant="danger" size="sm" onClick={onFail} disabled={busyAction === 'fail'}>
              {busyAction === 'fail' ? 'جارٍ الحفظ…' : 'تعذر التسليم'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, tone }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold ${tone}`}>{typeof value === 'number' ? value : '—'}</dd>
    </div>
  );
}

function MapPreview({ markerIcon, lastLocation }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return <div className="h-full w-full bg-slate-100" />;
  const center = lastLocation && typeof lastLocation.lat === 'number' && typeof lastLocation.lng === 'number'
    ? [lastLocation.lat, lastLocation.lng]
    : DEFAULT_CENTER;
  return (
    <MapContainer center={center} zoom={lastLocation ? 14 : 11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {lastLocation && lastLocation.lat && lastLocation.lng && (
        <Marker position={[lastLocation.lat, lastLocation.lng]} icon={markerIcon} />
      )}
    </MapContainer>
  );
}

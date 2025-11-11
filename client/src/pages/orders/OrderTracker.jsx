import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api/client';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, Truck, Package, MapPin } from 'lucide-react';

export default function OrderTracker() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [shipments, setShipments] = useState(null);
  const esRef = useRef(null);
  const [sseError, setSseError] = useState(null);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Open SSE for live updates if backend is up; suppress noisy errors
    const es = new EventSource('/api/events');
    esRef.current = es;
    const onMsg = (type) => (e) => {
      try {
        const data = JSON.parse(e.data);
        // Filter relevant order-id events
        if (data && data.orderId === id) {
          setEvents(prev => [{ t: Date.now(), type, data }, ...prev].slice(0, 200));
          if (type === 'delivery.updated') setOrder(o => ({ ...(o||{}), deliveryStatus: data.deliveryStatus, deliveredAt: data.deliveredAt || (o && o.deliveredAt) }));
          if (type === 'delivery.location') setOrder(o => ({ ...(o||{}), deliveryLocation: data.location }));
          if (type === 'order.updated') {
            setOrder(o => ({ ...(o||{}), status: data.status || (o && o.status) }));
            // Show notification for status change
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`تحديث الطلب #${id}`, {
                body: `حالة الطلب تغيرت إلى: ${data.status}`,
                icon: '/icons/pwa-192.png',
                tag: `order-${id}-status`
              });
            }
          }
        }
      } catch {}
    };
    es.addEventListener('delivery.updated', onMsg('delivery.updated'));
    es.addEventListener('delivery.location', onMsg('delivery.location'));
    es.addEventListener('order.updated', onMsg('order.updated'));
    es.onerror = () => { setSseError('stream'); };
    return () => { es.close(); };
  }, [id]);

  if (!order) return <div className="container-custom p-4">تحميل الطلب...</div>;

  // Order status progression timeline
  const statusSteps = [
    { key: 'pending', label: 'في انتظار التأكيد', icon: Clock, color: 'text-yellow-600' },
    { key: 'confirmed', label: 'مؤكد', icon: CheckCircle, color: 'text-blue-600' },
    { key: 'processing', label: 'قيد المعالجة', icon: Package, color: 'text-orange-600' },
    { key: 'shipped', label: 'تم الشحن', icon: Truck, color: 'text-purple-600' },
    { key: 'delivered', label: 'تم التوصيل', icon: MapPin, color: 'text-green-600' }
  ];

  const getCurrentStepIndex = () => {
    const status = order.status?.toLowerCase();
    const deliveryStatus = order.deliveryStatus?.toLowerCase();
    
    if (deliveryStatus === 'delivered' || status === 'delivered') return 4;
    if (deliveryStatus === 'shipped' || status === 'shipped') return 3;
    if (status === 'processing' || status === 'confirmed') return 2;
    if (status === 'confirmed') return 1;
    return 0; // pending or unknown
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="container-custom p-4">
      <h2 className="text-xl font-bold mb-2">تتبع الطلب</h2>
      <div className="mb-3 text-sm text-gray-700">رقم الطلب: {order.id}</div>
      <div className="mb-2">حالة الطلب: <span className="font-semibold">{order.status}</span></div>
      <div className="mb-2">حالة التوصيل: <span className="font-semibold">{order.deliveryStatus || '—'}</span></div>
      {sseError && (
        <div className="text-[11px] text-gray-500 mb-2">التحديثات الحية غير متاحة حالياً.</div>
      )}

      {/* Order Status Timeline */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-center">حالة الطلب</h3>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
            <div 
              className="h-full bg-green-500 transition-all duration-500 ease-in-out"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            ></div>
          </div>
          
          {/* Status steps */}
          <div className="relative flex justify-between">
            {statusSteps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-white border-blue-500 text-blue-500' 
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div className={`mt-2 text-xs text-center font-medium transition-colors duration-300 ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                  {isCurrent && (
                    <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current status description */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            {statusSteps[currentStepIndex]?.label}
          </div>
          {order.deliveredAt && (
            <div className="text-xs text-green-600 mt-1">
              تم التوصيل في: {new Date(order.deliveredAt).toLocaleString('ar')}
            </div>
          )}
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <a
          href={`/api/orders/${order.id}/invoice`}
          target="_blank"
          rel="noopener"
          className="btn-primary text-xs"
        >عرض الفاتورة</a>
        <button
          className="btn-secondary text-xs"
          onClick={async ()=>{
            try {
              const res = await api.orderShipments(order.id, { refresh: true });
              const list = res.shipments || res.items || res || [];
              setShipments(Array.isArray(list) ? list : []);
            } catch {
              setShipments([]);
            }
          }}
        >تحميل الشحنات</button>
      </div>
      {/* Order summary */}
      <div className="bg-white border rounded p-3 mb-4">
        <div className="font-semibold mb-2 text-sm">تفاصيل الطلب</div>
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="space-y-1">
            <div><span className="opacity-70">طريقة الدفع:</span> <span className="font-medium">{order.paymentMethod || '—'}</span></div>
            <div><span className="opacity-70">العملة:</span> <span className="font-medium">{order.currency || 'SAR'}</span></div>
            {order.paymentMeta?.bank?.reference && (
              <div><span className="opacity-70">مرجع التحويل:</span> <span className="font-medium">{order.paymentMeta.bank.reference}</span></div>
            )}
          </div>
          <div className="space-y-1">
            <div><span className="opacity-70">أنشئ في:</span> <span className="font-medium">{new Date(order.createdAt).toLocaleString('ar')}</span></div>
            {order.updatedAt && <div><span className="opacity-70">آخر تحديث:</span> <span className="font-medium">{new Date(order.updatedAt).toLocaleString('ar')}</span></div>}
          </div>
        </div>
        {/* Address */}
        {(() => {
          const addr = order?.paymentMeta?.address || order?.shippingAddress;
          if (!addr) return null;
          const parts = [addr.country, addr.city, addr.area].filter(Boolean).join(' - ');
          return (
            <div className="mt-3 border-t pt-3">
              <div className="font-medium text-sm mb-1">عنوان الشحن</div>
              <div className="text-xs whitespace-pre-line leading-6">
                {addr.name && <div>{addr.name}</div>}
                {addr.email && <div className="opacity-70">{addr.email}</div>}
                <div>{parts || '—'}</div>
                {addr.line1 && <div>{addr.line1}</div>}
                {addr.phone && <div>📞 {addr.phone}</div>}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Items */}
      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="bg-white border rounded p-3 mb-4">
          <div className="font-semibold mb-2 text-sm">العناصر</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border rounded overflow-hidden">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-right p-2 border-b">الصنف</th>
                  <th className="text-right p-2 border-b">الكمية</th>
                  <th className="text-right p-2 border-b">السعر</th>
                  <th className="text-right p-2 border-b">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="p-2 border-b">{it.nameAr || it.nameEn || it.name || it.productId}</td>
                    <td className="p-2 border-b" dir="ltr">{it.quantity}</td>
                    <td className="p-2 border-b" dir="ltr">{Number(it.price || 0).toFixed(2)} {order.currency || 'SAR'}</td>
                    <td className="p-2 border-b" dir="ltr">{Number((it.price || 0) * (it.quantity || 1)).toFixed(2)} {order.currency || 'SAR'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:max-w-xs sm:ml-auto">
            <div className="flex justify-between opacity-80"><span>الإجمالي الفرعي</span><span dir="ltr">{Number(order.subtotal ?? 0).toFixed(2)} {order.currency || 'SAR'}</span></div>
            {order.discount != null && <div className="flex justify-between opacity-80"><span>الخصم</span><span dir="ltr">{Number(order.discount || 0).toFixed(2)} {order.currency || 'SAR'}</span></div>}
            {order.tax != null && <div className="flex justify-between opacity-80"><span>الضريبة</span><span dir="ltr">{Number(order.tax || 0).toFixed(2)} {order.currency || 'SAR'}</span></div>}
            {order.shippingTotal != null && <div className="flex justify-between opacity-80"><span>الشحن</span><span dir="ltr">{Number(order.shippingTotal || 0).toFixed(2)} {order.currency || 'SAR'}</span></div>}
            <div className="flex justify-between font-semibold text-sm"><span>الإجمالي النهائي</span><span dir="ltr">{Number(order.grandTotal ?? order.total ?? 0).toFixed(2)} {order.currency || 'SAR'}</span></div>
          </div>
        </div>
      )}
      {shipments && (
        <div className="mb-4 bg-white border rounded p-3">
          <div className="font-semibold mb-2 text-sm">الشحنات</div>
          {shipments.length === 0 ? (
            <div className="text-xs text-gray-500">لا توجد شحنات بعد</div>
          ) : (
            <ul className="text-xs space-y-1">
              {shipments.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 border text-gray-700">{s.provider || 'provider'}</span>
                  </span>
                  <span>رقم التتبع: <strong>{s.trackingNumber || s.trackingId || '—'}</strong></span>
                  {s.trackingUrl && <a href={s.trackingUrl} target="_blank" rel="noopener" className="text-sky-700 underline">رابط التتبع</a>}
                  <span className="ml-auto opacity-70">{s.status || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {order.deliveryLocation && (
        <div className="mb-2 text-sm">
          الموقع الحالي: lat {order.deliveryLocation.lat}, lng {order.deliveryLocation.lng}
        </div>
      )}
      {order.deliveredAt && <div className="text-sm">سُلّم في: {new Date(order.deliveredAt).toLocaleString('ar')}</div>}
      <hr className="my-4" />
      <div>
        <div className="font-semibold mb-2">أحداث حية</div>
        <ul className="text-xs space-y-1">
          {events.map((ev, i) => (
            <li key={i}>[{new Date(ev.t).toLocaleTimeString()}] {ev.type} → {JSON.stringify(ev.data)}</li>
          ))}
          {events.length === 0 && <li className="text-gray-500">لا توجد أحداث بعد</li>}
        </ul>
      </div>
    </div>
  );
}

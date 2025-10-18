import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/client';
import { useParams } from 'react-router-dom';

export default function OrderTracker() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const esRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getOrder(id);
        if (mounted) setOrder(res.order || res);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
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
          if (type === 'order.updated') setOrder(o => ({ ...(o||{}), status: data.status || (o && o.status) }));
        }
      } catch {}
    };
    es.addEventListener('delivery.updated', onMsg('delivery.updated'));
    es.addEventListener('delivery.location', onMsg('delivery.location'));
    es.addEventListener('order.updated', onMsg('order.updated'));
    return () => { es.close(); };
  }, [id]);

  if (!order) return <div className="container-custom p-4">تحميل الطلب...</div>;

  return (
    <div className="container-custom p-4">
      <h2 className="text-xl font-bold mb-2">تتبع الطلب</h2>
      <div className="mb-3 text-sm text-gray-700">رقم الطلب: {order.id}</div>
      <div className="mb-2">حالة الطلب: <span className="font-semibold">{order.status}</span></div>
      <div className="mb-2">حالة التوصيل: <span className="font-semibold">{order.deliveryStatus || '—'}</span></div>
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

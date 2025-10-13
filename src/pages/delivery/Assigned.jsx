import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function DeliveryAssignedPage() {
  const { user } = useAuth() || {};
  const [assigned, setAssigned] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const a = await api.deliveryList({});
      const p = await api.deliveryList({ pool: 1 });
      setAssigned(a.orders || []);
      setPool(p.orders || []);
    } catch (e) { setErr(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!(user.role === 'delivery' || user.role === 'admin')) return <div className="container mx-auto p-4">غير مصرح</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">طلباتي</h1>
        <div className="flex gap-2">
          <Link className="px-3 py-1 rounded bg-gray-100" to="/delivery/map">الخريطة</Link>
          <Link className="px-3 py-1 rounded bg-gray-100" to="/delivery/history">السجل</Link>
          <button className="px-3 py-1 rounded bg-gray-100" onClick={load}>تحديث</button>
        </div>
      </div>
      {loading && <p>جاري التحميل…</p>}
      {err && <p className="text-red-600">{String(err)}</p>}
      <h2 className="text-lg font-semibold mb-2">المسندة لي</h2>
      <OrderList orders={assigned} actions={{
        start: async (o) => { await api.deliveryStart(o.id); load(); },
        complete: async (o) => { await api.deliveryComplete(o.id); load(); },
        fail: async (o) => { const reason = prompt('سبب الفشل؟'); if (reason) { await api.deliveryFail(o.id, reason); load(); } },
        chat: async (o) => {
          try {
            // Ensure a buyer-driver thread for this order
            await api.chatEnsureThread(null, { orderId: o.id, driverId: (user && user.id) || undefined });
            window.location.href = '/chat?as=delivery';
          } catch {}
        }
      }} />
      <h2 className="text-lg font-semibold mt-6 mb-2">طلبات غير مخصصة</h2>
      <OrderList orders={pool} actions={{
        accept: async (o) => { await api.deliveryAccept(o.id); load(); }
      }} />
    </div>
  );
}

function OrderList({ orders, actions = {} }) {
  if (!orders?.length) return <p className="text-gray-600">لا يوجد عناصر</p>;
  return (
    <div className="grid gap-3">
      {orders.map(o => (
        <div key={o.id} className="rounded border p-3 bg-white flex items-center justify-between">
          <div>
            <div className="font-semibold">{o.id.slice(0,8)}...</div>
            <div className="text-sm text-gray-600">الحالة: {o.status} | توصيل: {o.deliveryStatus}</div>
            <div className="text-sm">الإجمالي: {o.grandTotal}</div>
          </div>
          <div className="flex gap-2">
            {actions.accept && o.deliveryStatus === 'unassigned' ? (
              <button className="px-3 py-1 rounded bg-emerald-600 text-black" onClick={() => actions.accept(o)}>استلام</button>
            ) : null}
            {actions.start && (o.deliveryStatus === 'accepted') ? (
              <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => actions.start(o)}>بدء</button>
            ) : null}
            {actions.complete && (o.deliveryStatus === 'out_for_delivery') ? (
              <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => actions.complete(o)}>تم التسليم</button>
            ) : null}
            {actions.fail && (o.deliveryStatus === 'accepted' || o.deliveryStatus === 'out_for_delivery') ? (
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => actions.fail(o)}>تعذر</button>
            ) : null}
            {actions.chat && (o.deliveryStatus === 'accepted' || o.deliveryStatus === 'out_for_delivery') ? (
              <button className="px-3 py-1 rounded bg-purple-600 text-white" onClick={() => actions.chat(o)}>محادثة</button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

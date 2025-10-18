import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge.jsx';

export default function DeliveryHistoryPage() {
  const { user } = useAuth() || {};
  const [tab, setTab] = useState('delivered');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load(which = tab) {
    setLoading(true); setErr(null);
    try {
      const res = await api.deliveryHistory({ status: which, limit: 100 });
      setItems(res.orders || []);
    } catch (e) { setErr(e?.message || 'Failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(tab); }, [tab]);

  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!(user.role === 'delivery' || user.role === 'admin')) return <div className="container mx-auto p-4">غير مصرح</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">سجل التسليم</h1>
        <div className="flex gap-2">
          <button className={`h-9 px-3 rounded-md text-sm font-medium ${tab==='delivered'?'bg-blue-600 text-white':'bg-gray-100 hover:bg-gray-200'}`} onClick={() => setTab('delivered')}>تم التسليم</button>
          <button className={`h-9 px-3 rounded-md text-sm font-medium ${tab==='failed'?'bg-blue-600 text-white':'bg-gray-100 hover:bg-gray-200'}`} onClick={() => setTab('failed')}>تعذر التسليم</button>
        </div>
      </div>
      {loading && <p>جاري التحميل…</p>}
      {err && <p className="text-red-600">{String(err)}</p>}
      <div className="grid gap-3">
        {items?.length ? items.map(o => (
          <div key={o.id} className="rounded-lg border p-4 bg-white shadow-sm">
            <div className="font-semibold text-gray-900">{o.id.slice(0,8)}...</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge color="neutral">طلب: {o.status}</Badge>
              <Badge color={o.deliveryStatus==='delivered'?'success':o.deliveryStatus==='failed'?'danger':'neutral'}>
                توصيل: {o.deliveryStatus}
              </Badge>
            </div>
            <div className="text-sm text-gray-700 mt-1">الإجمالي: {o.grandTotal}</div>
            {o.deliveredAt && <div className="text-sm">اكتمل: {new Date(o.deliveredAt).toLocaleString()}</div>}
            {o.failedAt && <div className="text-sm">فشل: {new Date(o.failedAt).toLocaleString()}</div>}
          </div>
        )) : <p className="text-gray-600">لا يوجد عناصر</p>}
      </div>
    </div>
  );
}

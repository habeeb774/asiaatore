import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { openInvoicePdfByOrder } from '../services/invoiceService';

// Simple status progression map for visual tracking
const STATUS_FLOW = [
  'pending',
  'pending_bank_review',
  'processing',
  'shipped',
  'delivered'
];

function StatusTracker({ status }) {
  const idx = STATUS_FLOW.indexOf(status);
  return (
    <div className="offers-page catalog-page container-custom px-4 py-8">
      {STATUS_FLOW.map((s, i) => {
        const reached = idx >= i;
        return (
          <div key={s} className="flex items-center gap-1">
            <span className={`px-2 py-1 rounded border ${reached ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>{s}</span>
            {i < STATUS_FLOW.length - 1 && <span className={`w-6 h-px ${idx >= i+1 ? 'bg-green-600' : 'bg-gray-300'}`}></span>}
          </div>
        );
      })}
    </div>
  );
}

const MyOrders = () => {
  const { paged, loading, error, refresh } = useOrders() || {};
  const { user } = useAuth() || {};
  const myOrders = useMemo(() => (paged || []).filter(o => String(o.userId) === String(user?.id || 'guest')), [paged, user]);

  if (!user) return <div className="container-custom px-4 py-12 text-center">الرجاء تسجيل الدخول لعرض طلباتك</div>;
  if (loading) return <div className="container-custom px-4 py-12 text-center text-sm opacity-70">جار التحميل...</div>;
  if (error) return <div className="container-custom px-4 py-12 text-center text-sm text-red-600">خطأ: {error}</div>;
  if (myOrders.length === 0) return <div className="container-custom px-4 py-12 text-center">لا توجد طلبات حتى الآن</div>;

  return (
    <div className="container-custom px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">طلباتي ({myOrders.length})</h2>
        <button onClick={() => refresh()} className="btn-secondary px-3 py-2 text-sm">تحديث</button>
      </div>
      <div className="space-y-5">
        {myOrders.map(o => {
          const total = o.grandTotal ?? o.total ?? (o.items||[]).reduce((s,i)=>s+(i.price||0)*(i.quantity||1),0);
          const firstShipment = (o.shipments && o.shipments.length) ? o.shipments[0] : null;
          return (
            <div key={o.id} className="border rounded p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">#{o.id}</div>
                  <div className="text-sm text-gray-600">{new Date(o.createdAt).toLocaleString()}</div>
                  <div className="text-sm mt-1">الإجمالي: <strong>{total} {o.currency || 'ر.س'}</strong></div>
                  {firstShipment && (
                    <div className="text-xs text-gray-700 mt-1 flex items-center gap-2">
                      <span>رقم التتبع:</span>
                      <code className="px-1.5 py-0.5 bg-gray-100 rounded">{firstShipment.trackingNumber}</code>
                      {firstShipment.trackingUrl && (
                        <a className="text-primary-red hover:underline" href={firstShipment.trackingUrl} target="_blank" rel="noopener noreferrer">تتبّع خارجي</a>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-sm flex flex-col items-start gap-1 min-w-[180px]">
                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">{o.status}</span>
                  <Link to={`/order/${o.id}`} className="btn-secondary px-3 py-1 text-xs">تفاصيل</Link>
                  <Link to={`/order/${o.id}/track`} className="btn-secondary px-3 py-1 text-xs">تتبع</Link>
                  <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener" className="btn-secondary px-3 py-1 text-xs">فاتورة</a>
                  {o.status === 'paid' && (
                    <button
                      type="button"
                      className="btn-secondary px-3 py-1 text-xs"
                      onClick={async ()=>{
                        try { await openInvoicePdfByOrder(o.id, { format: 'a4' }); }
                        catch(e){ alert('تعذر فتح الفاتورة: ' + (e?.message || 'خطأ')); }
                      }}
                    >فاتورة (جديدة)</button>
                  )}
                </div>
              </div>
              <StatusTracker status={o.status} />
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(o.items||[]).slice(0,6).map(it => {
                  const name = typeof it.name === 'string' ? it.name : (it.name?.ar || it.name?.en || it.productId);
                  return (
                    <div key={it.id} className="p-2 border rounded text-xs flex flex-col gap-1 bg-white/50">
                      <div className="font-semibold truncate" title={name}>{name}</div>
                      <div className="text-gray-600">{it.quantity} × {it.price} = {(it.quantity||1)*it.price}</div>
                    </div>
                  );
                })}
                { (o.items||[]).length > 6 && <div className="text-xs text-gray-500 flex items-center">+{(o.items||[]).length - 6} عناصر إضافية</div> }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, ButtonLink, buttonVariants } from '../components/ui';
import { useOrders } from '../stores/OrdersContext';
import { useAuth } from '../stores/AuthContext';
import { openInvoicePdfByOrder } from '../services/invoiceService';

// Simple status progression map for visual tracking
const STATUS_FLOW = [
  'pending',
  'pending_bank_review',
  'processing',
  'shipped',
  'delivered'
];

function StatusTracker({ status, orderId, onStatusUpdate }) {
  const [liveStatus, setLiveStatus] = useState(status);
  const esRef = useRef(null);

  useEffect(() => {
    setLiveStatus(status);
  }, [status]);

  useEffect(() => {
    if (!orderId) return;
    // Open SSE for live order updates
    const es = new EventSource('/api/events');
    esRef.current = es;
    const onOrderUpdate = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data && data.id === orderId && data.status) {
          setLiveStatus(data.status);
          onStatusUpdate && onStatusUpdate(data.status);
        }
      } catch {}
    };
    es.addEventListener('order.updated', onOrderUpdate);
    es.onerror = () => {};
    return () => { es.close(); };
  }, [orderId, onStatusUpdate]);

  const idx = STATUS_FLOW.indexOf(liveStatus);
  return (
    <div className="flex items-center gap-2 py-2">
      {STATUS_FLOW.map((s, i) => {
        const reached = idx >= i;
        const isCurrent = idx === i;
        return (
          <React.Fragment key={s}>
            <div className={`px-2 py-1 rounded border text-xs ${reached ? 'bg-green-600 text-white border-green-600' : isCurrent ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
              {s}
              {isCurrent && <span className="ml-1 animate-pulse">●</span>}
            </div>
            {i < STATUS_FLOW.length - 1 && <span className={`w-4 h-px ${idx >= i+1 ? 'bg-green-600' : 'bg-gray-300'}`}></span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const MyOrders = () => {
  const { paged, loading, error, refresh } = useOrders() || {};
  const { user } = useAuth() || {};
  const [orders, setOrders] = useState(paged || []);
  
  useEffect(() => {
    setOrders(paged || []);
  }, [paged]);

  const myOrders = useMemo(() => orders.filter(o => String(o.userId) === String(user?.id || 'guest')), [orders, user]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  if (!user) return <div className="container-custom px-4 py-12 text-center">الرجاء تسجيل الدخول لعرض طلباتك</div>;
  if (loading) return <div className="container-custom px-4 py-12 text-center text-sm opacity-70">جار التحميل...</div>;
  if (error) return <div className="container-custom px-4 py-12 text-center text-sm text-red-600">خطأ: {error}</div>;
  if (myOrders.length === 0) return <div className="container-custom px-4 py-12 text-center">لا توجد طلبات حتى الآن</div>;

  return (
    <div className="container-custom px-4 py-8">
      <div className="flex items-center justify-between mb-6">
  <h2 className="text-2xl font-bold">طلباتي ({myOrders.length})</h2>
  <Button variant="secondary" size="sm" onClick={() => refresh()}>تحديث</Button>
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
                  <StatusTracker status={o.status} orderId={o.id} onStatusUpdate={(newStatus) => handleStatusUpdate(o.id, newStatus)} />
                  <Link to={`/order/${o.id}`} className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'text-xs' })}>تفاصيل</Link>
                  <Link to={`/order/${o.id}/track`} className={buttonVariants({ variant: 'secondary', size: 'sm', className: 'text-xs' })}>تتبع</Link>
                  <ButtonLink href={`/api/orders/${o.id}/invoice`} variant="secondary" size="sm" target="_blank" rel="noopener">فاتورة</ButtonLink>
                  {o.status === 'paid' && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={async ()=>{
                        try { await openInvoicePdfByOrder(o.id, { format: 'a4' }); }
                        catch(e){ alert('تعذر فتح الفاتورة: ' + (e?.message || 'خطأ')); }
                      }}
                    >فاتورة (جديدة)</Button>
                  )}
                </div>
              </div>
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

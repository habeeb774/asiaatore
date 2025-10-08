import React, { useState, useEffect } from 'react';
import { getInvoiceUrl } from '../services/orderService';
import { useParams } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { uploadBankReceipt, initBankTransfer } from '../services/paymentService';

const OrderDetails = () => {
  const { id } = useParams();
  const { getOrderById, updateOrderStatus, mergeOrder } = useOrders() || {};
  const { user } = useAuth() || {};
  const [fetchedOrder, setFetchedOrder] = useState(null);
  const contextOrder = getOrderById ? getOrderById(id) : null;
  const order = contextOrder || fetchedOrder;
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [allowReplace, setAllowReplace] = useState(false);

  const isBank = order?.paymentMethod === 'bank' || order?.status === 'pending_bank_review';

  // Fallback: fetch order directly if not in context (e.g., page refresh before context populated)
  useEffect(() => {
    if (!contextOrder && id) {
      (async () => {
        try {
          const res = await fetch(`/api/orders/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.ok && data.order) setFetchedOrder(data.order);
          }
        } catch {/* ignore */}
      })();
    }
  }, [contextOrder, id]);

  async function ensureBankInit() {
    // Only init if not already bank mode
  if (order.paymentMethod === 'bank' || order.status === 'pending_bank_review') return;
    try {
      const res = await initBankTransfer({ orderId: order.id });
      // Patch local order to reflect bank initiation
      const reference = res?.bank?.reference;
      const patched = {
        ...order,
        paymentMethod: 'bank',
        status: 'pending_bank_review',
        paymentMeta: { ...(order.paymentMeta||{}), bank: { reference } }
      };
      mergeOrder && mergeOrder(patched);
    } catch (e) {
      setUploadError('فشل بدء التحويل البنكي: ' + e.message);
    }
  }

  async function handleReceiptUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await ensureBankInit();
      const res = await uploadBankReceipt({ orderId: order.id, file });
      // Patch local order object (optimistic) if paymentMeta present
      if (res?.receiptUrl) {
        const patched = {
          ...order,
          paymentMethod: 'bank',
          status: 'pending_bank_review',
          paymentMeta: { ...(order.paymentMeta||{}), bank: { ...(order.paymentMeta?.bank||{}), receiptUrl: res.receiptUrl } }
        };
        mergeOrder && mergeOrder(patched);
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (!order) return <div className="container-custom px-4 py-12">الطلب غير موجود أو قيد التحميل...</div>;

  const total = order.grandTotal != null ? order.grandTotal : (order.total || (order.items || []).reduce((s,i)=>s+(i.price||0)*(i.quantity||1),0));
  const addr = order?.paymentMeta?.address || null;
  const addrText = addr ? [addr.name, addr.email, `${addr.country||''}${addr.country&&addr.city?' - ':''}${addr.city||''}`, addr.line1, addr.phone].filter(Boolean).join('\n') : '';

  return (
    <div className="container-custom px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">تفاصيل الطلب #{order.id}</h2>

      <div className="mb-4 space-y-1">
        <div className="text-sm text-gray-600">المستخدم: {order.userId}</div>
        <div className="text-sm text-gray-600">تاريخ: {new Date(order.createdAt).toLocaleString()}</div>
        <div className="text-sm flex items-center gap-2">الحالة: <strong className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">{order.status}</strong> {updating && <span className="text-xs opacity-60">...جاري الحفظ</span>}</div>
  <div className="text-sm">طريقة الدفع: {order.paymentMethod || 'غير محدد'}</div>
        <div className="pt-1 flex items-center gap-2 flex-wrap">
          <a href={`/api/orders/${order.id}/invoice?token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`} target="_blank" rel="noopener" className="btn-secondary px-3 py-1 text-xs">عرض الفاتورة (HTML)</a>
          <a href={`/api/orders/${order.id}/invoice.pdf?token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`} target="_blank" rel="noopener" className="btn-secondary px-3 py-1 text-xs">PDF A4</a>
          <a href={`/api/orders/${order.id}/invoice.pdf?paper=thermal80&token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`} target="_blank" rel="noopener" className="btn-secondary px-3 py-1 text-xs">PDF حراري 80mm</a>
          <a href={`/api/orders/${order.id}/invoice?paper=thermal80&auto=1&token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`} target="_blank" rel="noopener" className="btn-primary px-3 py-1 text-xs">طباعة حرارية الآن</a>
        </div>
        {addr && (
          <div className="mt-3 p-3 border rounded bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">عنوان الشحن</div>
              <button type="button" onClick={()=>{ try { navigator.clipboard.writeText(addrText); } catch {} }} className="text-xs text-blue-700 hover:underline">نسخ</button>
            </div>
            <div className="text-sm leading-relaxed">
              {addr.name && <div>{addr.name}</div>}
              {addr.email && <div className="text-gray-600">{addr.email}</div>}
              <div>{addr.country} {addr.city ? <>- {addr.city}</> : null}</div>
              {addr.line1 && <div>{addr.line1}</div>}
              {addr.phone && <div className="text-gray-700">{addr.phone}</div>}
            </div>
          </div>
        )}
        <div className="mt-4 p-3 border rounded bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">التحويل البنكي</div>
            { (order.paymentMethod !== 'bank' && order.status === 'pending') && (
              <button type="button" onClick={ensureBankInit} className="btn-secondary px-3 py-1 text-xs">بدء التحويل</button>
            )}
          </div>
          {/* Diagnostic helper if غير ظاهر سبب عدم ظهور الرفع */}
          { (order.paymentMethod !== 'bank' && order.status !== 'pending' && order.status !== 'pending_bank_review') && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
              لا يمكن رفع إيصال الآن. الحالة الحالية: <strong>{order.status}</strong>. الرفع متاح فقط عندما تكون الحالة (pending) لتبدأ التحويل أو (pending_bank_review) بعد البدء.
            </div>
          )}
          { (order.paymentMethod === 'bank' || order.status === 'pending_bank_review') && (
            <>
              { order.paymentMeta?.bank?.reference && (
                <div className="text-xs">الرقم المرجعي: <span className="font-mono">{order.paymentMeta.bank.reference}</span></div>
              )}
              <div className="text-xs text-gray-600 leading-relaxed">
                { order.paymentMeta?.bank?.receiptUrl ? 'تم رفع الإيصال، بانتظار المراجعة.' : 'قم برفع إيصال التحويل البنكي (صورة أو PDF حتى 5MB) ليتم مراجعته.' }
              </div>
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {order.paymentMeta?.bank?.receiptUrl ? (
                  <>
                    <a href={order.paymentMeta.bank.receiptUrl} target="_blank" rel="noopener" className="text-blue-600 underline">عرض الإيصال</a>
                    {!allowReplace && (
                      <button
                        type="button"
                        onClick={() => setAllowReplace(true)}
                        className="btn-secondary px-2 py-1"
                      >استبدال الإيصال</button>
                    )}
                    {allowReplace && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input type="file" accept="image/*,.pdf" disabled={uploading} onChange={handleReceiptUpload} />
                        <button type="button" onClick={() => setAllowReplace(false)} className="text-gray-500 hover:text-gray-700">إلغاء</button>
                      </div>
                    )}
                  </>
                ) : (
                  <input type="file" accept="image/*,.pdf" disabled={uploading} onChange={handleReceiptUpload} />
                )}
                {uploading && <span className="opacity-70">جاري الرفع...</span>}
                {uploadError && <span className="text-red-600">فشل: {uploadError}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {(order.items || []).map(item => {
          const displayName = typeof item.name === 'string' ? item.name : (item.name?.ar || item.name?.en || item.productId);
          return (
            <div key={item.id} className="flex items-center gap-4 p-3 border rounded">
              {item.image && <img src={item.image} alt={displayName} className="w-16 h-16 object-cover rounded" />}
              <div className="flex-1">
                <div className="font-semibold">{displayName}</div>
                <div className="text-sm text-gray-600">{item.price} ر.س × {item.quantity || 1}</div>
              </div>
              <div className="font-bold">{(item.price * (item.quantity||1)).toFixed(2)} ر.س</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          {user?.role === 'admin' && (
            <select value={order.status} onChange={async (e) => { setUpdating(true); await updateOrderStatus(order.id, e.target.value); setUpdating(false); }}>
              <option value="pending">قيد الانتظار</option>
              <option value="pending_bank_review">مراجعة تحويل بنكي</option>
              <option value="processing">قيد المعالجة</option>
              <option value="shipped">تم الشحن</option>
              <option value="delivered">تم التوصيل</option>
              <option value="cancelled">ملغي</option>
            </select>
          )}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <button className="btn-secondary" onClick={() => window.open(getInvoiceUrl(order.id) + `?token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`, '_blank')}>عرض الفاتورة</button>
          <a className="btn-secondary" href={`/api/orders/${order.id}/invoice.pdf?token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`} target="_blank" rel="noopener">PDF A4</a>
          <a className="btn-secondary" href={`/api/orders/${order.id}/invoice.pdf?paper=thermal80&token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`} target="_blank" rel="noopener">PDF حراري 80mm</a>
          <button className="btn-primary" onClick={() => window.open(`/api/orders/${order.id}/invoice?paper=thermal80&auto=1&token=${encodeURIComponent(localStorage.getItem('my_store_token')||'')}`, '_blank')}>طباعة حرارية</button>
          <div className="text-lg font-bold">الإجمالي: {total} ر.س</div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

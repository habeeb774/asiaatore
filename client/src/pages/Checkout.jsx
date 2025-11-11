import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import * as paymentService from '../services/paymentService';
import api from '../services/api/client';

const Checkout = () => {
  const { cartItems, clearCart } = useCart() || {};
  const { refresh } = useOrders() || {};
  const { user } = useAuth() || {};
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('paypal');
  const [bankInfo, setBankInfo] = useState(null);
  const [bankUploading, setBankUploading] = useState(false);
  const [bankUploadError, setBankUploadError] = useState(null);
  const [bankReceiptUrl, setBankReceiptUrl] = useState(null);
  const [stcSession, setStcSession] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const navigate = useNavigate();

  const total = (cartItems || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const buildOrderPayload = () => ({
    userId: user?.id || 'guest',
    items: cartItems.map(i => {
      const backendLikely = typeof i.id === 'string' && !i.id.startsWith('p_');
      return {
        productId: backendLikely ? i.id : 'custom',
        name: { ar: i.name?.ar || i.name || 'صنف', en: i.name?.en || i.name || 'Item' },
        price: i.price,
        quantity: i.quantity,
        oldPrice: i.oldPrice || null
      };
    }),
    currency: 'SAR'
  });

  // Ensure an order exists in backend before starting payment
  const ensureRemoteOrder = async () => {
    if (currentOrderId) return currentOrderId;
    const payload = buildOrderPayload();
    const res = await api.createOrder(payload);
    if (!res?.order?.id) throw new Error('Failed to create order');
    setCurrentOrderId(res.order.id);
    return res.order.id;
  };

  const handleCOD = async () => {
    try {
      setProcessing(true); setMessage('جاري تفعيل الدفع عند الاستلام...');
      const orderId = await ensureRemoteOrder();
      await paymentService.enableCashOnDelivery({ orderId });
      clearCart && clearCart();
      await refresh();
      navigate(`/order/${orderId}`);
    } catch (e) {
      setMessage('تعذر تفعيل الدفع عند الاستلام: ' + e.message);
    } finally { setProcessing(false); }
  };

  const startPayPal = async () => {
    try {
      setProcessing(true); setMessage('جاري إنشاء معاملة PayPal...');
      const orderId = await ensureRemoteOrder();
      const payload = buildOrderPayload();
      const data = await paymentService.createPayPalTransaction({ items: payload.items, currency: payload.currency });
      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        throw new Error('لم يتم استلام رابط الموافقة');
      }
    } catch (e) {
      setMessage('فشل بدء PayPal: ' + e.message);
    } finally { setProcessing(false); }
  };

  const startStcPay = async () => {
    try {
      setProcessing(true); setMessage('جاري تهيئة STC Pay...');
      const orderId = await ensureRemoteOrder();
      const data = await paymentService.createStcPayTransaction({ orderId });
      if (data?.sessionId) {
        setStcSession(data.sessionId);
        setMessage('تم إنشاء جلسة STC Pay. استخدم زر التأكيد للمحاكاة.');
      } else {
        throw new Error('لم يتم إنشاء جلسة STC');
      }
    } catch (e) {
      setMessage('فشل STC Pay: ' + e.message);
    } finally { setProcessing(false); }
  };

  const confirmStcPay = async (success=true) => {
    try {
      if (!currentOrderId || !stcSession) return;
      setProcessing(true); setMessage('تأكيد STC Pay...');
      await paymentService.confirmStcPay({ orderId: currentOrderId, sessionId: stcSession, success });
      clearCart && clearCart();
      await refresh();
      navigate(`/order/${currentOrderId}`);
    } catch (e) {
      setMessage('فشل تأكيد STC: ' + e.message);
    } finally { setProcessing(false); }
  };

  const startBankTransfer = async () => {
    try {
      setProcessing(true); setMessage('جاري تهيئة التحويل البنكي...');
      const orderId = await ensureRemoteOrder();
      const data = await paymentService.initBankTransfer({ orderId });
      if (data?.bank) {
        setBankInfo(data.bank);
        setMessage('تم إنشاء بيانات التحويل البنكي. نفّذ التحويل ثم انتظر تأكيد الإدارة.');
      } else {
        throw new Error('لم يتم استرجاع بيانات البنك');
      }
    } catch (e) {
      setMessage('فشل تهيئة التحويل البنكي: ' + e.message);
    } finally { setProcessing(false); }
  };

  const uploadBankReceiptInline = async (file) => {
    if (!file) return;
    if (!currentOrderId) {
      setBankUploadError('لم يتم إنشاء الطلب بعد');
      return;
    }
    setBankUploadError(null);
    setBankUploading(true);
    try {
      const res = await paymentService.uploadBankReceipt({ orderId: currentOrderId, file });
      if (res?.receiptUrl) {
        setBankReceiptUrl(res.receiptUrl);
        setMessage('تم رفع الإيصال بنجاح. بانتظار المراجعة.');
      } else {
        setBankUploadError('استجابة غير متوقعة');
      }
    } catch (e) {
      setBankUploadError(e.message);
    } finally {
      setBankUploading(false);
    }
  };

  const proceed = async () => {
    if (!cartItems?.length) { setMessage('السلة فارغة'); return; }
    switch (selectedMethod) {
      case 'paypal': return startPayPal();
      case 'stc': return startStcPay();
      case 'bank': return startBankTransfer();
      case 'cod': return handleCOD();
      default: setMessage('اختر طريقة دفع');
    }
  };

  return (
    <div className="container-custom px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">الدفع ({(cartItems || []).length} عنصر)</h2>

      <div className="mb-6">
        <div className="mb-2">المجموع: <strong>{total} ر.س</strong></div>
      </div>

      <div className="space-y-6 max-w-lg">
        <div className="grid gap-3">
          <label className={`border rounded p-3 cursor-pointer flex items-center justify-between ${selectedMethod==='paypal'?'ring-2 ring-blue-500':''}`}> 
            <span>
              <input type="radio" name="pm" value="paypal" checked={selectedMethod==='paypal'} onChange={()=>setSelectedMethod('paypal')} className="mr-2" />
              PayPal
            </span>
            <span className="text-xs text-gray-500">الدفع الآمن عبر PayPal</span>
          </label>
          <label className={`border rounded p-3 cursor-pointer flex items-center justify-between ${selectedMethod==='stc'?'ring-2 ring-blue-500':''}`}> 
            <span>
              <input type="radio" name="pm" value="stc" checked={selectedMethod==='stc'} onChange={()=>setSelectedMethod('stc')} className="mr-2" />
              STC Pay (محاكاة)
            </span>
            <span className="text-xs text-gray-500">محفظة رقمية</span>
          </label>
          <label className={`border rounded p-3 cursor-pointer flex items-center justify-between ${selectedMethod==='bank'?'ring-2 ring-blue-500':''}`}> 
            <span>
              <input type="radio" name="pm" value="bank" checked={selectedMethod==='bank'} onChange={()=>setSelectedMethod('bank')} className="mr-2" />
              تحويل بنكي
            </span>
            <span className="text-xs text-gray-500">دفع يدوي برقم مرجع</span>
          </label>
          <label className={`border rounded p-3 cursor-pointer flex items-center justify-between ${selectedMethod==='cod'?'ring-2 ring-blue-500':''}`}> 
            <span>
              <input type="radio" name="pm" value="cod" checked={selectedMethod==='cod'} onChange={()=>setSelectedMethod('cod')} className="mr-2" />
              الدفع عند الاستلام
            </span>
            <span className="text-xs text-gray-500">رسوم إضافية محتملة</span>
          </label>
        </div>
        <button className="btn-primary w-full" onClick={proceed} disabled={processing}>{processing ? 'جاري المعالجة...' : 'متابعة الدفع'}</button>
        {selectedMethod === 'bank' && bankInfo && (
          <div className="bg-gray-50 border p-4 rounded text-sm space-y-2">
            <div>
              <div>اسم الحساب: {bankInfo.accountName}</div>
              <div>IBAN: {bankInfo.iban}</div>
              <div>البنك: {bankInfo.bank}</div>
              <div>المرجع: <strong>{bankInfo.reference}</strong></div>
            </div>
            <div className="text-xs text-gray-500">بعد التحويل ارفع إيصال البنك ثم انتظر تأكيد الإدارة.</div>
            <div className="pt-1 flex flex-col gap-2">
              {bankReceiptUrl ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <a href={bankReceiptUrl} target="_blank" rel="noopener" className="text-blue-600 underline">عرض الإيصال المرفوع</a>
                  <label className="cursor-pointer inline-flex items-center gap-2 text-xs btn-secondary px-2 py-1">
                    <input type="file" className="hidden" disabled={bankUploading} onChange={(e)=>uploadBankReceiptInline(e.target.files?.[0])} />
                    استبدال الإيصال
                  </label>
                </div>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-2 text-xs btn-secondary px-3 py-2 w-fit">
                  <input type="file" className="hidden" disabled={bankUploading} onChange={(e)=>uploadBankReceiptInline(e.target.files?.[0])} />
                  رفع الإيصال البنكي
                </label>
              )}
              {bankUploading && <span className="text-xs opacity-70">جاري الرفع...</span>}
              {bankUploadError && <span className="text-xs text-red-600">فشل: {bankUploadError}</span>}
            </div>
          </div>
        )}
        {selectedMethod === 'stc' && stcSession && (
          <div className="bg-purple-50 border p-4 rounded text-sm space-y-2">
            <div>Session ID: {stcSession}</div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1" onClick={()=>confirmStcPay(true)} disabled={processing}>تأكيد الدفع (محاكاة)</button>
              <button className="btn-secondary flex-1" onClick={()=>confirmStcPay(false)} disabled={processing}>فشل (اختبار)</button>
            </div>
          </div>
        )}
      </div>

      {message && <div className="mt-6 text-sm text-gray-700">{message}</div>}
    </div>
  );
};

export default Checkout;

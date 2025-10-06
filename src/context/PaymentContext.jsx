import React, { createContext, useState, useCallback, useContext } from 'react';
import { useToast } from './ToastContext';
import { CheckoutContext } from '../App';
import * as gateway from '../services/paymentGateway';

export const PaymentContext = createContext(null);

export function PaymentProvider({ children }) {
  const { totals, currency, formatCurrency, placeOrder } = useContext(CheckoutContext) || {};
  const toast = useToast?.();
  const [method, setMethod] = useState(null);          // 'card' | 'cod' | 'bank'
  const [status, setStatus] = useState('idle');        // idle | intent_created | card_attached | processing | succeeded | failed
  const [intent, setIntent] = useState(null);
  const [error, setError] = useState(null);
  const [resultOrder, setResultOrder] = useState(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setMethod(null);
    setIntent(null);
    setError(null);
    setResultOrder(null);
  }, []);

  const selectMethod = useCallback(async (m) => {
    setMethod(m);
    setError(null);
    if (m === 'card') {
      setStatus('processing');
      const intentResp = await gateway.createPaymentIntent({
        amount: totals?.grandTotal || 0,
        currency
      });
      if (intentResp.success) {
        setIntent(intentResp.intent);
        setStatus('intent_created');
        try { toast?.info?.('تم إنشاء عملية الدفع', 'أدخل بيانات البطاقة لإتمام العملية'); } catch {}
      } else {
        setError(intentResp.error);
        setStatus('failed');
        try { toast?.error?.('فشل تهيئة الدفع', intentResp.error); } catch {}
      }
    } else {
      // طرق فورية (دفع عند الاستلام)
      setStatus('succeeded');
      try { toast?.success?.('تم اختيار الدفع عند الاستلام'); } catch {}
    }
  }, [totals, currency]);

  const submitCOD = useCallback(async () => {
    if (method !== 'cod') return;
    setStatus('processing');
    const orderResp = await placeOrder({ payment: { method: 'cod' } });
    if (orderResp?.success) {
      setResultOrder(orderResp.order);
      setStatus('succeeded');
      try { toast?.success?.('تم إنشاء الطلب بنجاح', `رقم الطلب: ${orderResp.order?.id || ''}`); } catch {}
    } else {
      setError(orderResp?.error || 'فشل تنفيذ الطلب');
      setStatus('failed');
      try { toast?.error?.('فشل تنفيذ الطلب', orderResp?.error); } catch {}
    }
  }, [method, placeOrder]);

  const attachCard = useCallback(async (cardData) => {
    if (!intent) return { success: false, error: 'لا يوجد intent' };
    setStatus('processing');
    const attachResp = await gateway.attachCard(intent.id, cardData);
    if (!attachResp.success) {
      setError(attachResp.error);
      setStatus('failed');
      try { toast?.error?.('فشل ربط البطاقة', attachResp.error); } catch {}
      return attachResp;
    }
    setStatus('card_attached');
    try { toast?.success?.('تم ربط البطاقة بنجاح'); } catch {}
    return attachResp;
  }, [intent]);

  const confirmCardPayment = useCallback(async () => {
    if (!intent) return { success: false, error: 'لا يوجد intent' };
    setStatus('processing');
    const confirmResp = await gateway.confirmPayment(intent.id);
    if (!confirmResp.success) {
      setError(confirmResp.error);
      setStatus('failed');
      try { toast?.error?.('فشل تأكيد الدفع', confirmResp.error); } catch {}
      return confirmResp;
    }
    // أنشئ الطلب الآن
    const orderResp = await placeOrder({
      payment: {
        method: 'card',
        transactionId: confirmResp.transactionId
      }
    });
    if (orderResp?.success) {
      setResultOrder(orderResp.order);
      setStatus('succeeded');
      try { toast?.success?.('تم الدفع وإنشاء الطلب', `رقم الطلب: ${orderResp.order?.id || ''}`); } catch {}
    } else {
      setError(orderResp?.error || 'فشل إنشاء الطلب بعد الدفع');
      setStatus('failed');
      try { toast?.error?.('تم الدفع لكن فشل إنشاء الطلب', orderResp?.error); } catch {}
    }
    return orderResp;
  }, [intent, placeOrder]);

  return (
    <PaymentContext.Provider value={{
      method,
      status,
      intent,
      error,
      totals,
      currency,
      formatCurrency,
      resultOrder,
      reset,
      selectMethod,
      submitCOD,
      attachCard,
      confirmCardPayment
    }}>
      {children}
    </PaymentContext.Provider>
  );
}

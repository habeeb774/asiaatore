import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrders } from '../stores/OrdersContext';
import api from '../services/api/client';
import { useCart } from '../stores/CartContext';
import * as paymentService from '../services/paymentService';
import { useSettings } from '../stores/SettingsContext';
import { useLanguage } from '../stores/LanguageContext';
import Seo from '../components/Seo';
import { Button } from '../components/ui';

const CheckoutSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const token = query.get('token') || query.get('paypalToken') || query.get('paymentId') || query.get('PayerID') || query.get('paypalOrderId');
  const localOrderId = query.get('localOrderId');
  const { updateOrderStatus, addOrder } = useOrders();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('جاري إنهاء الدفع...');
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');

  useEffect(() => {
    const doCapture = async () => {
      try {
        if (!token || !localOrderId) {
          setStatus('error');
          setMessage('معرّفات الدفع غير مكتملة (localOrderId أو token مفقود)');
          return;
        }

        // call capture endpoint
  const result = await paymentService.capturePayPalOrder({ paypalOrderId: token, localOrderId });
        if (result?.ok) {
          try {
            // Build order payload from capture data if available
            const capture = result.capture;
            const amount = capture?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
            const paidTotal = amount ? Number(amount.value) : undefined;
            const currency = amount?.currency_code || 'SAR';
            // Backend already updated order; fetch fresh
            try {
              const fresh = await api.getOrder(localOrderId);
              if (fresh?.order) {
                await addOrder(fresh.order);
              }
            } catch {}
            if (localOrderId) updateOrderStatus(localOrderId, 'paid');
          } catch (e) {
            // fallback local status update
            if (localOrderId) updateOrderStatus(localOrderId, 'paid');
          }
          clearCart && clearCart();
          setStatus('success');
          setMessage('تمت عملية الدفع بنجاح. شكراً لطلبك!');
        } else {
          setStatus('error');
          setMessage('فشل إتمام الدفع: ' + (result?.message || 'غير معروف'));
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
        setMessage('حدث خطأ أثناء إتمام الدفع: ' + err.message);
      }
    };

    doCapture();
  }, [token, localOrderId, updateOrderStatus, clearCart]);

  return (
    <div className="container-custom px-4 py-12 text-center">
      <Seo title={(status==='success' ? (locale==='ar'?'تم الدفع':'Paid') : status==='error' ? (locale==='ar'?'فشل الدفع':'Payment Failed') : (locale==='ar'?'جاري الدفع':'Processing Payment')) + ' | ' + siteName} />
      {status === 'processing' && (
        <>
          <h2 className="text-2xl font-bold mb-4">جاري إكمال الدفع...</h2>
          <p>{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h2 className="text-2xl font-bold mb-4">تمت عملية الشراء بنجاح</h2>
          <p>{message}</p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate('/orders')}>عرض الطلبات</Button>
            <Button variant="secondary" size="md" className="ml-2" onClick={() => navigate('/')}>العودة للمتجر</Button>
          </div>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 className="text-2xl font-bold mb-4">فشل إتمام الدفع</h2>
          <p className="text-red-600">{message}</p>
          <div className="mt-6">
            <Button variant="secondary" onClick={() => navigate('/cart')}>الرجوع للسلة</Button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutSuccess;

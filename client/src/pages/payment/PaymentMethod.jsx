import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutContext } from '../contexts/CheckoutContext';
import { PaymentContext } from '../contexts/PaymentContext';

const PaymentMethod = () => {
  const { cartItems } = useContext(CheckoutContext) || {};
  const {
    intent,
    attachCard,
    confirmCardPayment,
    status,
    error,
    totals
  } = useContext(PaymentContext);
  const navigate = useNavigate();

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!cartItems || !cartItems.length) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const maskNumber = (value) =>
    value.replace(/\D/g, '').slice(0, 16);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    if (cardNumber.length < 13 || !expiry.match(/^\d{2}\/\d{2}$/) || cvv.length < 3) {
      setErr('تحقق من بيانات البطاقة');
      return;
    }

    setLoading(true);
    const attach = await attachCard({
      cardNumber,
      holder: cardName,
      expiry,
      cvv
    });
    if (!attach.success) {
      setLoading(false);
      setErr(attach.error);
      return;
    }
    const confirm = await confirmCardPayment();
    setLoading(false);

    if (confirm?.success) {
      navigate('/checkout/success');
    } else {
      setErr('لم يتم إكمال العملية');
    }
  };
  
  const baseInputClass = "w-full bg-bg-alt border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary-alt outline-none transition-all";
  const baseButtonClass = "w-full text-center px-4 py-3 rounded-lg text-sm font-semibold border-0 cursor-pointer transition-colors";

  return (
    <section className="max-w-xl mx-auto my-8 bg-surface p-6 sm:p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-text">الدفع بالبطاقة</h2>
      {totals && (
        <div className="text-base mb-6 text-text-soft">
          الإجمالي: <strong className="font-bold text-text">{totals.formatted.grandTotal}</strong>
        </div>
      )}
      {!intent && <p className="text-sm text-text-faint">تهيئة عملية الدفع...</p>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5 text-text-label">اسم حامل البطاقة</label>
          <input
            required
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="الاسم كما في البطاقة"
            className={baseInputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5 text-text-label">رقم البطاقة</label>
          <input
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(maskNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            className={baseInputClass}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5 text-text-label">انتهاء (MM/YY)</label>
            <input
              required
              value={expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                setExpiry(v);
              }}
              placeholder="08/26"
              className={baseInputClass}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5 text-text-label">CVV</label>
            <input
              required
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
              className={baseInputClass}
            />
          </div>
        </div>

        {err && <div className="text-danger text-sm font-medium">{err}</div>}
        {status === 'processing' && <div className="text-text-faint text-sm">جاري المعالجة...</div>}
        {error && <div className="text-danger text-sm font-medium">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={`${baseButtonClass} bg-primary text-white hover:bg-primary-alt disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4`}
        >
          {loading ? 'جاري المعالجة...' : 'إتمام الدفع'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className={`${baseButtonClass} bg-bg-alt text-text-soft hover:bg-border`}
        >
          العودة لملخص الطلب
        </button>
      </form>
    </section>
  );
};

export default PaymentMethod;

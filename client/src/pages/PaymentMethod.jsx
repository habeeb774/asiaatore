import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutContext } from '../stores/CheckoutContext';
import { PaymentContext } from '../stores/PaymentContext';

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

  // إن لم توجد عناصر بالسلة نعيد المستخدم
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

  return (
    <section className="payment-method-page" style={{ maxWidth: 520, margin: '2rem auto', background: '#fff', padding: '1.5rem 1.75rem', borderRadius: 12, boxShadow: '0 8px 24px -10px rgba(0,0,0,.08)' }}>
      <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>الدفع بالبطاقة</h2>
      {totals && (
        <div style={{ fontSize: '.9rem', marginBottom: '1rem', color: '#374151' }}>
          الإجمالي: <strong>{totals.formatted.grandTotal}</strong>
        </div>
      )}
      {!intent && <p style={{ fontSize: '.75rem', color: '#666' }}>تهيئة عملية الدفع...</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '.75rem', marginBottom: 4 }}>اسم حامل البطاقة</label>
          <input
            required
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="الاسم كما في البطاقة"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '.75rem', marginBottom: 4 }}>رقم البطاقة</label>
          <input
            required
            value={cardNumber}
            onChange={(e) => setCardNumber(maskNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '.75rem', marginBottom: 4 }}>انتهاء (MM/YY)</label>
            <input
              required
              value={expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                setExpiry(v);
              }}
              placeholder="08/26"
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '.75rem', marginBottom: 4 }}>CVV</label>
            <input
              required
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              inputMode="numeric"
              style={inputStyle}
            />
          </div>
        </div>

        {err && <div style={{ color: '#b91c1c', fontSize: '.8rem' }}>{err}</div>}
        {status === 'processing' && <div style={{ fontSize: '.75rem', color: '#64748b' }}>جاري المعالجة...</div>}
        {error && <div style={{ color: '#b91c1c', fontSize: '.75rem' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: 'linear-gradient(90deg,#69be3c,#f6ad55)',
            color: '#fff',
            border: 0,
            padding: '.85rem 1.2rem',
            borderRadius: 10,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '.5rem',
            fontSize: '.9rem'
          }}
        >
          {loading ? 'جاري المعالجة...' : 'إتمام الدفع'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          style={{
            background: '#f3f4f6',
            color: '#374151',
            border: 0,
            padding: '.7rem 1.1rem',
            borderRadius: 10,
            fontSize: '.8rem',
            cursor: 'pointer'
          }}
        >
          العودة لملخص الطلب
        </button>
      </form>
    </section>
  );
};

const inputStyle = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '.65rem .75rem',
  fontSize: '.85rem',
  outline: 'none'
};

export default PaymentMethod;

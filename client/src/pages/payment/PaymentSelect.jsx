import React, { useContext, useEffect } from 'react';
import { PaymentContext } from '../contexts/PaymentContext';
import { CheckoutContext } from '../contexts/CheckoutContext';
import { useNavigate } from 'react-router-dom';

const PaymentSelect = () => {
  const { totals } = useContext(CheckoutContext) || {};
  const {
    selectMethod,
    method,
    status,
    error,
    formatCurrency,
    submitCOD
  } = useContext(PaymentContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (method === 'card' && status === 'intent_created') {
      navigate('/checkout/payment/card');
    }
    if (method === 'cod' && status === 'succeeded') {
      navigate('/checkout/success');
    }
  }, [method, status, navigate]);

  const choose = (m) => selectMethod(m);

  const handleCOD = async () => {
    await choose('cod');
    await submitCOD();
  };

  return (
    <section style={wrapper}>
      <h2 style={title}>اختر وسيلة الدفع</h2>
      {totals && (
        <div style={summaryBox}>
          <div>الإجمالي: <strong>{totals.formatted.grandTotal}</strong></div>
        </div>
      )}
      <div style={methods}>
        <button onClick={() => choose('card')} style={btn}>
          💳 بطاقة بنكية
        </button>
        <button onClick={handleCOD} style={btnSecondary}>
          🚚 دفع عند الاستلام
        </button>
        <button disabled style={btnDisabled} title="قريباً">
          🏦 تحويل بنكي (قريباً)
        </button>
      </div>
      {status === 'processing' && <p style={muted}>جاري التحميل...</p>}
      {error && <p style={errStyle}>{error}</p>}
    </section>
  );
};

const wrapper = { maxWidth: 520, margin: '2rem auto', background:'#fff', padding:'1.5rem 1.75rem', borderRadius:12, boxShadow:'0 8px 24px -10px rgba(0,0,0,.08)', direction:'rtl' };
const title = { margin:'0 0 1rem', fontSize:'1.25rem' };
const summaryBox = { background:'#f8fafc', padding:'.75rem 1rem', borderRadius:10, fontSize:'.85rem', marginBottom:'1rem' };
const methods = { display:'flex', flexDirection:'column', gap:'.75rem' };
const baseBtn = { padding:'.9rem 1rem', borderRadius:10, fontWeight:600, border:0, cursor:'pointer', fontSize:'.9rem' };
const btn = { ...baseBtn, background:'linear-gradient(90deg,#69be3c,#f6ad55)', color:'#fff' };
const btnSecondary = { ...baseBtn, background:'#1e293b', color:'#fff' };
const btnDisabled = { ...baseBtn, background:'#e2e8f0', color:'#64748b', cursor:'not-allowed' };
const muted = { fontSize:'.75rem', color:'#64748b' };
const errStyle = { color:'#b91c1c', fontSize:'.8rem' };

export default PaymentSelect;

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

  const baseButtonClass = "w-full text-center px-4 py-4 rounded-lg text-base font-semibold border-0 cursor-pointer transition-colors duration-200 flex items-center justify-center gap-3";

  return (
    <section className="max-w-lg mx-auto my-8 bg-surface p-6 sm:p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-text">اختر وسيلة الدفع</h2>
      {totals && (
        <div className="bg-bg-alt p-4 rounded-xl text-base mb-6">
          <div className="text-text-soft">الإجمالي: <strong className="text-text font-bold">{totals.formatted.grandTotal}</strong></div>
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button onClick={() => choose('card')} className={`${baseButtonClass} bg-primary text-white hover:bg-primary-alt`}>
          💳 بطاقة بنكية
        </button>
        <button onClick={handleCOD} className={`${baseButtonClass} bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600`}>
          🚚 دفع عند الاستلام
        </button>
        <button disabled title="قريباً" className={`${baseButtonClass} bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400`}>
          🏦 تحويل بنكي (قريباً)
        </button>
      </div>
      {status === 'processing' && <p className="text-sm text-text-faint mt-4 text-center">جاري التحميل...</p>}
      {error && <p className="text-sm text-danger mt-4 text-center font-medium">{error}</p>}
    </section>
  );
};

export default PaymentSelect;

import React from 'react';

const PaymentProcessing = () => {
  return (
    <div style={{
      maxWidth: 460,
      margin: '4rem auto',
      textAlign: 'center',
      background: '#fff',
      padding: '2rem 1.5rem',
      borderRadius: 16,
      boxShadow:'0 10px 30px -12px rgba(0,0,0,.15)'
    }}>
      <div style={{ fontSize:'3rem', lineHeight:1, marginBottom:'1rem' }}>⏳</div>
      <h2 style={{ margin:'0 0 .75rem', fontSize:'1.2rem' }}>جاري معالجة الدفع</h2>
      <p style={{ fontSize:'.85rem', color:'#475569', margin:0 }}>
        يرجى عدم إغلاق الصفحة حتى يكتمل الإجراء...
      </p>
    </div>
  );
};

export default PaymentProcessing;

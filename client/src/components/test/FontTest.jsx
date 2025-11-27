import React from 'react';
import './FontTest.css';

const FontTest = () => {
  return (
    <div className="font-test-container">
      <h1>اختبار خط Cairo</h1>
      <p>هذا النص يجب أن يظهر بخط Cairo</p>
      <div className="product-card">
        <h3>عنوان المنتج الاختباري</h3>
        <p>وصف المنتج باللغة العربية</p>
      </div>
    </div>
  );
};

export default FontTest;

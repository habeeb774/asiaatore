import React from 'react';
import './FontTest.css';

const FontTest = () => {
  return (
    <div className="font-test-container">
      <h1>اختبار خط Cairo - عناوين</h1>
      <h2>عنوان فرعي</h2>
      <p>هذا النص يجب أن يظهر بخط Cairo</p>
      <div className="test-card">
        <h3>عنوان المنتج الاختباري</h3>
        <p>وصف المنتج باللغة العربية</p>
      </div>
    </div>
  );
};

export default FontTest;

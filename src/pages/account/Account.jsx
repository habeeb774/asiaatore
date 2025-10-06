import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Account = () => {
  const { user, logout } = useAuth() || {};
  if (!user) {
    return (
      <div className="container-custom px-4 py-12 text-center">
        <div className="mb-4">لم تقم بتسجيل الدخول بعد.</div>
        <div className="flex justify-center gap-3">
          <button className="btn-primary" onClick={() => (alert('استخدم أزرار التسجيل في الشريط العلوي لأغراض التطوير'))}>تسجيل الدخول</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom px-4 py-12">
      <h2 className="text-2xl font-bold mb-4">حسابي</h2>
      <div className="mb-4">الاسم: {user.name}</div>
      <div className="mb-4">الدور: {user.role}</div>

      <div className="flex gap-3">
        <Link to="/orders" className="btn-secondary px-4 py-2">طلباتي</Link>
        {user.role === 'seller' && <Link to="/seller/products" className="btn-secondary px-4 py-2">إدارة منتجاتي</Link>}
        {user.role === 'admin' && <Link to="/admin" className="btn-secondary px-4 py-2">لوحة المدير</Link>}
        <button className="btn-primary" onClick={logout}>خروج</button>
      </div>
    </div>
  );
};

export default Account;

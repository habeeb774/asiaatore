import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';

const Register = () => {
  const { devLoginAs } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { setting } = useSettings() || {};
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية';

  const handleSubmit = (e) => {
    e.preventDefault();
  // create mock account and login
  devLoginAs('user');
    navigate('/');
  };

  return (
    <div className="container-custom py-12">
  <Seo title={`إنشاء حساب - ${siteName}`} description="انشئ حساب جديد" />
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">إنشاء حساب</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-sm" htmlFor="reg-name">الاسم الكامل</label>
            <input id="reg-name" name="name" autoComplete="name" className="w-full mt-1 p-2 border rounded" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="text-sm" htmlFor="reg-email">البريد الإلكتروني أو الهاتف</label>
            <input id="reg-email" name="email" type="email" autoComplete="email" className="w-full mt-1 p-2 border rounded" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="text-sm" htmlFor="reg-password">كلمة المرور</label>
            <input id="reg-password" name="new-password" type="password" autoComplete="new-password" className="w-full mt-1 p-2 border rounded" value={password} onChange={(e)=>setPassword(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <button className="btn-primary px-6 py-2">أنشئ الحساب</button>
            <a href="#" className="text-sm text-primary-red">لديك حساب؟ سجل دخول</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

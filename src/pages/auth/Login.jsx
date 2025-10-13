import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';

const Login = () => {
  const { devLoginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const { setting } = useSettings() || {};
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية';

  const handleSubmit = (e) => {
    e.preventDefault();
  // Use mock login for now
  devLoginAs('user');
    navigate('/');
  };

  return (
    <div className="container-custom py-12">
  <Seo title={`تسجيل الدخول - ${siteName}`} description="تسجيل الدخول إلى حسابك" />
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">تسجيل الدخول</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-sm" htmlFor="login-identifier">البريد الإلكتروني أو الهاتف</label>
            <input
              id="login-identifier"
              name="username"
              autoComplete="username"
              className="w-full mt-1 p-2 border rounded"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="text-sm" htmlFor="login-password">كلمة المرور</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full mt-1 p-2 border rounded"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <button className="btn-primary px-6 py-2">دخول</button>
            <a href="#" className="text-sm text-primary-red">نسيت كلمة المرور؟</a>
          </div>
        </form>

        <div className="my-4 text-center">أو سجل عبر</div>
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={()=>{ devLoginAs('user'); navigate('/') }}>تسجيل سريع</button>
          <button className="btn-secondary flex-1" onClick={()=>window.alert('OAuth not wired yet')}>Google</button>
        </div>
      </div>
    </div>
  );
};

export default Login;

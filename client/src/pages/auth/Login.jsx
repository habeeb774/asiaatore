import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/Seo';
import { useSettings } from '../../context/SettingsContext';

const Login = () => {
  const { devLoginAs, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfa, setShowMfa] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { setting } = useSettings() || {};
  const siteName = setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (showMfa && !mfaCode)) {
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password, showMfa ? mfaCode : null);
      if (res?.ok) {
        navigate('/');
      } else if (res?.error === 'MFA_REQUIRED') {
        setShowMfa(true);
      }
    } finally {
      setLoading(false);
    }
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
          {showMfa && (
            <div className="mb-3">
              <label className="text-sm" htmlFor="mfa-code">رمز MFA (من تطبيق المصادقة)</label>
              <input
                id="mfa-code"
                name="mfaCode"
                type="text"
                className="w-full mt-1 p-2 border rounded"
                value={mfaCode}
                onChange={(e)=>setMfaCode(e.target.value)}
                maxLength={6}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <button className="btn-primary px-6 py-2" disabled={loading}>{loading ? 'جاري الدخول…' : 'دخول'}</button>
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

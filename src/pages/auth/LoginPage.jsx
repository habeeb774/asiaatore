import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card.jsx';

const LoginPage = () => {
  const { login, devLoginAs } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) {
      setError('الرجاء إدخال البريد وكلمة المرور');
      return;
    }
    try {
      setLoading(true);
      const r = await login(email.trim(), password);
      if (r.ok) {
        navigate(redirectTo, { replace: true });
      } else {
        setError(r.error === 'INVALID_LOGIN' ? 'بيانات دخول خاطئة' : (r.error || 'فشل تسجيل الدخول'));
      }
    } catch (err) {
      setError(err.message || 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const quickAdmin = async () => {
    // Convenience: Pre-fill demo admin
    setEmail('admin@example.com');
    setPassword('Admin123!');
  };

  const devAssumeAdmin = () => {
    if (devLoginAs) devLoginAs('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] w-full grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="space-y-1">
            <CardTitle>تسجيل الدخول</CardTitle>
            <p className="text-xs text-gray-500">ادخل بيانات حسابك للوصول إلى المتجر ولوحة التحكم.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@mail.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>{ if (e.key==='Enter') { e.currentTarget.form?.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})); } }}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  className="pr-16"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 -translate-y-1/2 right-1 text-xs text-gray-600"
                  onClick={()=>setShowPwd(s=>!s)}
                  title={showPwd ? 'إخفاء' : 'إظهار'}
                >{showPwd ? 'إخفاء' : 'إظهار'}</Button>
              </div>
            </div>
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
            ) : null}
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#69be3c] to-amber-400">
              {loading ? '...جاري الدخول' : 'دخول'}
            </Button>
          </form>
          <div className="mt-4 grid gap-2">
            <Button type="button" variant="outline" onClick={quickAdmin}>ملء بيانات الأدمن التجريبية</Button>
            <Button type="button" variant="outline" onClick={devAssumeAdmin} className="bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100">
              دخول فوري (محاكاة أدمن محلي)
            </Button>
          </div>
          <p className="mt-3 text-[0.72rem]">
            ليس لديك حساب؟ <Link to="/register" className="underline">إنشاء حساب</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// legacy styles removed; now using Tailwind classes

export default LoginPage;

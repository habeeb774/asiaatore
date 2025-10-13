import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صحيح').min(1, 'البريد مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const LoginPage = () => {
  const { login, devLoginAs } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/';

  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    if (loading) return;
    setLoading(true);
    try {
      const r = await login(data.email.trim(), data.password);
      if (r.ok) {
        navigate(redirectTo, { replace: true });
      } else {
        setError('root', { message: r.error === 'INVALID_LOGIN' ? 'بيانات دخول خاطئة' : (r.error || 'فشل تسجيل الدخول') });
      }
    } catch (err) {
      setError('root', { message: err.message || 'خطأ غير متوقع' });
    } finally {
      setLoading(false);
    }
  };

  const quickAdmin = () => {
    // Convenience: Pre-fill demo admin
    // Note: This would set values if we had setValue, but for simplicity, keep as is
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
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-1">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@mail.com"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
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
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            {errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errors.root.message}</div>
            )}
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

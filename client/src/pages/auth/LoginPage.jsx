import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../stores/AuthContext';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(1, 'المعرف مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const LoginPage = () => {
  const { login, devLoginAs } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || new URLSearchParams(location.search).get('redirect') || '/';

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, setFocus } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit'
  });

  const [showPwd, setShowPwd] = React.useState(false);
  React.useEffect(() => { setFocus('identifier'); }, [setFocus]);

  const [lastSubmitTime, setLastSubmitTime] = React.useState(0);
  const SUBMIT_COOLDOWN = 2000; // 2 seconds between submissions

  const onSubmit = async (data) => {
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      setError('root', { message: 'يرجى الانتظار قليلاً قبل المحاولة مرة أخرى.' });
      return;
    }
    setLastSubmitTime(now);

    try {
      const r = await login(data.identifier.trim(), data.password);
      if (r.ok) {
        navigate(redirectTo, { replace: true });
      } else {
        // Handle rate limiting with a more user-friendly message
        if (r.error === 'RATE_LIMIT_EXCEEDED') {
          setError('root', { message: 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.' });
        } else {
          const msg = r?.error === 'INVALID_LOGIN'
            ? 'بيانات دخول خاطئة'
            : r?.error === 'USER_BLOCKED'
              ? 'تم إيقاف حسابك مؤقتًا'
              : r?.error === 'EMAIL_NOT_VERIFIED'
                ? 'يرجى تأكيد بريدك الإلكتروني أولاً'
                : (r?.error || 'فشل تسجيل الدخول');
          setError('root', { message: msg });
        }
      }
    } catch (err) {
      // Handle network/rate limiting errors
      if (err?.code === 'RATE_LIMIT_EXCEEDED' || err?.message?.includes('429')) {
        setError('root', { message: 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.' });
      } else {
        setError('root', { message: err.message || 'خطأ غير متوقع' });
      }
    }
  };

  const devAssumeAdmin = () => {
    if (devLoginAs) devLoginAs('admin');
    navigate('/admin');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] w-full grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>تسجيل الدخول</CardTitle>
          <CardDescription>ادخل بيانات حسابك للوصول إلى المتجر ولوحة التحكم.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" aria-describedby={errors.root ? 'login-error' : undefined}>
            <Input
              id="identifier"
              type="text"
              label="البريد الإلكتروني أو رقم الجوال"
              autoComplete="username"
              placeholder="example@mail.com أو 05xxxxxxxx"
              error={errors.identifier?.message}
              {...register('identifier')}
            />
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                label="كلمة المرور"
                autoComplete="current-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
                className="pr-16"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-1/2 -translate-y-1/2 right-1 text-xs text-gray-600 mt-3"
                onClick={()=>setShowPwd(s=>!s)}
                title={showPwd ? 'إخفاء' : 'إظهار'}
              >{showPwd ? 'إخفاء' : 'إظهار'}</Button>
            </div>
            {errors.root && (
              <div id="login-error" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{errors.root.message}</div>
            )}
            <Button type="submit" disabled={isSubmitting} variant="secondary" className="w-full bg-sky-600 hover:bg-sky-700 text-white border-transparent">
              {isSubmitting ? '...جاري الدخول' : 'دخول'}
            </Button>
          </form>
          <div className="mt-4 grid gap-2">
            <Link to="/forgot" className="text-xs underline text-gray-600 hover:text-gray-800">نسيت كلمة المرور؟</Link>
            {import.meta.env.DEV && (
              <Button type="button" variant="outline" onClick={devAssumeAdmin} className="bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100">
                دخول فوري (محاكاة أدمن محلي)
              </Button>
            )}
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

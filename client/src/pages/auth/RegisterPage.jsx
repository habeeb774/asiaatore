import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').min(1, 'البريد مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirm: z.string().min(6, 'التأكيد مطلوب')
}).refine((data) => data.password === data.confirm, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm']
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, setFocus, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit'
  });
  React.useEffect(() => { setFocus('email'); }, [setFocus]);

  const onSubmit = async (data) => {
    try {
      const res = await api.authRegister(data.email.trim(), data.password, (data.name || '').trim());
      if (res?.ok) {
        navigate('/login', { replace: true, state: { justRegistered: true } });
        return;
      }
      // If API returns ok=false (unlikely on 2xx), fall back to generic
      const msg = res?.error === 'EMAIL_EXISTS' ? 'البريد مستخدم بالفعل' : (res?.error || 'فشل التسجيل');
      setError('root', { message: msg });
    } catch (e) {
      // Map structured errors from api.request()
      const code = e?.code;
      const status = e?.status;
      if (code === 'EMAIL_EXISTS' || status === 409) {
        return setError('email', { message: 'البريد مستخدم بالفعل' });
      }
      if (code === 'INVALID_INPUT' || status === 400) {
        return setError('root', { message: 'بيانات غير صالحة، تحقق من الحقول' });
      }
      if (code === 'BAD_JSON') {
        return setError('root', { message: 'خطأ في تنسيق البيانات، حاول مرة أخرى' });
      }
      if (code === 'DB_UNAVAILABLE' || status === 503) {
        return setError('root', { message: 'الخدمة غير متاحة مؤقتاً، حاول لاحقاً' });
      }
      setError('root', { message: (e?.message && e.message.replace(/^API Error \d+[^-]*-\s*/, '')) || 'خطأ غير متوقع' });
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] w-full grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
          <CardDescription>أدخل بياناتك لإنشاء حساب جديد.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3" aria-describedby={errors.root ? 'register-error' : undefined}>
            <Input
              id="name"
              label="الاسم"
              placeholder="الاسم"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="email"
              type="email"
              label="البريد الإلكتروني"
              autoComplete="email"
              placeholder="example@mail.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              id="password"
              type="password"
              label="كلمة المرور"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              id="confirm"
              type="password"
              label="تأكيد كلمة المرور"
              autoComplete="new-password"
              placeholder="••••••••"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            {errors.root && (
              <div id="register-error" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{errors.root.message}</div>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting? '...جاري' : 'تسجيل'}</Button>
            <p className="mt-1 text-[0.72rem]">لديك حساب؟ <Link to="/login" className="underline">دخول</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// legacy inline styles removed; using Tailwind classes

export default RegisterPage;

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/client';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';
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
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3" aria-describedby={errors.root ? 'register-error' : undefined}>
            <div className="grid gap-1">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" placeholder="الاسم" {...register('name')} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="example@mail.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600" role="alert">{errors.email.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600" role="alert">{errors.password.message}</p>}
            </div>
            <div className="grid gap-1">
              <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
              <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirm')} />
              {errors.confirm && <p className="text-xs text-red-600" role="alert">{errors.confirm.message}</p>}
            </div>
            {errors.root && (
              <div id="register-error" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{errors.root.message}</div>
            )}
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#69be3c] to-amber-400">{isSubmitting? '...جاري' : 'تسجيل'}</Button>
            <p className="mt-1 text-[0.72rem]">لديك حساب؟ <Link to="/login" className="underline">دخول</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// legacy inline styles removed; using Tailwind classes

export default RegisterPage;

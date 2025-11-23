import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api/client';
import { Button, Input } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import AuthShell from '../../components/features/auth/AuthShell.jsx';
import AuthFormField from '../../components/features/auth/AuthFormField.jsx';

const registerSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional(),
  phone: z.string().trim().optional(),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  confirm: z.string().min(6, 'التأكيد مطلوب')
}).refine((data) => data.email || data.phone, {
  message: 'يجب إدخال البريد الإلكتروني أو رقم الجوال',
  path: ['email']
}).refine((data) => data.password === data.confirm, {
  message: 'كلمتا المرور غير متطابقتين',
  path: ['confirm']
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const { register, handleSubmit, setFocus, setError, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onSubmit'
  });
  React.useEffect(() => { setFocus('email'); }, [setFocus]);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const onSubmit = async (data) => {
    try {
      const res = await api.authRegister(data.email, data.password, (data.name || '').trim(), data.phone);
      if (res?.ok && res.accessToken && res.user) {
        // Auto-login: set the token and user directly
        setAuthData(res.accessToken, res.user);
        navigate('/', { replace: true });
        return;
      }
      // If API returns ok=false (unlikely on 2xx), fall back to generic
      const msg = res?.error === 'EMAIL_EXISTS' ? 'البريد مستخدم بالفعل' :
                  res?.error === 'PHONE_EXISTS' ? 'رقم الجوال مستخدم بالفعل' :
                  (res?.error || 'فشل التسجيل');
      setError('root', { message: msg });
    } catch (e) {
      // Map structured errors from api.request()
      const code = e?.code;
      const status = e?.status;
      if (code === 'EMAIL_EXISTS' || status === 409) {
        return setError('email', { message: 'البريد مستخدم بالفعل' });
      }
      if (code === 'PHONE_EXISTS') {
        return setError('phone', { message: 'رقم الجوال مستخدم بالفعل' });
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

  const highlights = [
    'إنشاء حساب إداري لإدارة المنتجات والطلبات بسهولة.',
    'متابعة مؤشرات الأداء لحظيًا مع تنبيهات ذكية.',
    'تجربة عربية متكاملة مع إعدادات قابلة للتخصيص لكل فريق.'
  ];

  return (
    <AuthShell
      title="حساب إدارة جديد"
      subtitle="إملأ البيانات التالية لبدء رحلتك مع منصة منفذ آسيا وإدارة متجرك بكفاءة."
      highlights={highlights}
      dir="rtl"
      footer={
        <span>
          بالحصول على حساب توافق على شروط الاستخدام وسياسة الخصوصية وتؤكد امتلاكك لصلاحية إدارة المتجر.
        </span>
      }
    >
      <header className="text-right">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-[0.75rem] text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          إنشاء حساب إداري
        </span>
        <h2 className="mt-4 text-2xl font-bold text-white">ابدأ التسجيل</h2>
        <p className="mt-2 text-sm text-slate-300">
          أدخل بيانات التواصل الأساسية لتفعيل الحساب والوصول إلى لوحة التحكم الموحدة.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-6"
        aria-describedby={errors.root ? 'register-error' : undefined}
      >
        <AuthFormField id="name" label="الاسم" hint="اختياري - يساعد الفريق على التعرف عليك" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            dir="rtl"
            className="w-full text-right"
            placeholder="الاسم الكامل"
            {...register('name')}
          />
        </AuthFormField>

        <AuthFormField id="email" label="البريد الإلكتروني" hint="يمكن استخدام البريد أو رقم الجوال لتسجيل الدخول" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            dir="rtl"
            className="w-full text-right"
            autoComplete="email"
            placeholder="example@mail.com"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </AuthFormField>

        <AuthFormField id="phone" label="رقم الجوال" hint="صيغة سعودية مثل 05xxxxxxxx" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            dir="rtl"
            className="w-full text-right"
            autoComplete="tel"
            placeholder="05xxxxxxxx"
            aria-invalid={Boolean(errors.phone)}
            {...register('phone')}
          />
        </AuthFormField>

        <AuthFormField id="password" label="كلمة المرور" error={errors.password?.message}>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            dir="rtl"
            className="w-full text-right pr-20"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 left-2 my-auto px-2 text-xs text-slate-200 hover:text-white"
            onClick={() => setShowPassword((value) => !value)}
            title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? 'إخفاء' : 'إظهار'}
          </Button>
        </AuthFormField>

        <AuthFormField id="confirm" label="تأكيد كلمة المرور" error={errors.confirm?.message}>
          <Input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            dir="rtl"
            className="w-full text-right pr-20"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.confirm)}
            {...register('confirm')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 left-2 my-auto px-2 text-xs text-slate-200 hover:text-white"
            onClick={() => setShowConfirm((value) => !value)}
            title={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showConfirm ? 'إخفاء' : 'إظهار'}
          </Button>
        </AuthFormField>

        {errors.root ? (
          <div
            id="register-error"
            role="alert"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-100"
          >
            {errors.root.message}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="ui-btn--lg w-full border-emerald-400/60 bg-emerald-500 text-white hover:bg-emerald-400"
        >
          {isSubmitting ? '...جاري إنشاء الحساب' : 'إنشاء الحساب'}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-300">
        لديك حساب مسبقًا؟
        <Link to="/login" className="mr-2 font-medium text-emerald-300 hover:text-emerald-200">
          تسجيل الدخول
        </Link>
      </div>
    </AuthShell>
  );
};

// legacy inline styles removed; using Tailwind classes

export default RegisterPage;

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '../../components/features/auth/AuthShell.jsx';
import AuthFormField from '../../components/features/auth/AuthFormField.jsx';

const loginSchema = z.object({
  identifier: z.string().min(1, 'المعرف مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

const LoginPage = () => {
  const { login } = useAuth() || {};
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

  const highlights = [
    'الدخول الآمن إلى لوحة التحكم وتقارير الأداء.',
    'إدارة المنتجات والطلبات والعملاء من مكان واحد.',
    'دعم كامل للغة العربية وتجربة مهيأة للفرق المحلية.',
  ];

  return (
    <AuthShell
      title="أهلاً بعودتك"
      subtitle="سجّل الدخول للوصول إلى لوحة الإدارة وتتبع الأعمال اليومية بكل سهولة."
      highlights={highlights}
      dir="rtl"
      footer={
        <span>
          باستخدامك هذا النظام فأنت توافق على الشروط والأحكام وسياسات الخصوصية الخاصة بمنفذ آسيا.
        </span>
      }
    >
      <header className="text-right">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[0.75rem] text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300" />
          دخول الإدارة
        </span>
        <h2 className="mt-4 text-2xl font-bold text-white">تسجيل الدخول</h2>
        <p className="mt-2 text-sm text-slate-300">
          أدخل بيانات حسابك المصرّح به للاستفادة من أدوات إدارة المتجر.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-6"
        aria-describedby={errors.root ? 'login-error' : undefined}
      >
        <AuthFormField
          id="identifier"
          label="البريد الإلكتروني أو رقم الجوال"
          error={errors.identifier?.message}
        >
          <Input
            id="identifier"
            type="text"
            dir="rtl"
            className="w-full text-right"
            autoComplete="username"
            placeholder="example@mail.com أو 05xxxxxxxx"
            aria-invalid={Boolean(errors.identifier)}
            {...register('identifier')}
          />
        </AuthFormField>

        <AuthFormField
          id="password"
          label="كلمة المرور"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type={showPwd ? 'text' : 'password'}
            dir="rtl"
            className="w-full text-right pr-20"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute inset-y-0 left-2 my-auto px-2 text-xs text-slate-200 hover:text-white"
            onClick={() => setShowPwd((s) => !s)}
            title={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPwd ? 'إخفاء' : 'إظهار'}
          </Button>
        </AuthFormField>

        {errors.root ? (
          <div
            id="login-error"
            role="alert"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-100"
          >
            {errors.root.message}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-slate-300">
          <Link to="/forgot" className="transition hover:text-white">نسيت كلمة المرور؟</Link>
          <span>يدعم النظام الأحرف العربية والإنجليزية</span>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          className="ui-btn--lg w-full border-emerald-400/60 bg-emerald-500 text-white hover:bg-emerald-400"
        >
          {isSubmitting ? '...جاري التحقق من البيانات' : 'تسجيل الدخول'}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center text-xs text-slate-300">
        <p>
          لا تمتلك حسابًا حتى الآن؟
          <Link to="/register" className="ml-2 font-medium text-emerald-300 hover:text-emerald-200">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

// legacy styles removed; now using Tailwind classes

export default LoginPage;

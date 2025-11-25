import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthShell from '../../components/features/auth/AuthShell.jsx';
import AuthFormField from '../../components/features/auth/AuthFormField.jsx';

// Schema: password required only when method = 'password'
const loginSchema = z.object({
  method: z.enum(['password','social']).default('password'),
  identifier: z.string().min(1, 'المعرف مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
}).superRefine((val, ctx) => {
  if (val.method === 'password' && (!val.password || val.password.length < 6)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'أدخل كلمة المرور', path: ['password'] });
  }
});

const LoginPage = () => {
  const { login } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const googleEnabled = import.meta.env.VITE_AUTH_GOOGLE_ENABLED === 'true';
  const facebookEnabled = import.meta.env.VITE_AUTH_FACEBOOK_ENABLED === 'true';
  const appleEnabled = import.meta.env.VITE_AUTH_APPLE_ENABLED === 'true';
  const redirectTo = (location.state && location.state.from) || new URLSearchParams(location.search).get('redirect') || '/';

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, setError, setFocus } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit'
  });
  const method = watch('method');

  // Social login handler stub (to be replaced with actual provider flows)
  const handleSocial = async (provider) => {
    try {
      // Placeholder: in future integrate SDK then call /api/auth/social
      console.info('[SOCIAL_LOGIN] provider selected:', provider);
      setError('root', { message: `دخول ${provider} غير مفعل حالياً` });
    } catch (e) {
      setError('root', { message: e.message || 'فشل تسجيل الدخول الاجتماعي' });
    }
  };

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
      // Pass only identifier + password; previous code leaked {method} as mfaCode causing validation errors
      const r = await login(data.identifier.trim(), data.method === 'password' ? (data.password || '') : '');
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
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[0.75rem] text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          دخول الإدارة
        </span>
        <h2 className="mt-4 text-2xl font-bold text-text">تسجيل الدخول</h2>
        <p className="mt-2 text-sm text-text-soft">
          أدخل بيانات حسابك المصرّح به للاستفادة من أدوات إدارة المتجر.
        </p>
      </header>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-6"
        aria-describedby={errors.root ? 'login-error' : undefined}
      >
        <div className="flex items-center justify-end gap-3 text-xs">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" value="password" defaultChecked {...register('method')} />
            <span>كلمة مرور</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" value="social" {...register('method')} />
            <span>تسجيل اجتماعي</span>
          </label>
        </div>
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

        {method === 'password' && (
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
              className="absolute inset-y-0 left-2 my-auto px-2 text-xs text-text-soft hover:text-text"
              onClick={() => setShowPwd((s) => !s)}
              title={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPwd ? 'إخفاء' : 'إظهار'}
            </Button>
          </AuthFormField>
        )}
        {method === 'social' && (
          <div className="flex gap-2 mb-4">
            {googleEnabled && (
              <button type="button" onClick={() => handleSocial('google')} className="flex-1 bg-red-500 text-white py-2 rounded">Google</button>
            )}
            {facebookEnabled && (
              <button type="button" onClick={() => handleSocial('facebook')} className="flex-1 bg-blue-600 text-white py-2 rounded">Facebook</button>
            )}
            {appleEnabled && (
              <button type="button" onClick={() => handleSocial('apple')} className="flex-1 bg-black text-white py-2 rounded">Apple</button>
            )}
          </div>
        )}

        {errors.root ? (
          <div
            id="login-error"
            role="alert"
            className="rounded-lg border border-red-400 bg-red-100 p-4 text-sm font-medium text-red-700"
          >
            {errors.root.message}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs text-text-soft">
          <Link to="/forgot" className="transition hover:text-text">نسيت كلمة المرور؟</Link>
          <span>يدعم النظام الأحرف العربية والإنجليزية</span>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          className="ui-btn--lg w-full"
        >
          {isSubmitting ? '...جاري التحقق من البيانات' : 'تسجيل الدخول'}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center text-xs text-text-soft">
        <p>
          لا تمتلك حسابًا حتى الآن؟
          <Link to="/register" className="ml-2 font-medium text-primary hover:text-primary/80">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

// legacy styles removed; now using Tailwind classes

export default LoginPage;

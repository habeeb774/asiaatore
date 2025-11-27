import React from 'react';
import AuthShell from '../../components/features/auth/AuthShell.jsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AuthFormField from '../../components/features/auth/AuthFormField.jsx';
import '../../styles/legacy/auth-modern.css';

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
      title="تسجيل الدخول"
      subtitle="ادخل بياناتك للوصول إلى لوحة التحكم وإدارة متجرك."
      highlights={highlights}
      dir="rtl"
      footer={
        <span>
          باستخدامك هذا النظام فأنت توافق على الشروط والأحكام وسياسات الخصوصية الخاصة بمنفذ آسيا.
        </span>
      }
    >
      {/* Back to home button */}
      <div className="flex justify-end mb-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l7-7M3 12l7 7" />
            <path d="M21 12H4" />
          </svg>
          العودة للصفحة الرئيسية
        </Link>
      </div>
      {/* Elegant header accent */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-px w-12 bg-gradient-to-l from-transparent via-gray-300 to-transparent" />
        <div className="px-3 py-1 rounded-full bg-white/60 shadow-sm border border-gray-200 backdrop-blur-sm text-xs text-gray-600">
          دخول آمن ومشفّر
        </div>
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 space-y-6"
        aria-describedby={errors.root ? 'login-error' : undefined}
      >
        <div className="modern-radio-group rounded-xl bg-gray-50/60 p-2 border border-gray-200">
          <label className="modern-radio-label">
            <input type="radio" value="password" defaultChecked {...register('method')} className="modern-radio-input" />
            <span className="px-2">كلمة المرور</span>
          </label>
          <label className="modern-radio-label">
            <input type="radio" value="social" {...register('method')} className="modern-radio-input" />
            <span className="px-2">تسجيل اجتماعي</span>
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
            className="modern-input"
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
            <div className="relative">
              <Input
                id="password"
                type={showPwd ? 'text' : 'password'}
                dir="rtl"
                className="modern-input pr-10"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute inset-y-0 right-3 my-auto p-0 text-gray-400 hover:text-gray-600 bg-transparent"
                onClick={() => setShowPwd((s) => !s)}
                title={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPwd ? (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.58-1.31 1.39-2.5 2.39-3.54M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
                    <path d="M1 1l22 22" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </Button>
            </div>
          </AuthFormField>
        )}

        {method === 'social' && (
          <div className="flex gap-2">
            {googleEnabled && (
              <Button type="button" onClick={() => handleSocial('google')} className="modern-social-btn flex-1 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            )}
            {facebookEnabled && (
              <Button type="button" onClick={() => handleSocial('facebook')} className="modern-social-btn flex-1 bg-[#1877F2] text-white hover:brightness-105">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            )}
            {appleEnabled && (
              <Button type="button" onClick={() => handleSocial('apple')} className="modern-social-btn flex-1 bg-black text-white hover:brightness-110">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </Button>
            )}
          </div>
        )}

        {errors.root ? (
          <div
            id="login-error"
            role="alert"
            className="modern-error"
          >
            {errors.root.message}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot" className="modern-link">نسيت كلمة المرور؟</Link>
          <span className="text-gray-500">يدعم النظام الأحرف العربية والإنجليزية</span>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`ui-btn--lg w-full ${isSubmitting ? 'modern-loading' : ''}`}
          >
            {isSubmitting ? '' : 'تسجيل الدخول'}
          </Button>
        </div>
      </form>

      <div className="text-center text-sm text-gray-600 mt-6">
        <p>
          لا تمتلك حسابًا حتى الآن؟
          <Link to="/register" className="mr-2 modern-link">
            إنشاء حساب جديد
          </Link>
        </p>
        <p className="mt-2 text-xs text-gray-500">
          باستخدامك هذا النظام فأنت توافق على الشروط والأحكام وسياسات الخصوصية الخاصة بمنفذ آسيا.
        </p>
        {/* trust badges */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm">
            <i className="ri-shield-check-line text-emerald-600" />
            SSL 256-bit
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm">
            <i className="ri-lock-2-line text-blue-600" />
            التحقق بخطوتين
          </span>
        </div>
      </div>
    </AuthShell>
  );
};

// legacy styles removed; now using Tailwind classes

export default LoginPage;

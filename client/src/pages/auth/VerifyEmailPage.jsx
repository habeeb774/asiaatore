import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api/client';
import AuthShell from '../../components/features/auth/AuthShell.jsx';
import { cn } from '../../lib/utils.js';

const VerifyEmailPage = () => {
  const [sp] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = sp.get('token');
    const email = sp.get('email');
    if (!token || !email) {
      setStatus('error');
      setMsg('بيانات مفقودة أو رابط غير صالح.');
      return;
    }
    (async () => {
      try {
        const r = await api.authVerifyEmailConfirm(token, email);
        if (r.ok) {
          setStatus('ok');
          setMsg('تم تفعيل بريدك الإلكتروني بنجاح. يمكنك الآن تسجيل الدخول.');
        } else {
          setStatus('error');
          setMsg(r.error || 'فشل التفعيل. قد يكون الرابط منتهي الصلاحية.');
        }
      } catch (e) {
        setStatus('error');
        setMsg(e.message || 'حدث خطأ غير متوقع.');
      }
    })();
  }, [sp]);

  const boxBaseClass = "p-4 rounded-lg text-sm font-medium text-center";
  const boxStatusClass = cn({
    [boxBaseClass]: true,
    'bg-success/10 text-success-dark': status === 'ok',
    'bg-danger/10 text-danger-dark': status === 'error',
    'bg-blue-500/10 text-blue-700': status === 'loading',
  });

  return (
    <AuthShell>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-text mb-4">تأكيد البريد الإلكتروني</h1>
        <div className={boxStatusClass}>
          {msg || (status === 'loading' ? '...جاري التحقق من الرابط' : '')}
        </div>
        <p className="text-sm text-center text-text-faint mt-6">
          <Link to="/login" className="text-primary hover:underline font-semibold">
            العودة إلى صفحة تسجيل الدخول
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default VerifyEmailPage;

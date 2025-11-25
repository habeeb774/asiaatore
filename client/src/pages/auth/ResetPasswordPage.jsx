import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api/client';
import AuthShell from '../../components/features/auth/AuthShell.jsx'; // Path fix

const ResetPasswordPage = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const emailQ = sp.get('email') || '';
  const tokenQ = sp.get('token') || '';
  const [email, setEmail] = useState(emailQ);
  const [token, setToken] = useState(tokenQ);
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailQ) setEmail(emailQ);
    if (tokenQ) setToken(tokenQ);
  }, [emailQ, tokenQ]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr(null); setOk(false);
    if (!email.trim() || !token.trim() || !pwd) { setErr('أكمل الحقول'); return; }
    if (pwd !== confirm) { setErr('كلمتا المرور غير متطابقتين'); return; }
    try {
      setLoading(true);
      const r = await api.authResetWithToken(email.trim(), token.trim(), pwd);
      if (r.ok) {
        setOk(true);
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } else {
        setErr(r.error || 'فشل التعيين');
      }
    } catch (e2) { setErr(e2.message || 'خطأ'); }
    finally { setLoading(false); }
  };

  const baseInputClass = "w-full p-3 border border-border rounded-lg bg-bg-alt focus:ring-2 focus:ring-primary outline-none transition";

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-center text-text mb-4">إعادة تعيين كلمة المرور</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input id="reset-email" name="email" autoComplete="email" className={baseInputClass} placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} />
        <input id="reset-token" name="token" className={baseInputClass} placeholder="رمز التحقق" value={token} onChange={e => setToken(e.target.value)} />
        <input id="reset-password" name="new-password" autoComplete="new-password" className={baseInputClass} type="password" placeholder="كلمة المرور الجديدة" value={pwd} onChange={e => setPwd(e.target.value)} />
        <input id="reset-password-confirm" name="new-password-confirm" autoComplete="new-password" className={baseInputClass} type="password" placeholder="تأكيد كلمة المرور" value={confirm} onChange={e => setConfirm(e.target.value)} />
        
        {err && <div className="p-3 rounded-lg text-sm font-medium bg-danger/10 text-danger">{err}</div>}
        {ok && <div className="p-3 rounded-lg text-sm font-medium bg-success/10 text-success">تم التعيين بنجاح. جاري توجيهك...</div>}
        
        <button type="submit" className="w-full p-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-alt transition disabled:opacity-70" disabled={loading}>
          {loading ? '...جاري التنفيذ' : 'تعيين كلمة المرور'}
        </button>
        
        <p className="text-xs text-center text-text-faint mt-2">
          تذكرت كلمة المرور؟ <Link to="/login" className="text-primary hover:underline font-medium">تسجيل الدخول</Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default ResetPasswordPage;

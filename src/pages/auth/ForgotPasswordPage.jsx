import React, { useState } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim()) return setError('أدخل البريد');
    try {
      setLoading(true);
      const r = await api.authForgot(email.trim());
      if (r.ok) setSent(true); else setError(r.error || 'فشل الإرسال');
    } catch (e2) {
      setError(e2.message || 'خطأ غير متوقع');
    } finally { setLoading(false); }
  };

  return (
    <div style={{direction:'rtl',display:'flex',justifyContent:'center',padding:'2rem'}}>
      <form onSubmit={submit} style={form}>
        <h1 style={h1}>استرجاع كلمة المرور</h1>
        <p style={p}>أدخل بريدك لإرسال رابط/رمز إعادة التعيين (محاكاة).</p>
        <input style={inp} type="email" placeholder="example@mail.com" value={email} onChange={e=>setEmail(e.target.value)} />
        {error && <div style={err}>{error}</div>}
        {sent && <div style={ok}>تم إرسال رابط (وهمي) إن كان البريد مسجلاً.</div>}
        <button type="submit" style={btn} disabled={loading}>{loading? '...إرسال' : 'إرسال رابط'}</button>
        <p style={{fontSize:'.65rem',margin:'0.75rem 0 0'}}>تذكرت؟ <Link to="/login">عودة لتسجيل الدخول</Link></p>
      </form>
    </div>
  );
};

const form = {background:'#fff',padding:'1.5rem 1.4rem 2rem',border:'1px solid #e2e8f0',borderRadius:18,display:'flex',flexDirection:'column',gap:'.65rem',width:'100%',maxWidth:420,boxShadow:'0 8px 34px -12px rgba(0,0,0,.15)'};
const h1 = {margin:0,fontSize:'1.25rem',fontWeight:700};
const p = {margin:0,fontSize:'.65rem',color:'#475569'};
const inp = {padding:'.65rem .85rem',border:'1px solid #e2e8f0',borderRadius:12,fontSize:'.8rem'};
const btn = {padding:'.7rem 1rem',border:0,borderRadius:12,background:'linear-gradient(90deg,#69be3c,#f6ad55)',color:'#fff',fontSize:'.8rem',fontWeight:600,cursor:'pointer'};
const err = {background:'#fee2e2',color:'#b91c1c',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};
const ok = {background:'#dcfce7',color:'#166534',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};

export default ForgotPasswordPage;
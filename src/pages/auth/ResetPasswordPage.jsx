import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

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

  useEffect(()=>{ if (emailQ) setEmail(emailQ); if (tokenQ) setToken(tokenQ); }, [emailQ, tokenQ]);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setErr(null); setOk(false);
    if (!email.trim() || !token.trim() || !pwd) { setErr('أكمل الحقول'); return; }
    if (pwd !== confirm) { setErr('كلمتا المرور غير متطابقتين'); return; }
    try {
      setLoading(true);
      const r = await api.authResetWithToken(email.trim(), token.trim(), pwd);
      if (r.ok) { setOk(true); setTimeout(()=> navigate('/login', { replace:true }), 1200); }
      else setErr(r.error || 'فشل التعيين');
    } catch (e2) { setErr(e2.message || 'خطأ'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{direction:'rtl',display:'flex',justifyContent:'center',padding:'2rem'}}>
      <form onSubmit={submit} style={card}>
        <h1 style={h1}>إعادة تعيين كلمة المرور</h1>
  <input id="reset-email" name="email" autoComplete="email" style={inp} placeholder="البريد" value={email} onChange={e=>setEmail(e.target.value)} />
  <input id="reset-token" name="token" style={inp} placeholder="رمز التحقق" value={token} onChange={e=>setToken(e.target.value)} />
  <input id="reset-password" name="new-password" autoComplete="new-password" style={inp} type="password" placeholder="كلمة المرور الجديدة" value={pwd} onChange={e=>setPwd(e.target.value)} />
  <input id="reset-password-confirm" name="new-password-confirm" autoComplete="new-password" style={inp} type="password" placeholder="تأكيد كلمة المرور" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        {err && <div style={errBox}>{err}</div>}
        {ok && <div style={okBox}>تم التعيين بنجاح</div>}
        <button type="submit" style={btn} disabled={loading}>{loading? '...تنفيذ' : 'تعيين'}</button>
        <p style={{fontSize:'.65rem',marginTop:'.5rem'}}>تذكرت؟ <Link to="/login">الدخول</Link></p>
      </form>
    </div>
  );
};

const card = {background:'#fff',padding:'1.5rem 1.4rem 2rem',border:'1px solid #e2e8f0',borderRadius:18,display:'flex',flexDirection:'column',gap:'.65rem',width:'100%',maxWidth:420,boxShadow:'0 8px 34px -12px rgba(0,0,0,.15)'};
const h1 = {margin:0,fontSize:'1.25rem',fontWeight:700};
const inp = {padding:'.65rem .85rem',border:'1px solid #e2e8f0',borderRadius:12,fontSize:'.8rem'};
const btn = {padding:'.7rem 1rem',border:0,borderRadius:12,background:'linear-gradient(90deg,#69be3c,#f6ad55)',color:'#fff',fontSize:'.8rem',fontWeight:600,cursor:'pointer'};
const errBox = {background:'#fee2e2',color:'#b91c1c',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};
const okBox = {background:'#dcfce7',color:'#166534',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};

export default ResetPasswordPage;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) return setError('أدخل البريد وكلمة المرور');
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين');
    try {
      setLoading(true);
      const res = await api.authRegister(email.trim(), password, name.trim());
      if (res.ok) {
        navigate('/login', { replace: true, state: { justRegistered: true } });
      } else {
        setError(res.error === 'EMAIL_EXISTS' ? 'البريد مستخدم بالفعل' : (res.error || 'فشل التسجيل'));
      }
    } catch (e2) {
      setError(e2.message || 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{direction:'rtl',display:'flex',justifyContent:'center',padding:'2rem'}}>
      <form onSubmit={submit} style={form}>
        <h1 style={h1}>إنشاء حساب</h1>
        <input style={inp} placeholder="الاسم" value={name} onChange={e=>setName(e.target.value)} />
        <input style={inp} type="email" placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)} />
        <input style={inp} type="password" placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)} />
        <input style={inp} type="password" placeholder="تأكيد كلمة المرور" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        {error && <div style={err}>{error}</div>}
        <button type="submit" style={btn} disabled={loading}>{loading? '...جاري' : 'تسجيل'}</button>
        <p style={{fontSize:'.65rem',margin:'0.75rem 0 0'}}>لديك حساب؟ <Link to="/login">دخول</Link></p>
      </form>
    </div>
  );
};

const form = {background:'#fff',padding:'1.5rem 1.4rem 2rem',border:'1px solid #e2e8f0',borderRadius:18,display:'flex',flexDirection:'column',gap:'.65rem',width:'100%',maxWidth:420,boxShadow:'0 8px 34px -12px rgba(0,0,0,.15)'};
const h1 = {margin:0,fontSize:'1.3rem',fontWeight:700};
const inp = {padding:'.65rem .85rem',border:'1px solid #e2e8f0',borderRadius:12,fontSize:'.8rem'};
const btn = {padding:'.7rem 1rem',border:0,borderRadius:12,background:'linear-gradient(90deg,#69be3c,#f6ad55)',color:'#fff',fontSize:'.8rem',fontWeight:600,cursor:'pointer'};
const err = {background:'#fee2e2',color:'#b91c1c',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};

export default RegisterPage;

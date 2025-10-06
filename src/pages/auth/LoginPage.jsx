import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const inputStyle = {
  padding: '.65rem .85rem',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  fontSize: '.85rem',
  background: '#fff',
  width: '100%',
  outline: 'none'
};
const btnStyle = {
  padding: '.7rem 1rem',
  border: 0,
  borderRadius: 12,
  background: 'linear-gradient(90deg,#69be3c,#f6ad55)',
  color: '#fff',
  fontSize: '.8rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.4rem'
};
const subtleBtn = { ...btnStyle, background: '#f1f5f9', color: '#334155' };
const pageWrap = {
  direction: 'rtl',
  minHeight: 'calc(100vh - 120px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem'
};
const card = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: '1.75rem 1.5rem 2rem',
  boxShadow: '0 10px 40px -18px rgba(0,0,0,.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem'
};

const LoginPage = () => {
  const { login, devLoginAs } = useAuth() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state && location.state.from) || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) {
      setError('الرجاء إدخال البريد وكلمة المرور');
      return;
    }
    try {
      setLoading(true);
      const r = await login(email.trim(), password);
      if (r.ok) {
        navigate(redirectTo, { replace: true });
      } else {
        setError(r.error === 'INVALID_LOGIN' ? 'بيانات دخول خاطئة' : (r.error || 'فشل تسجيل الدخول'));
      }
    } catch (err) {
      setError(err.message || 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const quickAdmin = async () => {
    // Convenience: Pre-fill demo admin
    setEmail('admin@example.com');
    setPassword('Admin123!');
  };

  const devAssumeAdmin = () => {
    if (devLoginAs) devLoginAs('admin');
    navigate('/admin');
  };

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={{display:'flex',flexDirection:'column',gap:'.35rem'}}>
          <h1 style={{margin:0,fontSize:'1.35rem',fontWeight:700}}>تسجيل الدخول</h1>
          <p style={{margin:0,fontSize:'.7rem',color:'#64748b'}}>ادخل بيانات حسابك للوصول إلى المتجر ولوحة التحكم.</p>
        </div>
        <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'.9rem'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'.35rem'}}>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input
              style={inputStyle}
              type="email"
              autoComplete="email"
              placeholder="example@mail.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter') { e.currentTarget.form?.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true})); } }}
            />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'.35rem'}}>
            <label style={labelStyle}>كلمة المرور</label>
            <div style={{position:'relative'}}>
              <input
                style={{...inputStyle,paddingRight:'3.2rem'}}
                type={showPwd? 'text':'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e=>setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={()=>setShowPwd(s=>!s)}
                style={{position:'absolute',top:2.5,right:4,border:0,background:'transparent',cursor:'pointer',fontSize:'.6rem',color:'#475569'}}
                title={showPwd? 'إخفاء':'إظهار'}
              >{showPwd? 'إخفاء':'إظهار'}</button>
            </div>
          </div>
          {error && <div style={errBox}>{error}</div>}
          <button type="submit" style={btnStyle} disabled={loading}>{loading? '...جاري الدخول' : 'دخول'}</button>
        </form>
        <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
          <button type="button" onClick={quickAdmin} style={subtleBtn}>ملء بيانات الأدمن التجريبية</button>
          <button type="button" onClick={devAssumeAdmin} style={{...subtleBtn,background:'#fff8e1',border:'1px solid #fbbf24'}}>دخول فوري (محاكاة أدمن محلي)</button>
        </div>
        <p style={{ fontSize: '.7rem', margin:0 }}>
          ليس لديك حساب؟ <Link to="/register">إنشاء حساب</Link>
        </p>
      </div>
    </div>
  );
};

const labelStyle = { fontSize: '.6rem', fontWeight: 600, color: '#334155', letterSpacing: '.5px' };
const errBox = { background:'#fee2e2',color:'#b91c1c',padding:'.55rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5 };

export default LoginPage;

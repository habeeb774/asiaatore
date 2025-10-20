import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../api/client';

const VerifyEmailPage = () => {
  const [sp] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('');
  useEffect(()=>{
    const token = sp.get('token');
    const email = sp.get('email');
    if (!token || !email) { setStatus('error'); setMsg('بيانات مفقودة'); return; }
    (async ()=>{
      try {
        const r = await api.authVerifyEmailConfirm(token, email);
        if (r.ok) { setStatus('ok'); setMsg('تم تفعيل البريد بنجاح'); }
        else { setStatus('error'); setMsg(r.error || 'فشل التفعيل'); }
      } catch (e) { setStatus('error'); setMsg(e.message || 'خطأ'); }
    })();
  }, [sp]);
  return (
    <div style={{direction:'rtl',display:'flex',justifyContent:'center',padding:'2rem'}}>
      <div style={card}>
        <h1 style={h1}>تأكيد البريد</h1>
        <div style={status==='ok'? okBox : (status==='loading'? noteBox : errBox)}>
          {msg || (status==='loading' ? '...جاري التحقق' : '')}
        </div>
        <p style={{fontSize:'.75rem',marginTop:'.5rem'}}>
          <Link to="/login">العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
};

const card = {background:'#fff',padding:'1.5rem 1.4rem 2rem',border:'1px solid #e2e8f0',borderRadius:18,display:'flex',flexDirection:'column',gap:'.65rem',width:'100%',maxWidth:420,boxShadow:'0 8px 34px -12px rgba(0,0,0,.15)'};
const h1 = {margin:0,fontSize:'1.25rem',fontWeight:700};
const errBox = {background:'#fee2e2',color:'#b91c1c',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};
const okBox = {background:'#dcfce7',color:'#166534',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};
const noteBox = {background:'#fff8e1',color:'#92400e',padding:'.5rem .7rem',borderRadius:12,fontSize:'.65rem',lineHeight:1.5};

export default VerifyEmailPage;

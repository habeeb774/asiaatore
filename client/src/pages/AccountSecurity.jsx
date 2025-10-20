import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function AccountSecurity(){
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');

  async function load(){
    try {
      setLoading(true);
      const res = await api.request ? api.request('/auth/me') : fetch('/api/auth/me').then(r=>r.json());
      const data = res.ok ? res : await fetch('/api/auth/me').then(r=>r.json());
      if (!data.ok) throw new Error(data.error || 'LOAD_FAILED');
      setMe(data.user);
      setPhone(data.user?.phone || '');
    } catch(e){ setErr(e.message||'ERR'); }
    finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function savePhone(){
    try {
      setErr(null); setInfo('');
      const res = await fetch('/api/auth/me', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone }) });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || res.statusText);
      setInfo('تم حفظ رقم الهاتف');
      await load();
    } catch(e){ setErr(e.message||'فشل'); }
  }

  async function sendEmailVerify(){
    try {
      setErr(null); setInfo('');
      const res = await fetch('/api/auth/verify-email/request', { method:'POST' });
      const b = await res.json();
      if (!res.ok || !b.ok) throw new Error(b.error || res.statusText);
      setInfo('تم إرسال رابط التحقق للبريد (محاكاة)');
    } catch(e){ setErr(e.message||'فشل'); }
  }

  async function sendPhoneCode(){
    try {
      setErr(null); setInfo('');
      const res = await fetch('/api/auth/verify-phone/request', { method:'POST' });
      const b = await res.json();
      if (!res.ok || !b.ok) throw new Error(b.error || res.statusText);
      setInfo('تم إرسال رمز التحقق للهاتف (محاكاة)');
    } catch(e){ setErr(e.message||'فشل'); }
  }

  async function confirmPhone(){
    try {
      setErr(null); setInfo('');
      const res = await fetch('/api/auth/verify-phone/confirm', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code }) });
      const b = await res.json();
      if (!res.ok || !b.ok) throw new Error(b.error || res.statusText);
      setInfo('تم تأكيد الهاتف');
      await load();
    } catch(e){ setErr(e.message||'فشل'); }
  }

  if (loading) return <div style={wrap}>...تحميل</div>;
  if (err) return <div style={wrap}><div style={errBox}>{err}</div></div>;

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{margin:0,fontSize:'1.25rem',fontWeight:700}}>أمان الحساب</h1>
        {info && <div style={okBox}>{info}</div>}
        {err && <div style={errBox}>{err}</div>}

        <section style={section}>
          <h2 style={h2}>البريد الإلكتروني</h2>
          <p style={p}>البريد: <b>{me?.email}</b> — الحالة: {me?.emailVerifiedAt ? 'مُفعل' : 'غير مُفعل'}</p>
          {!me?.emailVerifiedAt && <button style={btn} onClick={sendEmailVerify}>إرسال رابط التحقق</button>}
        </section>

        <section style={section}>
          <h2 style={h2}>الهاتف</h2>
          <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
            <input style={inp} placeholder="05xxxxxxxx" value={phone} onChange={e=>setPhone(e.target.value)} />
            <button style={btnGhost} onClick={savePhone}>حفظ</button>
          </div>
          <p style={p}>الحالة: {me?.phoneVerifiedAt ? 'مُفعل' : 'غير مُفعل'}</p>
          {!me?.phoneVerifiedAt && (
            <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
              <button style={btn} onClick={sendPhoneCode}>إرسال رمز التحقق</button>
              <div style={{display:'flex',gap:'.5rem'}}>
                <input style={inp} placeholder="أدخل الرمز" value={code} onChange={e=>setCode(e.target.value)} />
                <button style={btn} onClick={confirmPhone}>تأكيد</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const wrap = {direction:'rtl',display:'flex',justifyContent:'center',padding:'2rem'};
const card = {background:'#fff',padding:'1.5rem',border:'1px solid #e2e8f0',borderRadius:18,display:'flex',flexDirection:'column',gap:'1rem',width:'100%',maxWidth:640,boxShadow:'0 8px 34px -12px rgba(0,0,0,.15)'};
const section = {borderTop:'1px solid #f1f5f9',paddingTop:'.75rem'};
const h2 = {margin:'0 0 .25rem',fontSize:'1rem'};
const p = {margin:0,fontSize:'.8rem',color:'#475569'};
const btn = {padding:'.6rem .9rem',border:0,borderRadius:12,background:'linear-gradient(90deg,#69be3c,#f6ad55)',color:'#fff',fontSize:'.8rem',fontWeight:600,cursor:'pointer'};
const btnGhost = {padding:'.55rem .85rem',border:'1px solid #e2e8f0',borderRadius:12,background:'#fff',color:'#334155',fontSize:'.8rem',fontWeight:600,cursor:'pointer'};
const inp = {padding:'.6rem .8rem',border:'1px solid #e2e8f0',borderRadius:12,fontSize:'.8rem'};
const errBox = {background:'#fee2e2',color:'#b91c1c',padding:'.5rem .7rem',borderRadius:12,fontSize:'.75rem',lineHeight:1.5};
const okBox = {background:'#dcfce7',color:'#166534',padding:'.5rem .7rem',borderRadius:12,fontSize:'.75rem',lineHeight:1.5};

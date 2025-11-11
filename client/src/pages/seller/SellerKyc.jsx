import React, { useEffect, useState } from 'react';
import api from '../../services/api/client';

export default function SellerKyc() {
  const [form, setForm] = useState({ companyName:'', crNumber:'', iban:'', bankName:'', addressText:'', documents:[], notes:'' });
  const [status, setStatus] = useState('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(()=>{
    (async () => {
      try {
        const res = await api.sellerProfileGet();
        if (res?.profile) {
          const p = res.profile;
          setForm({ companyName:p.companyName||'', crNumber:p.crNumber||'', iban:p.iban||'', bankName:p.bankName||'', addressText:p.addressText||'', documents: p.documents || [], notes:'' });
          setStatus(p.kycStatus || 'none');
        }
      } catch (e) { setError(e.message); }
    })();
  }, []);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...form };
      // documents field can be extended to real uploads; now we just send array of strings
      const res = await api.sellerProfileSubmit(payload);
      setStatus(res?.profile?.kycStatus || 'pending');
    } catch (e) { setError(e.data?.error || e.message); } finally { setBusy(false); }
  };
  return (
    <div className="container-custom p-4">
      <h2 className="text-xl font-bold mb-4">توثيق البائع (KYC)</h2>
      {status !== 'approved' && <div className="text-sm mb-3">الحالة الحالية: <strong>{status}</strong></div>}
      {status === 'rejected' && <div className="text-sm text-red-600 mb-2">تم الرفض — يرجى التعديل وإعادة الإرسال.</div>}
      {error && <div className="text-sm text-red-600 mb-2">خطأ: {String(error)}</div>}
      <form onSubmit={submit} className="grid gap-3 max-w-xl">
        <input className="border px-3 py-2" placeholder="اسم الشركة" value={form.companyName} onChange={e=>setForm(f=>({...f,companyName:e.target.value}))} />
        <input className="border px-3 py-2" placeholder="رقم السجل التجاري" value={form.crNumber} onChange={e=>setForm(f=>({...f,crNumber:e.target.value}))} />
        <input className="border px-3 py-2" placeholder="IBAN" value={form.iban} onChange={e=>setForm(f=>({...f,iban:e.target.value}))} />
        <input className="border px-3 py-2" placeholder="اسم البنك" value={form.bankName} onChange={e=>setForm(f=>({...f,bankName:e.target.value}))} />
        <textarea className="border px-3 py-2" placeholder="عنوان الشركة (وصف)" value={form.addressText} onChange={e=>setForm(f=>({...f,addressText:e.target.value}))} />
        <textarea className="border px-3 py-2" placeholder="ملاحظات" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
        <button className="btn-primary" disabled={busy || status==='approved'} type="submit">إرسال للمراجعة</button>
      </form>
      {status==='approved' && <div className="text-green-700 font-semibold mt-3">تمت الموافقة — شكراً لك.</div>}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AddressesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ label: '', name: '', phone: '', country: 'SA', city: '', district: '', street: '', building: '', apartment: '', notes: '', isDefault: false });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.addressesList();
      setItems(res.addresses || res.items || []);
    } catch (e) {
      setError(e.data?.error || e.message);
    } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.addressCreate(form);
      setForm({ label: '', name: '', phone: '', country: 'SA', city: '', district: '', street: '', building: '', apartment: '', notes: '', isDefault: false });
      await load();
    } catch (e) {
      setError(e.data?.error || e.message);
    } finally { setBusy(false); }
  };

  const setDefault = async (id) => {
    setBusy(true);
    try { await api.addressUpdate(id, { isDefault: true }); await load(); } catch (e) { setError(e.data?.error || e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!confirm('حذف العنوان؟')) return;
    setBusy(true);
    try { await api.addressDelete(id); await load(); } catch (e) { setError(e.data?.error || e.message); } finally { setBusy(false); }
  };

  return (
    <div className="container-custom p-4">
      <h2 className="text-xl font-bold mb-4">عناويني</h2>
      {error && <div className="text-sm text-red-600 mb-2">خطأ: {String(error)}</div>}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2">إضافة عنوان</h3>
          <form onSubmit={onSubmit} className="grid gap-2">
            <input className="border px-3 py-2" placeholder="عنوان مختصر (منزل/عمل)" value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} />
            <input className="border px-3 py-2" placeholder="الاسم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <input className="border px-3 py-2" placeholder="الهاتف" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border px-3 py-2" placeholder="الدولة" value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} />
              <input className="border px-3 py-2" placeholder="المدينة" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} />
            </div>
            <input className="border px-3 py-2" placeholder="الحي" value={form.district} onChange={e=>setForm(f=>({...f,district:e.target.value}))} />
            <input className="border px-3 py-2" placeholder="الشارع" value={form.street} onChange={e=>setForm(f=>({...f,street:e.target.value}))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border px-3 py-2" placeholder="المبنى" value={form.building} onChange={e=>setForm(f=>({...f,building:e.target.value}))} />
              <input className="border px-3 py-2" placeholder="الشقة" value={form.apartment} onChange={e=>setForm(f=>({...f,apartment:e.target.value}))} />
            </div>
            <textarea className="border px-3 py-2" placeholder="ملاحظات" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={e=>setForm(f=>({...f,isDefault:e.target.checked}))} />
              <span>تعيين كافتراضي</span>
            </label>
            <button className="btn-primary" disabled={busy} type="submit">حفظ</button>
          </form>
        </div>
        <div>
          <h3 className="font-semibold mb-2">العناوين المحفوظة</h3>
          {loading ? (
            <div>تحميل...</div>
          ) : (
            <ul className="space-y-3">
              {items.map(a => (
                <li key={a.id} className="border rounded p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold">{a.label || '—'} {a.isDefault && <span className="text-xs text-green-700">(افتراضي)</span>}</div>
                    <div className="flex gap-2">
                      {!a.isDefault && <button className="btn-secondary btn-xs" onClick={()=>setDefault(a.id)}>تعيين افتراضي</button>}
                      <button className="btn-danger btn-xs" onClick={()=>remove(a.id)}>حذف</button>
                    </div>
                  </div>
                  <div>{a.name} — {a.phone}</div>
                  <div>{a.country}، {a.city}، {a.district}</div>
                  <div>{a.street}، {a.building}، {a.apartment}</div>
                  {a.notes && <div className="text-gray-600">ملاحظات: {a.notes}</div>}
                </li>
              ))}
              {items.length === 0 && <li className="text-gray-500">لا توجد عناوين بعد</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

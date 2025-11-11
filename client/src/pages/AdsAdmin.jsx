import React, { useState, useEffect } from 'react';
import api from '../services/api/client';

const initialAd = { title: '', body: '', image: '', linkUrl: '', status: true };

export default function AdsAdmin() {
  const [ads, setAds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialAd);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    setLoading(true);
    try {
      const res = await api.listAds();
      setAds(res || []);
    } catch {}
    setLoading(false);
  }

  function handleEdit(ad) {
    setEditing(ad.id);
    setForm({ ...ad });
  }

  function handleChange(e) {
    const { name, type, value, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // Map frontend fields to backend Ad model
      const mapped = {
        title: form.title,
        description: form.body,
        image: form.image,
        link: form.linkUrl,
        active: form.status
      };
      if (editing) {
        await api.updateAd(editing, mapped);
      } else {
        await api.createAd(mapped);
      }
      setEditing(null);
      setForm(initialAd);
      fetchAds();
    } catch {}
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف الإعلان؟')) return;
    setLoading(true);
    try {
      await api.deleteAd(id);
      fetchAds();
    } catch {}
    setLoading(false);
  }

  return (
    <div className="ads-admin p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">إدارة الإعلانات</h2>
      <form onSubmit={handleSave} className="space-y-3 mb-6">
        <input name="title" value={form.title} onChange={handleChange} placeholder="عنوان الإعلان" className="w-full p-2 border rounded" required />
        <textarea name="body" value={form.body} onChange={handleChange} placeholder="وصف الإعلان" className="w-full p-2 border rounded" />
        <input name="image" value={form.image} onChange={handleChange} placeholder="رابط الصورة" className="w-full p-2 border rounded" required />
        <input name="linkUrl" value={form.linkUrl} onChange={handleChange} placeholder="رابط إضافي (اختياري)" className="w-full p-2 border rounded" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="status" checked={form.status} onChange={handleChange} />
          <span>مفعل</span>
        </label>
        <button type="submit" className="btn-primary px-4 py-2">{editing ? 'تعديل' : 'إضافة'} إعلان</button>
        {editing && <button type="button" className="btn-secondary px-4 py-2 ml-2" onClick={() => { setEditing(null); setForm(initialAd); }}>إلغاء</button>}
      </form>
      <div className="ads-list space-y-4">
        {loading && <div>جاري التحميل...</div>}
        <table className="w-full border rounded mb-4 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">#</th>
              <th className="p-2">الصورة</th>
              <th className="p-2">العنوان</th>
              <th className="p-2">الوصف</th>
              <th className="p-2">الرابط</th>
              <th className="p-2">الحالة</th>
              <th className="p-2">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad, idx) => (
              <tr key={ad.id} className="border-b">
                <td className="p-2 text-center">{idx+1}</td>
                <td className="p-2"><img src={ad.image} alt="" className="w-16 h-16 object-cover rounded" /></td>
                <td className="p-2 font-bold">{ad.title}</td>
                <td className="p-2">{ad.description}</td>
                <td className="p-2">{ad.link && <a href={ad.link} className="text-blue-600" target="_blank" rel="noopener noreferrer">رابط</a>}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs ${ad.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{ad.active ? 'مفعل' : 'غير مفعل'}</span>
                  <button className="btn-secondary px-2 py-1 ml-2" onClick={async () => { await api.updateAd(ad.id, { active: !ad.active }); fetchAds(); }}>{ad.active ? 'تعطيل' : 'تفعيل'}</button>
                </td>
                <td className="p-2">
                  <button className="btn-secondary px-2 py-1 mr-1" onClick={() => handleEdit({
                    id: ad.id,
                    title: ad.title,
                    body: ad.description,
                    image: ad.image,
                    linkUrl: ad.link,
                    status: ad.active
                  })}>تعديل</button>
                  <button className="btn-danger px-2 py-1" onClick={() => handleDelete(ad.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && ads.length === 0 && <div>لا توجد إعلانات بعد.</div>}
      </div>
    </div>
  );
}

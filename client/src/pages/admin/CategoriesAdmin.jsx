import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/features/admin/AdminLayout';
import api from '../../services/api/client';
import { Button } from '../../components/ui';
import Seo from '../../components/Seo';

export default function CategoriesAdmin() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.listCategories({ withCounts: 1 });
      setCats(res.categories || res || []);
    } catch (e) { setError(e.message || 'فشل التحميل'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm('حذف التصنيف؟')) return;
    try {
      await api.categoryDelete(id);
      await load();
    } catch (e) { alert('فشل الحذف: '+e.message); }
  };

  return (
    <AdminLayout title="إدارة التصنيفات">
      <Seo title="إدارة التصنيفات" />
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Button variant="ghost" onClick={load}>تحديث</Button>
          {loading && <span>...تحميل</span>}
          {error && <span style={{ color:'#b91c1c' }}>{error}</span>}
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr><th>الاسم</th><th>Slug</th><th>المنتجات</th><th>إجراءات</th></tr></thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id}>
                <td>{(c.name?.ar || c.name?.en) || c.slug}</td>
                <td style={{ fontSize: '.8rem' }}>{c.slug}</td>
                <td>{c.productCount || 0}</td>
                <td>
                  <Button as="a" href={`/admin/categories?edit=${c.id}`} size="sm" variant="ghost">تعديل</Button>
                  <Button size="sm" variant="danger" onClick={()=>del(c.id)}>حذف</Button>
                </td>
              </tr>
            ))}
            {!cats.length && !loading && <tr><td colSpan={4} style={{ padding: 12 }}>لا توجد تصنيفات</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

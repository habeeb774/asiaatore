import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/features/admin/AdminLayout';
import { adminApi } from '../../services/api/admin';
import { Button } from '../../components/ui';
import Seo from '../../components/Seo';
import { KpiCard } from '../../components/features/admin/KpiCard';

export default function SellersList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.listUsers({ page, pageSize });
      // filter by seller role
      const list = (res?.users || res || []).filter(u => u.role === 'seller');
      setSellers(list);
      setTotal(res?.total || list.length);
    } catch (e) { setError(e.message || 'Failed to load sellers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, pageSize]);

  const onToggleActive = async (u) => {
    try {
      if (u.active) await adminApi.deactivateUser(u.id); else await adminApi.activateUser(u.id);
      await load();
    } catch (e) { alert(e.message || 'Failed'); }
  };

  const kpis = useMemo(() => ({ total: total, active: sellers.filter(s => s.active).length }), [sellers, total]);

  return (
    <AdminLayout title="إدارة البائعين">
      <Seo title="إدارة البائعين" />
      <div style={{ padding: 12 }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>قائمة البائعين</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginTop: 12 }}>
          <KpiCard label="إجمالي البائعين" value={kpis.total} />
          <KpiCard label="البائعون النشطون" value={kpis.active} />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <Button variant="ghost" onClick={load}>تحديث</Button>
            <Button as="a" href="/admin/sellers/kyc" variant="outline" size="sm">مراجعة KYC</Button>
            {loading && <span style={{ fontSize: '.8rem', color: '#64748b' }}>...تحميل</span>}
            {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8 }}>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>البريد</th>
                <th>الدور</th>
                <th>الحالة</th>
                <th>التواصل</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(s => (
                <tr key={s.id}>
                  <td>{s.name || '—'}</td>
                  <td style={{ fontSize: '.9rem' }}>{s.email}</td>
                  <td>{s.role}</td>
                  <td>{s.active ? 'مفعل' : 'موقوف'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>
                    <Button size="sm" variant="ghost" onClick={() => onToggleActive(s)}>{s.active ? 'إيقاف' : 'تفعيل'}</Button>
                    <Button size="sm" variant="outline" as="a" href={`/admin/sellers/kyc?userId=${s.id}`}>KYC</Button>
                  </td>
                </tr>
              ))}
              {!sellers.length && !loading && (
                <tr><td colSpan={6} style={{ padding: 12 }}>لا توجد بائعين</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))}>السابق</Button>
            <div style={{ alignSelf: 'center' }}>صفحة {page}</div>
            <Button variant="ghost" onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

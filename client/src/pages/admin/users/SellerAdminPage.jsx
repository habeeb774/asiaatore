import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import { adminApi } from '../../../services/api/admin';
import { Button, Input, Select } from '../../../components/ui';
import Seo from '../../../components/Seo';
import { KpiCard } from '../../../components/features/admin/KpiCard';
import { useToast } from '../../../components/ui/ToastProvider';

export default function SellerAdminPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.listUsers({ 
        page, 
        pageSize, 
        role: 'seller',
        search: searchTerm,
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
        sort: sortConfig.key,
        order: sortConfig.direction === 'ascending' ? 'asc' : 'desc',
      });
      const list = (res?.users || res || []);
      setSellers(list);
      setTotal(res?.total || list.length);
    } catch (e) { 
      const msg = e.message || 'Failed to load sellers';
      setError(msg); 
      push(msg, { type: 'error' });
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, pageSize, searchTerm, statusFilter, sortConfig]);

  const onToggleActive = async (u) => {
    try {
      if (u.active) await adminApi.deactivateUser(u.id); else await adminApi.activateUser(u.id);
      push(`User ${u.active ? 'deactivated' : 'activated'} successfully.`, { type: 'success' });
      await load();
    } catch (e) { 
      const msg = e.message || 'Failed';
      push(msg, { type: 'error' });
    }
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <Button variant="ghost" onClick={load} disabled={loading}>تحديث</Button>
            <Button as="a" href="/admin/sellers/kyc" variant="outline" size="sm">مراجعة KYC</Button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
              <Input 
                placeholder="...ابحث بالاسم أو البريد"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ minWidth: '200px' }}
              />
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </Select>
            </div>
            {loading && <span style={{ fontSize: '.8rem', color: '#64748b' }}>...تحميل</span>}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8 }}>
            <thead>
              <tr>
                <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>الاسم{getSortIndicator('name')}</th>
                <th onClick={() => requestSort('email')} style={{ cursor: 'pointer' }}>البريد{getSortIndicator('email')}</th>
                <th>الدور</th>
                <th onClick={() => requestSort('active')} style={{ cursor: 'pointer' }}>الحالة{getSortIndicator('active')}</th>
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

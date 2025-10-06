import React from 'react';
import Seo from '../../components/Seo';
import api from '../../api/client';

const Customers = () => {
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.adminUsersList();
      const list = res?.users || [];
      setUsers(list);
    } catch (e) {
      setError(e.message || 'FAILED_USERS_LIST');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
    }
    if (role) list = list.filter(u => (u.role||'') === role);
    // status placeholder: if we add active flag later
    if (from) {
      const d = new Date(from); if (!isNaN(d)) list = list.filter(u => new Date(u.createdAt) >= d);
    }
    if (to) {
      const d = new Date(to); if (!isNaN(d)) { d.setHours(23,59,59,999); list = list.filter(u => new Date(u.createdAt) <= d); }
    }
    return list;
  }, [users, search, role, from, to]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const roleOptions = [
    { value:'user', label:'مستخدم' },
    { value:'admin', label:'مدير' },
    { value:'seller', label:'بائع' },
  ];

  const updateRole = async (id, newRole) => {
    try {
      await api.adminUserUpdate(id, { role: newRole });
      setUsers(list => list.map(u => u.id===id ? { ...u, role: newRole } : u));
    } catch (e) { alert('فشل تحديث الدور: ' + e.message); }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('حذف هذا المستخدم نهائياً؟')) return;
    try {
      await api.adminUserDelete(id);
      setUsers(list => list.filter(u => u.id !== id));
    } catch (e) { alert('فشل حذف المستخدم: ' + e.message); }
  };

  const exportCsv = () => {
    const header = ['id','name','email','role','createdAt'];
    const rows = filtered.map(u => [u.id, u.name||'', u.email||'', u.role||'', u.createdAt]);
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='customers.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page-wrapper">
      <Seo title="العملاء | Customers" description="Customers management" />
      <h1 className="page-title">العملاء / Customers</h1>
      <p className="muted">إدارة العملاء (Placeholder). سيتم ربط البيانات والإجراءات لاحقاً.</p>

      {/* Filters (placeholder only) */}
      <div style={{ marginTop:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <input
          type="search"
          placeholder="بحث بالاسم أو البريد…"
          value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(1); }}
          style={{ padding:'8px 10px', border:'1px solid #ddd', borderRadius:6, minWidth:240 }}
        />
        <label>الدور:
          <select value={role} onChange={e=>{ setRole(e.target.value); setPage(1); }} style={{ marginInlineStart:8 }}>
            <option value="">الكل</option>
            <option value="user">مستخدم</option>
            <option value="admin">مدير</option>
            <option value="seller">بائع</option>
          </select>
        </label>
        {/* الحالة Placeholder لاحقاً عند إضافة active */}
        <label>من: <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setPage(1); }} /></label>
        <label>إلى: <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setPage(1); }} /></label>
        <div style={{ marginInlineStart:'auto', display:'flex', gap:8 }}>
          <button className="btn" onClick={load} disabled={loading} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>{loading?'جاري التحديث…':'تحديث'}</button>
          <button className="btn" onClick={exportCsv} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تصدير CSV</button>
        </div>
      </div>

      {/* KPI cards (placeholder) */}
      <div className="cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginTop:16 }}>
        {[
          { label:'إجمالي العملاء', value:String(users.length) },
          { label:'العملاء النشطون', value:'—' },
          { label:'عدد المدراء', value:String(users.filter(u=>u.role==='admin').length) },
          { label:'مسجّلون هذا الشهر', value:String(users.filter(u=> new Date(u.createdAt).getMonth()===new Date().getMonth() && new Date(u.createdAt).getFullYear()===new Date().getFullYear()).length) },
        ].map((c,i) => (
          <div key={i} className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
            <div className="muted">{c.label}</div>
            <div style={{ fontSize:24, fontWeight:700 }}>{c.value}</div>
            <div className="muted" style={{ fontSize:12 }}>Placeholder</div>
          </div>
        ))}
      </div>

      {/* Table area (placeholder) */}
      <div className="card" style={{ padding:0, border:'1px solid #eee', borderRadius:8, marginTop:16, overflow:'hidden' }}>
        <div style={{ padding:12, borderBottom:'1px solid #eee', background:'#fafafa' }}>
          <strong>قائمة العملاء</strong>
        </div>
        <div style={{ padding:12 }}>
          {error && <div className="error" style={{ marginBottom:8 }}>{String(error)}</div>}
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ textAlign:'start' }}>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>الاسم</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>البريد</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>الدور</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>تاريخ الانضمام</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0', textAlign:'end' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="muted" style={{ padding:'16px', textAlign:'center' }}>جاري التحميل…</td></tr>
              ) : pageItems.length ? (
                pageItems.map(u => (
                  <tr key={u.id}>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>{u.name || '—'}</td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>{u.email}</td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>
                      <select value={u.role} onChange={e=>updateRole(u.id, e.target.value)}>
                        {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8', textAlign:'end' }}>
                      <button className="btn" onClick={()=>deleteUser(u.id)} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>حذف</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="muted" style={{ padding:'16px', textAlign:'center' }}>لا نتائج</td></tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
            <div className="muted">إجمالي: {total} | الصفحة {pageSafe} من {totalPages}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={pageSafe<=1} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>السابق</button>
              <button className="btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={pageSafe>=totalPages} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>التالي</button>
              <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}/صفحة</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Customers;

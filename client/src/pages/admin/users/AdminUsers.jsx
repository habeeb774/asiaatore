import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import adminApi from '../../../services/api/admin';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import { Button } from '../../../components/ui';

const searchInput = { padding: '.55rem .75rem', border: '1px solid #e2e8f0', borderRadius: 10, minWidth: 160, fontSize: '.8rem', background: '#fff' };
const table = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 14px -6px rgba(0,0,0,.06)' };
const tdActions = { display: 'flex', gap: '.35rem', alignItems: 'center' };
const emptyCell = { textAlign: 'center', padding: '1rem', fontSize: '.75rem', color: '#64748b' };

export default function AdminUsers() {
  const { user } = useAuth() || {};
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState('');
  const [role, setRole] = useState(''); // '', 'user', 'seller', 'delivery', 'admin'
  const [staffOnly, setStaffOnly] = useState(true); // hide customers by default
  const [active, setActive] = useState(''); // '', '1', '0'

  const [form, setForm] = useState({ id:null, name:'', email:'', phone:'', role:'admin', active:true, password:'', sendInvite:true });
  const [saving, setSaving] = useState(false);

  const canNext = page * pageSize < (Math.max(total, 0));
  const canPrev = page > 1;

  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.listUsers({ page: 1, pageSize });
  const list = Array.isArray(res) ? res : (res?.users || []);
      setUsers(list);
  setTotal(list.length);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter(u => {
      if (staffOnly && u.role === 'user') return false;
      if (needle && !((u.name||'').toLowerCase().includes(needle) || (u.email||'').toLowerCase().includes(needle) || (u.phone||'').toLowerCase().includes(needle))) return false;
      if (role && u.role !== role) return false;
      if (active === '1' && u.active === false) return false;
      if (active === '0' && (u.active !== false)) return false;
      return true;
    });
  }, [users, q, role, active, staffOnly]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visible.slice(start, start + pageSize);
  }, [visible, page, pageSize]);

  const resetForm = () => setForm({ id:null, name:'', email:'', phone:'', role:'admin', active:true, password:'', sendInvite:true });

  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      if (form.id) {
        const patch = { name: form.name, role: form.role, phone: form.phone };
        const res = await adminApi.updateUser(form.id, patch);
        const updated = res?.user || res;
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      } else {
        const payload = { email: form.email, name: form.name || null, phone: form.phone || null, role: form.role, sendInvite: !!form.sendInvite };
        if (!payload.sendInvite) payload.password = form.password;
        const res = await adminApi.createUser(payload);
        const created = res?.user || res;
        setUsers(prev => [{ ...created, active: true }, ...prev]);
      }
      resetForm();
      await fetchUsers();
    } catch (e2) {
      setError(e2.message);
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('حذف المستخدم؟')) return;
    try { await adminApi.deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); } catch (e) { alert('فشل الحذف: ' + e.message); }
  };

  const activate = async (u, flag) => {
    try {
      if (flag) await adminApi.activateUser(u.id); else await adminApi.deactivateUser(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !!flag } : x));
    } catch (e) { alert('فشل العملية: ' + e.message); }
  };

  if (!isAdmin) {
    return (
      <div style={{direction:'rtl',padding:'2rem',maxWidth:520,margin:'2rem auto',background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,boxShadow:'0 6px 28px -8px rgba(0,0,0,.12)'}}>
        <h2 style={{marginTop:0,fontSize:'1.1rem'}}>🚫 صلاحيات غير كافية</h2>
        <p style={{fontSize:'.75rem',lineHeight:1.7,color:'#475569'}}>هذه الصفحة متاحة للمدير فقط.</p>
        <a href="/" style={{display:'inline-block',marginTop:12,fontSize:'.7rem',fontWeight:600,color:'#69be3c',textDecoration:'none'}}>العودة للرئيسية</a>
      </div>
    );
  }

  return (
    <AdminLayout title="إدارة المستخدمين">
      <div style={{ padding: '1.25rem 0', fontSize: '.85rem' }}>
        <h1 style={{ margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: 700 }}>إدارة المستخدمين</h1>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:12}}>
        <input placeholder="بحث (اسم/إيميل/هاتف)" value={q} onChange={e=>setQ(e.target.value)} style={searchInput} />
        <select value={role} onChange={e=>{ setRole(e.target.value); setPage(1); }} style={searchInput}>
          <option value="">كل الأدوار</option>
          <option value="user">مستخدم</option>
          <option value="seller">بائع</option>
          <option value="delivery">موصل</option>
          <option value="admin">مدير</option>
        </select>
        <label style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:'.8rem',padding:'.45rem .6rem',background:'#fff',border:'1px solid #e2e8f0',borderRadius:10}}>
          <input type="checkbox" checked={staffOnly} onChange={e=>{ setStaffOnly(e.target.checked); setPage(1); }} /> إظهار الطاقم فقط (مدراء/بائعين)
        </label>
        <select value={active} onChange={e=>{ setActive(e.target.value); setPage(1); }} style={searchInput}>
          <option value="">الكل</option>
          <option value="1">مفعل</option>
          <option value="0">موقوف</option>
        </select>
        <select value={pageSize} onChange={e=>{ setPageSize(+e.target.value||20); setPage(1); }} style={searchInput}>
          {[10,20,50,100].map(n=> <option key={n} value={n}>{n} / صفحة</option>)}
        </select>
  <Button type="button" variant="ghost" onClick={fetchUsers}>تحديث</Button>
        {loading && <span style={{fontSize:'.7rem',color:'#64748b'}}>...تحميل</span>}
        {error && <span style={{fontSize:'.7rem',color:'var(--color-danger-2)'}}>خطأ: {error}</span>}
      </div>

      <form onSubmit={submit} style={{background:'#fff',padding:'1rem',borderRadius:12,boxShadow:'0 4px 14px -6px rgba(0,0,0,.08)',display:'grid',gap:10,marginBottom:12}}>
        <h3 style={{margin:0,fontSize:'.95rem'}}>{form.id? 'تعديل مستخدم' : 'إضافة مستخدم'}</h3>
        <div style={{display:'grid',gap:8,gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))'}}>
          {!form.id && (
            <>
              <input placeholder="البريد الإلكتروني" required value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:'.8rem'}}>
                <input type="checkbox" checked={!!form.sendInvite} onChange={e=>setForm(f=>({...f,sendInvite:e.target.checked}))} /> إرسال رابط تعيين كلمة المرور
              </label>
              {!form.sendInvite && (
                <input placeholder="كلمة المرور" required={!form.sendInvite} type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
              )}
            </>
          )}
          <input placeholder="الاسم" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <input placeholder="الهاتف" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
          <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="user">مستخدم</option>
            <option value="seller">بائع</option>
            <option value="delivery">موصل</option>
            <option value="admin">مدير</option>
          </select>
          {form.id && (
            <select value={form.active? '1':'0'} onChange={e=>setForm(f=>({...f,active:e.target.value==='1'}))}>
              <option value="1">مفعل</option>
              <option value="0">موقوف</option>
            </select>
          )}
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Button type="submit" disabled={saving} variant="primary">{form.id? 'حفظ' : 'إضافة'}</Button>
          {form.id && <Button type="button" variant="ghost" onClick={()=>resetForm()}>إلغاء</Button>}
        </div>
      </form>

  <div style={{overflowX:'auto'}}>
        <table style={table}>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الإيميل</th>
              <th>الهاتف</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>إنشاء</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(u => (
              <tr key={u.id}>
                <td>{u.name || '—'}</td>
                <td style={{fontSize:'.75rem'}}>{u.email}</td>
                <td style={{fontSize:'.75rem'}}>{u.phone || '—'}</td>
                <td>{u.role}</td>
                <td>{u.active === false ? 'موقوف' : 'مفعل'}</td>
                <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                <td style={tdActions}>
                  <Button title="تعديل" size="sm" variant="ghost" onClick={()=>setForm({ id:u.id, name:u.name||'', email:u.email||'', phone:u.phone||'', role:u.role||'user', active: u.active!==false, sendInvite:false, password:'' })}>✎</Button>
                  {/* Quick role actions */}
                  {u.role !== 'delivery' && (
                    <Button title="تعيين كموصل" size="sm" variant="outline" onClick={async()=>{ try { await adminApi.updateUser(u.id, { role:'delivery' }); fetchUsers(); } catch(e){ alert('فشل التعيين: '+e.message); } }}>🚚</Button>
                  )}
                  {u.active === false
                    ? <Button title="تفعيل" size="sm" variant="primary" onClick={()=>activate(u, true)}>✓</Button>
                    : <Button title="إيقاف" size="sm" variant="danger" onClick={()=>activate(u, false)}>⏸</Button>}
                  <Button title="حذف" size="sm" variant="danger" onClick={()=>del(u.id)}>🗑</Button>
                </td>
              </tr>
            ))}
            {!paged.length && !loading && (
              <tr><td colSpan={7} style={emptyCell}>لا توجد نتائج</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:6,alignItems:'center',marginTop:10}}>
        <Button disabled={!canPrev} variant={!canPrev? 'ghost' : 'primary'} onClick={()=>setPage(p=>Math.max(1,p-1))}>السابق</Button>
        <span style={{fontSize:'.7rem'}}>صفحة {page} / {Math.max(1, Math.ceil(visible.length / pageSize))}</span>
        <Button disabled={!canNext} variant={!canNext? 'ghost' : 'primary'} onClick={()=>setPage(p=>p+1)}>التالي</Button>
      </div>
    </div>
    </AdminLayout>
  );
}

import React from 'react';
import Seo from '../../components/Seo';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import AdminTableSkeleton from '../../components/admin/AdminTableSkeleton.jsx';
import AdminSideNav from '../../components/admin/AdminSideNav';

const Customers = () => {
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('user');
  const [status, setStatus] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const toast = useToast?.() || { success:()=>{}, error:()=>{}, info:()=>{}, warn:()=>{} };
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [totalRemote, setTotalRemote] = React.useState(0);

  // Add user form state
  const [addOpen, setAddOpen] = React.useState(false);
  const [addForm, setAddForm] = React.useState({ name:'', email:'', password:'', confirmPassword:'', role:'user', phone:'', sendInvite:true, showPassword:false });
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState(null);
  const [addSuccess, setAddSuccess] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
  const res = await api.adminUsersList({ page, pageSize });
      const list = res?.users || [];
      setUsers(list);
      if (typeof res?.total === 'number') setTotalRemote(res.total);
    } catch (e) {
      setError(e.message || 'FAILED_USERS_LIST');
      toast.error('فشل تحميل المستخدمين', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  React.useEffect(() => { load(); }, [load]);

  const handleAddChange = (field, value) => setAddForm(f => ({ ...f, [field]: value }));
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
  const genPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()_+';
    let pass = '';
    for (let i=0;i<12;i++) pass += chars[Math.floor(Math.random()*chars.length)];
    setAddForm(f => ({ ...f, password: pass, confirmPassword: pass, showPassword: true, sendInvite: false }));
  };
  const submitAddUser = async (e) => {
    e?.preventDefault?.();
    setAddError(null); setAddSuccess(''); setAddLoading(true);
    try {
      const payload = {
        email: (addForm.email||'').trim(),
        password: addForm.sendInvite ? (addForm.password||'') : (addForm.password||''),
        name: (addForm.name||'').trim() || undefined,
        role: addForm.role,
        phone: (addForm.phone||'').trim() || undefined,
        sendInvite: !!addForm.sendInvite,
      };
      if (!payload.email || !isValidEmail(payload.email)) throw new Error('يرجى إدخال بريد إلكتروني صحيح');
      if (!addForm.sendInvite) {
        if (!payload.password || String(payload.password).length < 6) throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف');
        if (addForm.password !== addForm.confirmPassword) throw new Error('تأكيد كلمة المرور لا يطابق');
      }
      const res = await api.adminUserCreate(payload);
      const u = res?.user;
      if (u) {
        setUsers(list => [u, ...list]);
        setAddForm({ name:'', email:'', password:'', confirmPassword:'', role:'user', phone:'', sendInvite:true, showPassword:false });
        setAddOpen(false);
        setPage(1);
        const msg = res?.inviteSent ? 'تم إنشاء المستخدم وإرسال الدعوة بنجاح' : 'تم إنشاء المستخدم بنجاح';
        setAddSuccess(msg);
        toast.success('نجاح', msg);
        setTimeout(()=> setAddSuccess(''), 3000);
      }
    } catch (e) {
      const msg = String(e.message||'');
      let nice = msg;
      if (msg.includes('EMAIL_EXISTS')) nice = 'هذا البريد مستخدم بالفعل';
      if (msg.includes('UNIQUE_CONSTRAINT') && msg.includes('phone')) nice = 'رقم الجوال مستخدم بالفعل';
      setAddError(nice || 'FAILED_CREATE_USER');
      toast.error('فشل الإضافة', nice || 'تعذر إنشاء المستخدم');
    } finally { setAddLoading(false); }
  };

  const filtered = React.useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q));
    }
    if (role) list = list.filter(u => (u.role||'') === role);
    // status placeholder: if we add active flag later
    if (status) {
      const want = status === 'active';
      list = list.filter(u => (u.active ?? true) === want);
    }
    if (from) {
      const d = new Date(from); if (!isNaN(d)) list = list.filter(u => new Date(u.createdAt) >= d);
    }
    if (to) {
      const d = new Date(to); if (!isNaN(d)) { d.setHours(23,59,59,999); list = list.filter(u => new Date(u.createdAt) <= d); }
    }
    return list;
  }, [users, search, role, from, to]);

  const totalLocal = filtered.length;
  const total = totalRemote || totalLocal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const start = (pageSafe - 1) * pageSize;
  const pageItems = (totalRemote ? users : filtered).slice(start, start + pageSize);

  const roleOptions = [
    { value:'user', label:'مستخدم', color:'#2563eb' },
    { value:'admin', label:'مدير', color:'#16a34a' },
    { value:'seller', label:'بائع', color:'#f59e42' },
  ];

  const [editRoleId, setEditRoleId] = React.useState(null);
  const [editRoleValue, setEditRoleValue] = React.useState('');
  const updateRole = async (id, newRole) => {
    try {
      await api.adminUserUpdate(id, { role: newRole });
      setUsers(list => list.map(u => u.id===id ? { ...u, role: newRole } : u));
      setEditRoleId(null);
    } catch (e) { alert('فشل تحديث الدور: ' + e.message); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم:\nالاسم: ${user.name || '—'}\nالبريد: ${user.email || ''}\nهذا الإجراء لا يمكن التراجع عنه!`)) return;
    try {
      await api.adminUserDelete(user.id);
      setUsers(list => list.filter(u => u.id !== user.id));
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
    <div className="admin-page-wrapper" style={{ direction:'rtl', padding:'1.25rem 0' }}>
      <Seo title="العملاء | Customers" description="Customers management" />
      <h1 className="page-title">العملاء / Customers</h1>
      <p className="muted">إدارة العملاء (Placeholder). سيتم ربط البيانات والإجراءات لاحقاً.</p>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:16 }}>
        <AdminSideNav />
        <div>

      {/* Filters + Add user */}
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
            <option value="user">مستخدم</option>
            <option value="admin">مدير</option>
            <option value="seller">بائع</option>
            <option value="">الكل</option>
          </select>
        </label>
        {/* الحالة Placeholder لاحقاً عند إضافة active */}
        <label>الحالة:
          <select value={status} onChange={e=>{ setStatus(e.target.value); setPage(1); }} style={{ marginInlineStart:8 }}>
            <option value="">الكل</option>
            <option value="active">مفعل</option>
            <option value="inactive">غير مفعل</option>
          </select>
        </label>
        <label>من: <input type="date" value={from} onChange={e=>{ setFrom(e.target.value); setPage(1); }} /></label>
        <label>إلى: <input type="date" value={to} onChange={e=>{ setTo(e.target.value); setPage(1); }} /></label>
        <div style={{ marginInlineStart:'auto', display:'flex', gap:8 }}>
          <button className="btn" onClick={load} disabled={loading} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>{loading?'جاري التحديث…':'تحديث'}</button>
          <button className="btn" onClick={exportCsv} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تصدير CSV</button>
          <button className="btn" onClick={()=>setAddOpen(o=>!o)} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6, background:'#2563eb', color:'#fff' }}>{addOpen?'إغلاق':'إضافة مستخدم'}</button>
        </div>
      </div>

      {addOpen && (
        <form onSubmit={submitAddUser} className="card" style={{ padding:12, border:'1px solid #eee', borderRadius:8, marginTop:12, display:'grid', gap:12 }}>
          <div style={{ fontWeight:700 }}><h2>إضافة مستخدم جديد</h2></div>
          {addError && <div className="error" style={{ color:'#b91c1c', background:'#fee2e2', border:'1px solid #fecaca', padding:8, borderRadius:6 }}>{String(addError)}</div>}
          {addSuccess && <div className="success" style={{ color:'#065f46', background:'#d1fae5', border:'1px solid #a7f3d0', padding:8, borderRadius:6 }}>{String(addSuccess)}</div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
            <label>الاسم
              <input type="text" value={addForm.name} onChange={e=>handleAddChange('name', e.target.value)} placeholder="اختياري" style={{ width:'100%' }} />
            </label>
            <label>البريد الإلكتروني
              <input type="email" value={addForm.email} onChange={e=>handleAddChange('email', e.target.value)} required style={{ width:'100%' }} />
            </label>
            <label style={{ display:'flex', flexDirection:'column', gap:6 }}>كلمة المرور
              <div style={{ display:'flex', gap:6 }}>
                <input type={addForm.showPassword?'text':'password'} value={addForm.password} onChange={e=>handleAddChange('password', e.target.value)} disabled={addForm.sendInvite} minLength={addForm.sendInvite?0:6} style={{ width:'100%' }} placeholder={addForm.sendInvite?'سيتم إرسال رابط تعيين كلمة مرور':''} />
                <button type="button" className="btn" onClick={()=>handleAddChange('showPassword', !addForm.showPassword)} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>{addForm.showPassword?'إخفاء':'إظهار'}</button>
                <button type="button" className="btn" onClick={genPassword} disabled={addForm.sendInvite} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>توليد</button>
              </div>
            </label>
            {!addForm.sendInvite && (
              <label>تأكيد كلمة المرور
                <input type={addForm.showPassword?'text':'password'} value={addForm.confirmPassword} onChange={e=>handleAddChange('confirmPassword', e.target.value)} minLength={6} style={{ width:'100%' }} />
              </label>
            )}
            <label>الدور
              <select value={addForm.role} onChange={e=>handleAddChange('role', e.target.value)}>
                {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            <label>الجوال
              <input type="tel" value={addForm.phone} onChange={e=>handleAddChange('phone', e.target.value)} placeholder="اختياري" />
            </label>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" checked={addForm.sendInvite} onChange={e=>handleAddChange('sendInvite', e.target.checked)} />
            إرسال دعوة عبر البريد لتعيين كلمة المرور
          </label>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button type="button" className="btn" onClick={()=>setAddOpen(false)} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>إلغاء</button>
            <button type="submit" className="btn" disabled={addLoading} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6, background:'#16a34a', color:'#fff' }}>{addLoading?'جارٍ الإضافة…':'حفظ'}</button>
          </div>
        </form>
      )}

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

  {/* Table area */}
      <div className="card" style={{ padding:0, border:'1px solid #eee', borderRadius:8, marginTop:16, overflow:'hidden' }} aria-busy={loading ? 'true' : 'false'} aria-live="polite">
        <div style={{ padding:12, borderBottom:'1px solid #eee', background:'#fafafa' }}>
          <strong>قائمة العملاء</strong>
        </div>
        <div style={{ padding:12 }}>
          {error && <div className="error" style={{ marginBottom:8 }}>{String(error)}</div>}
          {loading ? (
            <AdminTableSkeleton rows={Math.min(pageSize, 10)} cols={6} />
          ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ textAlign:'start' }}>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>الاسم</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>البريد</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>الدور</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>الحالة</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0' }}>تاريخ الانضمام</th>
                <th style={{ padding:'8px', borderBottom:'1px solid #f0f0f0', textAlign:'end' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length ? (
                pageItems.map(u => {
                  const roleObj = roleOptions.find(r => r.value === u.role);
                  return (
                  <tr key={u.id} style={{ transition:'background 0.2s', cursor:'pointer' }} onMouseOver={e=>e.currentTarget.style.background='#f3f4f6'} onMouseOut={e=>e.currentTarget.style.background=''}>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8', display:'flex', alignItems:'center', gap:8 }}>
                      <img src={u.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name || 'U') + '&background=eee&color=555&size=32'} alt="avatar" style={{ width:32, height:32, borderRadius:'50%', border:'1px solid #ddd', objectFit:'cover' }} />
                      {u.name || '—'}
                    </td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>{u.email}</td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>
                      {editRoleId === u.id ? (
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                          <select value={editRoleValue} onChange={e=>setEditRoleValue(e.target.value)}>
                            {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <button className="btn" style={{ padding:'2px 8px', fontSize:13 }} onClick={()=>updateRole(u.id, editRoleValue)}>حفظ</button>
                          <button className="btn" style={{ padding:'2px 8px', fontSize:13 }} onClick={()=>setEditRoleId(null)}>إلغاء</button>
                        </span>
                      ) : (
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                          <span style={{ background:roleObj?.color||'#ddd', color:'#fff', borderRadius:6, padding:'2px 10px', fontSize:13 }}>{roleObj?.label||u.role}</span>
                          <button className="btn" style={{ padding:'2px 8px', fontSize:13 }} onClick={()=>{ setEditRoleId(u.id); setEditRoleValue(u.role); }}>تعديل</button>
                        </span>
                      )}
                    </td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>
                      <span style={{ background:(u.active??true)?'#dcfce7':'#fee2e2', color:(u.active??true)?'#166534':'#991b1b', padding:'2px 10px', borderRadius:6, fontSize:13 }}>{(u.active??true)?'مفعل':'غير مفعل'}</span>
                    </td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8' }}>{new Date(u.createdAt).toLocaleString('ar-EG', { dateStyle:'medium', timeStyle:'short' })}</td>
                    <td style={{ padding:'8px', borderBottom:'1px solid #f8f8f8', textAlign:'end', display:'flex', gap:8, justifyContent:'flex-end' }}>
                      {(u.active??true) ? (
                        <button className="btn" onClick={async()=>{ await api.adminUserDeactivate(u.id); setUsers(list=>list.map(x=>x.id===u.id?{...x, active:false}:x)); }} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تعطيل</button>
                      ) : (
                        <button className="btn" onClick={async()=>{ await api.adminUserActivate(u.id); setUsers(list=>list.map(x=>x.id===u.id?{...x, active:true}:x)); }} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تفعيل</button>
                      )}
                      <button className="btn" onClick={()=>deleteUser(u)} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6, background:'#fff', color:'#d32f2f' }}>حذف</button>
                    </td>
                  </tr>
                )})
              ) : (
                <tr><td colSpan={5} className="muted" style={{ padding:'16px', textAlign:'center' }}>لا نتائج</td></tr>
              )}
            </tbody>
          </table>
          )}
          {/* Pagination */}
          <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
            <div className="muted">إجمالي: {total} | الصفحة {pageSafe} من {totalPages}</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <button className="btn" onClick={()=>{ setPage(p=>Math.max(1,p-1)); }} disabled={pageSafe<=1} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>السابق</button>
              <button className="btn" onClick={()=>{ setPage(p=>Math.min(totalPages,p+1)); }} disabled={pageSafe>=totalPages} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>التالي</button>
              <select value={pageSize} onChange={e=>{ const v = Number(e.target.value); setPageSize(v); setPage(1); }}>
                {[10,20,50,100].map(n => <option key={n} value={n}>{n}/صفحة</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};
export default Customers;

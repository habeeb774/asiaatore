import React, { useState, useEffect } from 'react';
import { useOrders } from '../../stores/OrdersContext';
import { useAdmin } from '../../stores/AdminContext';
import { useAuth } from '../../stores/AuthContext';
import { Skeleton } from '../../components/ui';
import Modal from '../../components/ui/Modal';
import AdminLayout from '../../components/features/admin/AdminLayout';
import { useToast } from '../../stores/ToastContext';

const statusOptions = ['pending','paid','shipped','completed','cancelled'];

const OrderCard = ({ o, updateOrderStatus, onDeleteRequest, checked, onToggle }) => (
  <div
    style={{
      padding:'10px 12px',
      border:'1px solid #e5e7eb',
      borderRadius:12,
      background:'#fff',
      display:'grid',
      gap:6
    }}
  >
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input type="checkbox" checked={!!checked} onChange={()=>onToggle && onToggle(o.id)} />
        <strong style={{fontSize:'.8rem'}}>طلب #{o.id}</strong>
      </div>
      <span style={{fontSize:'.6rem',background:'#f1f5f9',padding:'4px 8px',borderRadius:20}}>
        {o.status}
      </span>
    </div>
    <div style={{fontSize:'.65rem',color:'#475569',display:'flex',gap:12,flexWrap:'wrap'}}>
      <span>العميل: {o.customer?.name || o.customer?.fullName || 'غير محدد'}</span>
      <span>الإجمالي: {(o.totals?.grandTotal || 0)} ر.س</span>
      <span>العناصر: {o.items?.length || 0}</span>
    </div>
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      <select
        value={o.status}
        onChange={e=>updateOrderStatus && updateOrderStatus(o.id, e.target.value)}
        style={{padding:'4px 8px',border:'1px solid #d1d5db',borderRadius:8,fontSize:'.6rem'}}
      >
        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener" style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:12,textDecoration:'none'}}>فاتورة</a>
      <button
        type="button"
        onClick={()=> onDeleteRequest && onDeleteRequest(o.id)}
        style={{
          background:'#dc2626',
          color:'#fff',
          border:0,
          borderRadius:8,
          padding:'4px 10px',
          fontSize:'.6rem',
          cursor:'pointer'
        }}
      >
        حذف
      </button>
    </div>
  </div>
);

const OrdersManagement = () => {
  const { user } = useAuth() || {};
  const { orders = [], updateOrderStatus, mergeOrder, refresh, loading } = useOrders() || {};
  const { deleteOrder } = useAdmin() || {};
  const toast = useToast?.() || null;
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('paid');
  const [assignDriver, setAssignDriver] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProps, setConfirmProps] = useState({ title: '', message: '', onConfirm: null, confirmLabel: 'نعم', cancelLabel: 'إلغاء' });

  const openConfirm = ({ title, message, onConfirm, confirmLabel, cancelLabel }) => {
    setConfirmProps({ title: title || '', message: message || '', onConfirm: onConfirm || null, confirmLabel: confirmLabel || 'نعم', cancelLabel: cancelLabel || 'إلغاء' });
    setConfirmOpen(true);
  };

  const filtered = (filter === 'all' ? orders : orders.filter(o => o.status === filter))
    .filter(o => {
      if (!search.trim()) return true;
      const t = search.trim().toLowerCase();
      return (o.id+'').includes(t) || (o.customer?.name||'').toLowerCase().includes(t);
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  useEffect(()=> { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  // Keep select-all in sync with visible paged items
  useEffect(() => {
    if (!selectAll) return;
    setSelected(paged.map(o => o.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAll, page, filter, search]);

  // Fetch online drivers for dropdown
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = (() => { try { return localStorage.getItem('my_store_token'); } catch { return null; } })();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const r = await fetch('/api/delivery/drivers/online', { headers });
        if (!r.ok) return;
        const body = await r.json();
        if (!mounted) return;
        setDrivers(Array.isArray(body?.drivers) ? body.drivers : body?.data || []);
      } catch (e) {
        // ignore silently
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout title="إدارة الطلبات">
      <div aria-busy={loading ? 'true' : 'false'} aria-live="polite">
      {!user || user.role !== 'admin' ? (
        <div style={{padding:'1rem',background:'#fef2f2',color:'#b91c1c',borderRadius:10,fontSize:'.8rem'}}>
          صلاحيات غير كافية
        </div>
      ) : (
        <>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
            <select
              value={filter}
              onChange={e=>{ setFilter(e.target.value); setPage(1); }}
              style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb',fontSize:12}}
            >
              <option value="all">جميع الحالات</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={search}
              onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              placeholder="بحث (رقم / عميل)"
              style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb',fontSize:12,minWidth:180}}
            />
            <button type="button" onClick={()=>{ setSelectAll(prev=>{ const next = !prev; if (!next) setSelected([]); return next; }); }} title="اختيار الكل" style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb',background: selectAll? '#efefef' : '#fff'}}> {selectAll ? 'إلغاء الاختيار' : 'اختيار الكل'}</button>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)} style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb'}}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" onClick={async ()=>{
                if (!selected.length) return toast?.warn?.('اختر طلبات لتنفيذ الإجراء');
                openConfirm({
                  title: 'تأكيد تغيير الحالة',
                  message: `تغيير حالة ${selected.length} طلب إلى ${bulkStatus}?`,
                  confirmLabel: 'تأكيد',
                  cancelLabel: 'إلغاء',
                      onConfirm: async () => {
                    try {
                      await import('../../services/api/admin').then(m=>m.adminApi.bulkUpdateOrdersStatus(selected, bulkStatus));
                      selected.forEach(id => mergeOrder({ id, status: bulkStatus }));
                      setSelected([]);
                      setSelectAll(false);
                      toast?.success?.('تم تغيير الحالة بنجاح');
                    } catch (e) { toast?.error?.('فشل العملية: '+(e.message||e)); }
                  }
                });
              }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#10b981',color:'#fff'}}>تغيير حالة مجمّع</button>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <select value={assignDriver} onChange={e=>setAssignDriver(e.target.value)} style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb'}}>
                <option value="">اختر سائقاً</option>
                {drivers.map(d => (
                  <option key={d.userId || d.id} value={d.userId || d.id}>{(d.name || d.fullName || d.email || ('driver:'+ (d.userId||d.id)))}</option>
                ))}
              </select>
              <button type="button" onClick={async ()=>{
                if (!selected.length) return toast?.warn?.('اختر طلبات للإسناد');
                if (!assignDriver) return toast?.warn?.('اختر سائقاً لإتمام الإسناد');
                try {
                  await import('../../services/api/admin').then(m=>m.adminApi.deliveryAssignBulk(selected, assignDriver));
                  selected.forEach(id => mergeOrder({ id, deliveryDriverId: assignDriver, deliveryStatus: 'assigned' }));
                  setSelected([]);
                  setSelectAll(false);
                  toast?.success?.('تم إسناد الطلبات للسائق');
                } catch(e){ toast?.error?.('فشل الإسناد: '+(e.message||e)); }
              }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#06b6d4',color:'#fff'}}>إسناد مجمّع</button>
              <button type="button" onClick={async ()=>{
                try {
                  const res = await import('../../services/api/admin').then(m=>m.adminApi.deliveryAssignAuto({ limit: 50 }));
                  if (refresh) await refresh();
                  toast?.success?.(`تم الإسناد التلقائي`);
                } catch(e){ toast?.error?.('فشل الإسناد التلقائي: '+(e.message||e)); }
              }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#f59e0b',color:'#fff'}}>إسناد تلقائي</button>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <label style={{display:'flex',flexDirection:'column',fontSize:11}}>
                من
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{padding:6,borderRadius:6,border:'1px solid #e5e7eb',fontSize:12}} />
              </label>
              <label style={{display:'flex',flexDirection:'column',fontSize:11}}>
                إلى
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{padding:6,borderRadius:6,border:'1px solid #e5e7eb',fontSize:12}} />
              </label>
              <button type="button" onClick={async ()=>{
                try {
                  const params = { status: filter==='all'?undefined:filter, from: dateFrom || undefined, to: dateTo || undefined };
                  const csv = await import('../../services/api/admin').then(m=>m.adminApi.exportOrdersCsv(params));
                  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
                  toast?.success?.('تم تنزيل CSV');
                } catch(e){ toast?.error?.('فشل التصدير: '+(e.message||e)); }
              }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff'}}>تصدير CSV</button>
              <button type="button" onClick={async ()=>{
                try {
                  const params = { status: filter==='all'?undefined:filter, from: dateFrom || undefined, to: dateTo || undefined };
                  const blob = await import('../../services/api/admin').then(m=>m.adminApi.exportOrdersXlsx(params));
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url; a.download = 'orders.xlsx'; a.click(); URL.revokeObjectURL(url);
                  toast?.success?.('تم تنزيل XLSX');
                } catch(e){ toast?.error?.('فشل التصدير: '+(e.message||e)); }
              }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff'}}>تصدير XLSX</button>
            </div>
            <div style={{fontSize:12,alignSelf:'center'}}>عدد: {filtered.length}</div>
          </div>
          {loading ? (
            <div style={{display:'grid',gap:10}}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
                  <div style={{ display:'grid', gap:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <Skeleton className="h-7 w-24" />
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{display:'grid',gap:10}}>
              {filtered.length === 0
                ? <div style={{fontSize:13,color:'#64748b'}}>لا توجد طلبات مطابقة.</div>
                : paged.map(o => (
                    <OrderCard
                      key={o.id}
                      o={o}
                      updateOrderStatus={updateOrderStatus}
                      onDeleteRequest={(id) => openConfirm({
                        title: 'حذف الطلب',
                        message: `هل أنت متأكد من حذف الطلب #${id}? هذا الإجراء لا يمكن التراجع عنه.`,
                        confirmLabel: 'احذف',
                        cancelLabel: 'إلغاء',
                        onConfirm: async () => {
                          try {
                            await deleteOrder(id);
                            if (refresh) await refresh();
                            toast?.success?.('تم حذف الطلب');
                          } catch (e) { toast?.error?.('فشل الحذف: '+(e?.message||e)); }
                        }
                      })}
                      checked={selected.includes(o.id)}
                      onToggle={(id)=>{
                        setSelected(s=> s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
                        if (selectAll) setSelectAll(false);
                      }}
                    />
                  ))
              }
            </div>
          )}
          {pageCount > 1 && (
            <div style={{display:'flex',gap:6,marginTop:16,flexWrap:'wrap'}}>
              <button
                disabled={page===1}
                onClick={()=>setPage(p=>Math.max(1,p-1))}
                style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:12,cursor:page===1?'not-allowed':'pointer'}}
              >السابق</button>
              <span style={{fontSize:12,alignSelf:'center'}}>صفحة {page} / {pageCount}</span>
              <button
                disabled={page===pageCount}
                onClick={()=>setPage(p=>Math.min(pageCount,p+1))}
                style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:12,cursor:page===pageCount?'not-allowed':'pointer'}}
              >التالي</button>
            </div>
          )}
          {/* Confirm Modal */}
          <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirmProps.title} size="sm" footer={
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={() => setConfirmOpen(false)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff'}}>{confirmProps.cancelLabel || 'إلغاء'}</button>
              <button onClick={async () => { try { setConfirmOpen(false); await (confirmProps.onConfirm ? confirmProps.onConfirm() : null); } catch(e){ toast?.error?.(e?.message||'حدث خطأ'); } }} style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#ef4444',color:'#fff'}}>{confirmProps.confirmLabel || 'نعم'}</button>
            </div>
          }>
            <div style={{fontSize:13}}>{confirmProps.message}</div>
          </Modal>
        </>
      )}
      </div>
    </AdminLayout>
  );
};

export default OrdersManagement;

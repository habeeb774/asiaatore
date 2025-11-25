import React, { useState, useEffect } from 'react';
import { useOrders } from '../../../contexts/OrdersContext';
import { useAdmin } from '../../../contexts/AdminContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Skeleton } from '../../../components/ui';
import Modal from '../../../components/ui/Modal';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import { useToast } from '../../../contexts/ToastContext';

const statusOptions = ['pending','paid','shipped','completed','cancelled'];

const OrderCard = ({ o, updateOrderStatus, onDeleteRequest, checked, onToggle }) => (
  <div className="p-3 border border-border rounded-xl bg-surface grid gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-px">
    <div className="flex justify-between items-center">
      <div className="flex gap-3 items-center">
        <input type="checkbox" checked={!!checked} onChange={() => onToggle && onToggle(o.id)} className="rounded border-gray-300 text-primary focus:ring-primary" />
        <strong className="text-sm font-bold text-text">طلب #{o.id}</strong>
      </div>
      <span className="text-xs bg-bg-alt px-2 py-1 rounded-full font-medium">
        {o.status}
      </span>
    </div>
    <div className="text-xs text-text-faint flex gap-3 flex-wrap">
      <span>العميل: {o.customer?.name || o.customer?.fullName || 'غير محدد'}</span>
      <span>الإجمالي: {(o.totals?.grandTotal || 0)} ر.س</span>
      <span>العناصر: {o.items?.length || 0}</span>
    </div>
    <div className="flex flex-wrap gap-2 items-center">
      <select
        value={o.status}
        onChange={e => updateOrderStatus && updateOrderStatus(o.id, e.target.value)}
        className="text-xs p-1.5 rounded-lg border border-border bg-surface hover:bg-bg-alt focus:ring-2 focus:ring-primary transition-all"
      >
        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener" className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-bg-alt transition-all no-underline text-text">فاتورة</a>
      <button
        type="button"
        onClick={() => onDeleteRequest && onDeleteRequest(o.id)}
        className="text-xs px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-all font-medium"
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

  const baseInputClass = "text-xs p-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary transition-all";
  const baseButtonClass = "text-xs px-3 py-2 rounded-lg border border-border transition-all";

  return (
    <AdminLayout title="إدارة الطلبات">
      <div aria-busy={loading ? 'true' : 'false'} aria-live="polite">
      {!user || user.role !== 'admin' ? (
        <div className="p-4 bg-danger/10 text-danger-dark rounded-lg text-sm">
          صلاحيات غير كافية
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4 p-2 rounded-xl bg-surface border border-border-soft shadow-sm">
            <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className={baseInputClass}>
              <option value="all">جميع الحالات</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="بحث (رقم / عميل)"
              className={`${baseInputClass} min-w-[180px]`}
            />
            <button type="button" onClick={() => { setSelectAll(prev => { const next = !prev; if (!next) setSelected([]); return next; }); }} title="اختيار الكل" className={`${baseButtonClass} ${selectAll ? 'bg-primary/20 border-primary-alt' : 'bg-bg-alt'}`}>
              {selectAll ? 'إلغاء الاختيار' : 'اختيار الكل'}
            </button>
            
            <div className="w-px h-6 bg-border mx-2"></div>

            {/* Bulk Actions */}
            <div className="flex items-center gap-2">
              <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className={baseInputClass}>
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" onClick={() => {
                if (!selected.length) return toast?.warn?.('اختر طلبات لتنفيذ الإجراء');
                openConfirm({
                  title: 'تأكيد تغيير الحالة',
                  message: `تغيير حالة ${selected.length} طلب إلى ${bulkStatus}?`,
                  onConfirm: async () => {
                    try {
                      await import('../../../services/api/admin').then(m => m.adminApi.bulkUpdateOrdersStatus(selected, bulkStatus));
                      selected.forEach(id => mergeOrder({ id, status: bulkStatus }));
                      setSelected([]); setSelectAll(false);
                      toast?.success?.('تم تغيير الحالة بنجاح');
                    } catch (e) { toast?.error?.('فشل العملية: ' + (e.message || e)); }
                  }
                });
              }} className={`${baseButtonClass} bg-primary text-white hover:bg-primary-alt font-semibold`}>
                تغيير حالة مجمّع
              </button>
            </div>
            
            <div className="w-px h-6 bg-border mx-2"></div>

            {/* Driver Actions */}
            <div className="flex items-center gap-2">
               <select value={assignDriver} onChange={e=>setAssignDriver(e.target.value)} className={baseInputClass}>
                <option value="">اختر سائقاً</option>
                {drivers.map(d => (
                  <option key={d.userId || d.id} value={d.userId || d.id}>{(d.name || d.fullName || d.email || ('driver:'+ (d.userId||d.id)))}</option>
                ))}
              </select>
              <button type="button" onClick={async ()=>{
                if (!selected.length) return toast?.warn?.('اختر طلبات للإسناد');
                if (!assignDriver) return toast?.warn?.('اختر سائقاً لإتمام الإسناد');
                try {
                  await import('../../../services/api/admin').then(m=>m.adminApi.deliveryAssignBulk(selected, assignDriver));
                  selected.forEach(id => mergeOrder({ id, deliveryDriverId: assignDriver, deliveryStatus: 'assigned' }));
                  setSelected([]); setSelectAll(false);
                  toast?.success?.('تم إسناد الطلبات للسائق');
                } catch(e){ toast?.error?.('فشل الإسناد: '+(e.message||e)); }
              }} className={`${baseButtonClass} bg-info text-white hover:bg-info-alt font-semibold`}>إسناد مجمّع</button>
              <button type="button" onClick={async ()=>{
                try {
                  const res = await import('../../../services/api/admin').then(m=>m.adminApi.deliveryAssignAuto({ limit: 50 }));
                  if (refresh) await refresh();
                  toast?.success?.(`تم الإسناد التلقائي`);
                } catch(e){ toast?.error?.('فشل الإسناد التلقائي: '+(e.message||e)); }
              }} className={`${baseButtonClass} bg-accent text-white hover:bg-accent-alt font-semibold`}>إسناد تلقائي</button>
            </div>

            <div className="flex-grow"></div>

            <div style={{fontSize:12,alignSelf:'center'}}>عدد: {filtered.length}</div>
          </div>
          {loading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 border border-border rounded-xl bg-surface grid gap-3">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-24" /> <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-40" /> <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-24" /> <Skeleton className="h-8 w-20" /> <Skeleton className="h-8 w-20" />
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              {paged.length === 0
                ? <div className="text-sm text-text-faint p-8 text-center">لا توجد طلبات مطابقة.</div>
                : paged.map(o => (
                    <OrderCard
                      key={o.id}
                      o={o}
                      updateOrderStatus={updateOrderStatus}
                      onDeleteRequest={(id) => openConfirm({
                        title: 'حذف الطلب',
                        message: `هل أنت متأكد من حذف الطلب #${id}? هذا الإجراء لا يمكن التراجع عنه.`,
                        onConfirm: async () => {
                          try {
                            await deleteOrder(id);
                            if (refresh) await refresh();
                            toast?.success?.('تم حذف الطلب');
                          } catch (e) { toast?.error?.('فشل الحذف: ' + (e?.message || e)); }
                        }
                      })}
                      checked={selected.includes(o.id)}
                      onToggle={(id) => {
                        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
                        if (selectAll) setSelectAll(false);
                      }}
                    />
                  ))
              }
            </div>
          )}
          {pageCount > 1 && (
            <div className="flex gap-2 mt-4 items-center justify-center">
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`${baseButtonClass} bg-surface disabled:opacity-50 disabled:cursor-not-allowed`}>السابق</button>
              <span className="text-sm text-text-faint">صفحة {page} / {pageCount}</span>
              <button disabled={page === pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))} className={`${baseButtonClass} bg-surface disabled:opacity-50 disabled:cursor-not-allowed`}>التالي</button>
            </div>
          )}
          {/* Confirm Modal */}
          <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={confirmProps.title} size="sm" footer={
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmOpen(false)} className={`${baseButtonClass} bg-surface`}>{confirmProps.cancelLabel || 'إلغاء'}</button>
              <button onClick={async () => { try { setConfirmOpen(false); await (confirmProps.onConfirm ? confirmProps.onConfirm() : null); } catch (e) { toast?.error?.('حدث خطأ'); } }} className={`${baseButtonClass} bg-danger text-white hover:bg-danger/90`}>{confirmProps.confirmLabel || 'نعم'}</button>
            </div>
          }>
            <div className="text-sm text-text-soft">{confirmProps.message}</div>
          </Modal>
        </>
      )}
      </div>
    </AdminLayout>
  );
};

export default OrdersManagement;

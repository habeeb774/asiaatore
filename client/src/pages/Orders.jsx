import React from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';
import AdminTableSkeleton from '../components/admin/AdminTableSkeleton.jsx';
import { openInvoicePdfByOrder } from '../services/invoiceService';

const Orders = () => {
  const { orders: allOrders = [], loading, error, useRemote, refresh } = useOrders() || {};
  const { user } = useAuth() || {};
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'الطلبات' : 'Orders') + ' | ' + siteName;
  const [statusFilter, setStatusFilter] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('');
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const visible = React.useMemo(() => {
    const base = user?.role === 'admin' ? allOrders : allOrders.filter(o => String(o.userId) === String(user?.id || 'guest'));
    let list = base;
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(o =>
      (o.id+'').toLowerCase().includes(q) ||
      (o.userId||'').toLowerCase().includes(q) ||
      (''+(o.total ?? o.grandTotal ?? 0)).includes(q)
    );
    if (statusFilter) list = list.filter(o => o.status === statusFilter);
    if (methodFilter) list = list.filter(o => (o.paymentMethod||'') === methodFilter);
    if (from) { const d = new Date(from); if (!isNaN(d)) list = list.filter(o => new Date(o.createdAt) >= d); }
    if (to)   { const d = new Date(to); if (!isNaN(d)) { if (to.match(/^\d{4}-\d{2}-\d{2}$/)) d.setHours(23,59,59,999); list = list.filter(o => new Date(o.createdAt) <= d); } }
    // Always sort desc by createdAt
    list = [...list].sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [allOrders, user, statusFilter, methodFilter, from, to, query]);

  const totalPages = Math.ceil(visible.length / pageSize) || 1;
  const paged = React.useMemo(() => visible.slice((page-1)*pageSize, page*pageSize), [visible, page]);
  React.useEffect(() => { setPage(1); }, [statusFilter, methodFilter, from, to, query]);

  if (loading) return (
    <div className="container-custom px-4 py-12" aria-busy="true" aria-live="polite">
      <div className="mb-4 flex gap-2 justify-center flex-wrap text-sm opacity-70">جار التحميل...</div>
      <AdminTableSkeleton rows={8} cols={4} />
    </div>
  );
  if (error) return <div className="container-custom px-4 py-12 text-center text-sm text-red-600">خطأ: {error}</div>;
  if (visible.length === 0) return (
    <div className="container-custom px-4 py-12 text-center">
      <div className="mb-4 flex gap-2 justify-center flex-wrap text-sm">
        <input placeholder="بحث (رقم الطلب / المستخدم / المبلغ)" value={query} onChange={e=>setQuery(e.target.value)} className="px-3 py-2 border rounded" />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">كل الحالات</option>
          {['pending','processing','pending_bank_review','paid','shipped','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">كل الطرق</option>
          {['paypal','bank','cod','stc'].map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="px-3 py-2 border rounded" />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="px-3 py-2 border rounded" />
        <button onClick={()=>{ setQuery(''); setStatusFilter(''); setMethodFilter(''); setFrom(''); setTo(''); }} className="btn-secondary px-3 py-2">مسح الفلاتر</button>
        <button onClick={()=>refresh?.()} className="btn-secondary px-3 py-2">تحديث</button>
      </div>
      لا توجد طلبات
    </div>
  );

  return (
  <div className="container-custom px-4 py-8" aria-live="polite">
  <Seo title={title} description={locale==='ar' ? `قائمة الطلبات - ${siteName}` : `Orders - ${siteName}`} />
  <h2 className="text-2xl font-bold mb-6">الطلبات ({visible.length}) { !useRemote && <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">وضع محلي</span>}</h2>
      <div className="mb-4 flex gap-2 flex-wrap items-center text-sm">
        <input placeholder="بحث (رقم الطلب / المستخدم / المبلغ)" value={query} onChange={e=>setQuery(e.target.value)} className="px-3 py-2 border rounded" />
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">كل الحالات</option>
          {['pending','processing','pending_bank_review','paid','shipped','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">كل الطرق</option>
          {['paypal','bank','cod','stc'].map(m=> <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="px-3 py-2 border rounded" />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="px-3 py-2 border rounded" />
        <button onClick={()=>{ setQuery(''); setStatusFilter(''); setMethodFilter(''); setFrom(''); setTo(''); }} className="btn-secondary px-3 py-2">مسح الفلاتر</button>
        <button onClick={()=>refresh?.()} className="btn-secondary px-3 py-2">تحديث</button>
      </div>
      <div className="space-y-4">
  {paged.map(o => (
          <div key={o.id} className="p-4 border rounded flex items-center justify-between">
            <div>
              <div className="font-semibold">#{o.id}</div>
              <div className="text-sm text-gray-600">المستخدم: {o.userId} — {new Date(o.createdAt).toLocaleString()}</div>
              <div className="text-sm">العناصر: {(o.items || []).length}</div>
            </div>
            <div className="text-right">
              <div className="mb-2">الإجمالي: <strong>{o.total || (o.items||[]).reduce((s,i)=>s+(i.price||0)*(i.quantity||1),0)} ر.س</strong></div>
              <div className="flex gap-2 justify-end flex-wrap">
                <Link to={`/order/${o.id}`} className="btn-secondary px-4 py-2">عرض</Link>
                <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener" className="btn-secondary px-4 py-2">فاتورة</a>
                {o.status === 'paid' && (
                  <button
                    className="btn-secondary px-4 py-2"
                    onClick={async ()=>{
                      try { await openInvoicePdfByOrder(o.id, { format: 'a4' }); }
                      catch(e){ alert('تعذر فتح الفاتورة: ' + (e?.message || 'خطأ')); }
                    }}
                  >فاتورة (جديدة)</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2 text-sm">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary px-3 py-1 disabled:opacity-40">السابق</button>
          <span className="px-2">{page} / {totalPages}</span>
          <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="btn-secondary px-3 py-1 disabled:opacity-40">التالي</button>
        </div>
      )}
    </div>
  );
};

export default Orders;

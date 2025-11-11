import React from 'react';
import Seo from '../../components/Seo';
import api from '../../services/api/client';
import AdminLayout from '../../components/features/admin/AdminLayout';

function usePendingBank(from, to, page) {
  const [data, setData] = React.useState({ orders: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const params = { status: 'pending_bank_review', paymentMethod: 'bank', page: page || 1, pageSize: 50 };
        if (from) params.from = from;
        if (to) params.to = to;
        const res = await api.listOrdersAdmin(params);
        if (!alive) return;
        setData({ orders: res.orders || [], total: res.total || (res.orders||[]).length, page: res.page || 1, totalPages: res.totalPages || 1 });
      } catch (e) {
        if (!alive) return;
        setError(e.message || 'Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [from, to, page]);
  return { ...data, loading, error };
}

const Row = ({ o, onConfirm, onReject }) => {
  const meta = o.paymentMeta || {}; const bank = meta.bank || {};
  const receiptUrl = bank.receiptUrl; const reference = bank.reference;
  const [note, setNote] = React.useState('');
  return (
    <tr>
      <td><div style={{ fontFamily:'monospace', fontSize:12 }}>{o.id}</div><div className="muted">{new Date(o.createdAt).toLocaleString()}</div></td>
      <td>{o.userId}</td>
      <td>{o.grandTotal?.toFixed?.(2) || o.grandTotal} {o.currency || 'SAR'}</td>
      <td>
        {receiptUrl ? <a href={receiptUrl} target="_blank" rel="noreferrer">عرض المرفق</a> : <span className="muted">لا يوجد</span>}
        <div className="muted">المرجع: {reference || '—'}</div>
      </td>
      <td>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => onConfirm(o.id, reference)} className="btn" style={{ padding:'6px 10px', border:'1px solid #0a0', color:'#0a0', borderRadius:6 }}>تأكيد الدفع</button>
          <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="سبب الرفض (اختياري)" style={{ minWidth:180 }} />
          <button onClick={() => onReject(o.id, note)} className="btn" style={{ padding:'6px 10px', border:'1px solid #a00', color:'#a00', borderRadius:6 }}>رفض</button>
        </div>
      </td>
    </tr>
  );
};

const BankTransfers = () => {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const { orders, loading, error, total, totalPages } = usePendingBank(from, to, page);

  const refresh = React.useCallback(() => {
    setPage(1);
  }, []);

  const onConfirm = async (orderId, reference) => {
    try {
      await api.bankConfirm(orderId, reference);
      refresh();
      alert('تم التأكيد');
    } catch (e) {
      alert(e.message || 'فشل التأكيد');
    }
  };
  const onReject = async (orderId, reason) => {
    if (!window.confirm('هل أنت متأكد من الرفض؟')) return;
    try {
      await api.bankReject(orderId, reason || undefined);
      refresh();
      alert('تم الرفض');
    } catch (e) {
      alert(e.message || 'فشل الرفض');
    }
  };

  return (
    <AdminLayout title="مراجعة التحويلات البنكية">
      <Seo title="مراجعة التحويلات البنكية" description="Bank transfers review" />

      <div style={{ display:'flex', gap:8, alignItems:'center', margin:'8px 0', flexWrap:'wrap' }}>
        <label>من: <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
        <label>إلى: <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
        <button onClick={() => setPage(1)} className="btn" style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تطبيق</button>
      </div>

      <div className="card" style={{ padding:0, border:'1px solid #eee', borderRadius:8 }}>
        <div style={{ padding:12, borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <strong>بانتظار المراجعة: {total}</strong>
          {loading ? <span className="muted">جاري التحميل…</span> : error ? <span className="error">{String(error)}</span> : null}
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ textAlign:'right', background:'#fafafa' }}>
                <th style={{ padding:8, borderBottom:'1px solid #eee' }}>الطلب</th>
                <th style={{ padding:8, borderBottom:'1px solid #eee' }}>العميل</th>
                <th style={{ padding:8, borderBottom:'1px solid #eee' }}>المبلغ</th>
                <th style={{ padding:8, borderBottom:'1px solid #eee' }}>المرفق/المرجع</th>
                <th style={{ padding:8, borderBottom:'1px solid #eee' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <Row key={o.id} o={o} onConfirm={onConfirm} onReject={onReject} />
              ))}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={5} style={{ padding:16 }} className="muted">لا توجد تحويلات بانتظار المراجعة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding:12, display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid #eee' }}>
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="btn" style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>السابق</button>
            <span className="muted">صفحة {page} من {totalPages}</span>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="btn" style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>التالي</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BankTransfers;

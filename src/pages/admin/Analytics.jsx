import React from 'react';
import Seo from '../../components/Seo';
import api from '../../api/client';

// Tiny sparkline canvas (no external deps)
function Sparkline({ points = [], width = 560, height = 100, stroke = '#111827', fill = 'rgba(17,24,39,0.08)' }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,width,height);
    if (!points.length) return;
    const xs = points.map((p,i)=>i);
    const ys = points.map(p=>p);
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    const pad = 6;
    const scaleX = (i) => pad + (i/(points.length-1))*(width - pad*2);
    const scaleY = (v) => {
      const denom = (max-min)||1;
      return height - pad - ((v - min)/denom) * (height - pad*2);
    };
    ctx.beginPath();
    ctx.moveTo(scaleX(0), scaleY(points[0]));
    for (let i=1;i<points.length;i++) ctx.lineTo(scaleX(i), scaleY(points[i]));
    ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke();
    // fill under
    ctx.lineTo(scaleX(points.length-1), height - pad);
    ctx.lineTo(scaleX(0), height - pad);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }, [points, width, height, stroke, fill]);
  return <canvas ref={ref} width={width} height={height} style={{ width, height }} />;
}

const presetRanges = [
  { key: '7', label: '7 أيام' },
  { key: '14', label: '14 يوم' },
  { key: '30', label: '30 يوم' }
];

const Analytics = () => {
  const [range, setRange] = React.useState('7');
  const [from, setFrom] = React.useState(() => new Date(Date.now() - 6*86400000).toISOString().slice(0,10));
  const [to, setTo] = React.useState(() => new Date().toISOString().slice(0,10));
  const [statusFilter, setStatusFilter] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [agg, setAgg] = React.useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrder: 0,
    uniqueCustomers: 0,
    byStatus: {},
    byMethod: {},
    topProducts: [],
    topCustomers: []
  });
  const [trendRevenue, setTrendRevenue] = React.useState([]);
  const [trendOrders, setTrendOrders] = React.useState([]);

  const onPreset = (k) => {
    setRange(k);
    const days = Number(k);
    const toD = new Date();
    const fromD = new Date(); fromD.setDate(toD.getDate() - (days-1));
    setFrom(fromD.toISOString().slice(0,10));
    setTo(toD.toISOString().slice(0,10));
  };

  // Fetch all pages (bounded) for analytics
  const fetchOrdersInRange = React.useCallback(async () => {
    const params = { from, to, page: 1, pageSize: 250 };
    if (statusFilter) params.status = statusFilter;
    if (methodFilter) params.paymentMethod = methodFilter;
    const orders = [];
    const first = await api.listOrdersAdmin(params);
    (first?.orders||[]).forEach(o=>orders.push(o));
    const totalPages = first?.totalPages || 1;
    for (let p = 2; p <= Math.min(totalPages, 8); p++) {
      const res = await api.listOrdersAdmin({ ...params, page: p });
      (res?.orders||[]).forEach(o=>orders.push(o));
    }
    return orders;
  }, [from, to, statusFilter, methodFilter]);

  const compute = React.useCallback((orders) => {
    // daily buckets
    const fromD = new Date(from);
    const toD = new Date(to);
    const days = Math.max(1, Math.round((toD - fromD) / 86400000) + 1);
    const revBuckets = new Map();
    const cntBuckets = new Map();
    for (let i=0;i<days;i++) {
      const d = new Date(fromD); d.setDate(fromD.getDate()+i);
      const k = d.toISOString().slice(0,10);
      revBuckets.set(k, 0);
      cntBuckets.set(k, 0);
    }

    let totalRevenue = 0;
    const byStatus = {};
    const byMethod = {};
    const productAgg = new Map();
    const customerAgg = new Map(); // userId -> { revenue, orders }

    for (const o of orders) {
      totalRevenue += (o.grandTotal || 0);
      byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      const pm = o.paymentMethod || 'unknown';
      byMethod[pm] = (byMethod[pm] || 0) + 1;
      const dayKey = new Date(o.createdAt).toISOString().slice(0,10);
      if (revBuckets.has(dayKey)) revBuckets.set(dayKey, (revBuckets.get(dayKey)||0) + (o.grandTotal||0));
      if (cntBuckets.has(dayKey)) cntBuckets.set(dayKey, (cntBuckets.get(dayKey)||0) + 1);

      // customers
      const uid = o.userId || 'guest';
      const c = customerAgg.get(uid) || { id: uid, revenue: 0, orders: 0 };
      c.revenue += (o.grandTotal || 0);
      c.orders += 1;
      customerAgg.set(uid, c);

      // products
      (o.items||[]).forEach(it => {
        const key = it.productId || (it.name?.ar || it.name?.en || 'منتج');
        const prev = productAgg.get(key) || { name: (it.name?.ar || it.name?.en || key), qty: 0, revenue: 0 };
        prev.qty += (it.quantity || 0);
        prev.revenue += (it.price || 0) * (it.quantity || 0);
        productAgg.set(key, prev);
      });
    }

    const totalOrders = orders.length;
    const avgOrder = totalOrders ? (totalRevenue / totalOrders) : 0;
    const uniqueCustomers = customerAgg.size;
    const topProducts = Array.from(productAgg.values()).sort((a,b)=> b.revenue - a.revenue).slice(0, 10);
    const topCustomers = Array.from(customerAgg.values()).sort((a,b)=> b.revenue - a.revenue).slice(0, 10);

    setAgg({ totalOrders, totalRevenue, avgOrder, uniqueCustomers, byStatus, byMethod, topProducts, topCustomers });
    setTrendRevenue(Array.from(revBuckets.values()));
    setTrendOrders(Array.from(cntBuckets.values()));
  }, [from, to]);

  const refresh = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const orders = await fetchOrdersInRange();
      compute(orders);
    } catch (e) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [fetchOrdersInRange, compute]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const baseApi = (import.meta?.env?.VITE_API_URL || '/api');
  const buildExportUrl = (fmt) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (statusFilter) qs.set('status', statusFilter);
    if (methodFilter) qs.set('paymentMethod', methodFilter);
    return `${baseApi}/admin/stats/orders/export/${fmt}?${qs.toString()}`;
  };

  const downloadExport = async (fmt) => {
    let token = null; try { token = localStorage.getItem('my_store_token'); } catch {}
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (import.meta?.env?.DEV) { headers['x-user-id'] = 'dev-admin'; headers['x-user-role'] = 'admin'; }
    const resp = await fetch(buildExportUrl(fmt), { headers });
    if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fmt === 'csv' ? 'analytics_orders.csv' : 'analytics_orders.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page-wrapper">
      <Seo title="التحليلات | Analytics" description="Analytics overview" />
      <h1 className="page-title">التحليلات / Analytics</h1>
      {error && <div className="error" style={{ marginTop:8 }}>{String(error)}</div>}

      {/* Filters */}
      <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <strong>الفترة:</strong>
        {presetRanges.map(r => (
          <button key={r.key} onClick={() => onPreset(r.key)} className={range===r.key? 'btn btn-primary':'btn'} style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6, background: range===r.key?'#111827':'#fff', color: range===r.key?'#fff':'#111' }}>{r.label}</button>
        ))}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label>من: <input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
          <label>إلى: <input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label>
          <label>الحالة:
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">الكل</option>
              <option value="pending">معلق</option>
              <option value="processing">قيد المعالجة</option>
              <option value="paid">مدفوع</option>
              <option value="shipped">تم الشحن</option>
              <option value="cancelled">ملغي</option>
            </select>
          </label>
          <label>طريقة الدفع:
            <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)}>
              <option value="">الكل</option>
              <option value="paypal">PayPal</option>
              <option value="bank">تحويل بنكي</option>
              <option value="cod">الدفع عند الاستلام</option>
              <option value="stc">STC Pay</option>
            </select>
          </label>
          <button onClick={refresh} className="btn" style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>{loading?'جاري التحميل…':'تحديث'}</button>
        </div>
        <div style={{ marginInlineStart:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => downloadExport('csv')} className="btn" style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تصدير CSV</button>
          <button onClick={() => downloadExport('xlsx')} className="btn" style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:6 }}>تصدير Excel</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginTop:16 }}>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">الطلبات (الفترة)</div>
          {loading ? <div>...</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.totalOrders}</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">الإيراد (الفترة)</div>
          {loading ? <div>...</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.totalRevenue.toFixed(2)} SAR</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">متوسط الطلب</div>
          {loading ? <div>...</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.avgOrder.toFixed(2)} SAR</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">العملاء الفريدون</div>
          {loading ? <div>...</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.uniqueCustomers}</div>}
        </div>
      </div>

      {/* Trends */}
      <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <h3 style={{ margin:0 }}>الاتجاه اليومي (من {from} إلى {to})</h3>
          {loading ? <span className="muted">جاري التحميل…</span> : null}
        </div>
        <div style={{ marginTop:8, display:'grid', gap:10 }}>
          <div>
            <div className="muted">الإيراد</div>
            <Sparkline points={trendRevenue} width={560} height={100} />
          </div>
          <div>
            <div className="muted">عدد الطلبات</div>
            <Sparkline points={trendOrders} width={560} height={70} stroke="#0ea5e9" fill="rgba(14,165,233,0.12)" />
          </div>
        </div>
        <div className="muted" style={{ marginTop:8, display:'flex', gap:16, flexWrap:'wrap' }}>
          <span>إجمالي الإيراد: {trendRevenue.reduce((a,b)=>a+b,0).toFixed(2)} SAR</span>
          <span>إجمالي الطلبات: {trendOrders.reduce((a,b)=>a+b,0)}</span>
        </div>
      </div>

      {/* Distributions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginTop:12 }}>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <h3 style={{ marginTop:0 }}>التوزيع حسب الحالة</h3>
          {loading ? <div>...</div> : (
            <table style={{ width:'100%', fontSize:12 }}>
              <tbody>
                {Object.entries(agg.byStatus).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
                  <tr key={k}><td style={{ padding:'4px 0' }}>{k}</td><td style={{ textAlign:'end' }}>{v}</td></tr>
                ))}
                {Object.keys(agg.byStatus).length===0 && <tr><td colSpan={2} className="muted">لا بيانات</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <h3 style={{ marginTop:0 }}>التوزيع حسب طريقة الدفع</h3>
          {loading ? <div>...</div> : (
            <table style={{ width:'100%', fontSize:12 }}>
              <tbody>
                {Object.entries(agg.byMethod).sort((a,b)=>b[1]-a[1]).map(([k,v]) => (
                  <tr key={k}><td style={{ padding:'4px 0' }}>{k}</td><td style={{ textAlign:'end' }}>{v}</td></tr>
                ))}
                {Object.keys(agg.byMethod).length===0 && <tr><td colSpan={2} className="muted">لا بيانات</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Top lists */}
      <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8, marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>أفضل المنتجات (حسب الإيراد)</h3>
        {loading ? <div>...</div> : (
          <table style={{ width:'100%', fontSize:12 }}>
            <thead>
              <tr><th style={{ textAlign:'start' }}>المنتج</th><th>الكمية</th><th>الإيراد</th></tr>
            </thead>
            <tbody>
              {agg.topProducts.map((p,i) => (
                <tr key={i}><td style={{ padding:'4px 0' }}>{p.name}</td><td style={{ textAlign:'center' }}>{p.qty}</td><td style={{ textAlign:'end' }}>{p.revenue.toFixed(2)} SAR</td></tr>
              ))}
              {agg.topProducts.length===0 && <tr><td colSpan={3} className="muted">لا بيانات</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8, marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>أفضل العملاء (حسب الإيراد)</h3>
        {loading ? <div>...</div> : (
          <table style={{ width:'100%', fontSize:12 }}>
            <thead>
              <tr><th style={{ textAlign:'start' }}>العميل</th><th>الطلبات</th><th>الإيراد</th></tr>
            </thead>
            <tbody>
              {agg.topCustomers.map((c,i) => (
                <tr key={i}><td style={{ padding:'4px 0' }}>{c.id === 'guest' ? 'ضيف' : c.id}</td><td style={{ textAlign:'center' }}>{c.orders}</td><td style={{ textAlign:'end' }}>{c.revenue.toFixed(2)} SAR</td></tr>
              ))}
              {agg.topCustomers.length===0 && <tr><td colSpan={3} className="muted">لا بيانات</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
export default Analytics;

import React from 'react';
import Seo from '../../components/Seo';
import AdminLayout from '../../components/features/admin/AdminLayout';
import api from '../../services/api/client';
import { Button } from '../../components/ui';

function useOverview() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const res = await api.adminStatsOverview();
        if (!alive) return;
        setData(res?.stats || null);
      } catch (e) {
        if (!alive) return;
        setError(e.message || 'Failed');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);
  return { data, loading, error };
}

// Tiny sparkline canvas (no external deps)
function Sparkline({ points = [], width = 280, height = 60, stroke = '#111827', fill = 'rgba(17,24,39,0.08)' }) {
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

const Reports = () => {
  const { data: overview, loading, error } = useOverview();
  const [range, setRange] = React.useState('7');
  const [from, setFrom] = React.useState(() => new Date(Date.now() - 6*86400000).toISOString().slice(0,10));
  const [to, setTo] = React.useState(() => new Date().toISOString().slice(0,10));
  const [trendRevenue, setTrendRevenue] = React.useState([]);
  const [trendOrders, setTrendOrders] = React.useState([]);
  const [loadingRange, setLoadingRange] = React.useState(false);
  const [errorRange, setErrorRange] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('');
  const [agg, setAgg] = React.useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrder: 0,
    byStatus: {},
    byMethod: {},
    topProducts: []
  });

  // Fetch orders in range with optional filters and compute aggregations + trends
  const fetchRangeAnalytics = React.useCallback(async () => {
    setLoadingRange(true); setErrorRange(null);
    try {
      const params = { from, to, page: 1, pageSize: 500 };
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.paymentMethod = methodFilter;
      const res = await api.listOrdersAdmin(params);
      const orders = res?.orders || [];
      // Build daily buckets between from..to
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
      // Aggregations
      let totalRevenue = 0;
      const byStatus = {};
      const byMethod = {};
      const productAgg = new Map(); // key by productId||name to aggregate qty and revenue
      for (const o of orders) {
        totalRevenue += (o.grandTotal || 0);
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
        const pm = o.paymentMethod || 'unknown';
        byMethod[pm] = (byMethod[pm] || 0) + 1;
        const dayKey = new Date(o.createdAt).toISOString().slice(0,10);
        if (revBuckets.has(dayKey)) revBuckets.set(dayKey, (revBuckets.get(dayKey)||0) + (o.grandTotal||0));
        if (cntBuckets.has(dayKey)) cntBuckets.set(dayKey, (cntBuckets.get(dayKey)||0) + 1);
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
      const topProducts = Array.from(productAgg.values()).sort((a,b)=> b.revenue - a.revenue).slice(0, 10);
      setAgg({ totalOrders, totalRevenue, avgOrder, byStatus, byMethod, topProducts });
      setTrendRevenue(Array.from(revBuckets.values()));
      setTrendOrders(Array.from(cntBuckets.values()));
    } catch (e) {
      setErrorRange(e.message || 'Failed to load analytics');
    } finally {
      setLoadingRange(false);
    }
  }, [from, to, statusFilter, methodFilter]);

  React.useEffect(() => { fetchRangeAnalytics(); }, [fetchRangeAnalytics]);

  const onPreset = (k) => {
    setRange(k);
    const days = Number(k);
    const toD = new Date();
    const fromD = new Date(); fromD.setDate(toD.getDate() - (days-1));
    setFrom(fromD.toISOString().slice(0,10));
    setTo(toD.toISOString().slice(0,10));
  };

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
    // reuse same headers used by api.client (dev fallback headers if no token)
    let token = null; try { token = localStorage.getItem('my_store_token'); } catch {}
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (import.meta?.env?.DEV) { headers['x-user-id'] = 'dev-admin'; headers['x-user-role'] = 'admin'; }
    const resp = await fetch(buildExportUrl(fmt), { headers });
    if (!resp.ok) throw new Error(`Export failed: ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fmt === 'csv' ? 'orders_export.csv' : 'orders_export.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="التقارير / Reports">
      <Seo title="التقارير | Reports" description="Reports overview" />

      <div className="cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginTop:12 }}>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">طلبات اليوم</div>
          {loading ? <div>...</div> : error ? <div className="error">{String(error)}</div> : <div style={{ fontSize:28, fontWeight:700 }}>{overview?.todayOrders ?? 0}</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">إيراد اليوم</div>
          {loading ? <div>...</div> : error ? <div className="error">{String(error)}</div> : <div style={{ fontSize:28, fontWeight:700 }}>{(overview?.todayRevenue ?? 0).toFixed?.(2) || 0} SAR</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">متوسط قيمة الطلب</div>
          {loading ? <div>...</div> : error ? <div className="error">{String(error)}</div> : <div style={{ fontSize:28, fontWeight:700 }}>{(overview?.avgOrderValueToday ?? 0).toFixed?.(2) || 0} SAR</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">بانتظار مراجعة التحويل البنكي</div>
          {loading ? <div>...</div> : error ? <div className="error">{String(error)}</div> : <div style={{ fontSize:28, fontWeight:700 }}>{overview?.pendingBankCount ?? 0}</div>}
        </div>
      </div>

      <div style={{ marginTop:24, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <strong>الفترة:</strong>
        {presetRanges.map(r => (
          <Button key={r.key} size="sm" variant={range===r.key ? 'primary' : 'secondary'} onClick={() => onPreset(r.key)}>{r.label}</Button>
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
          <Button onClick={()=>fetchRangeAnalytics()} variant="secondary">تحديث</Button>
        </div>
        <div style={{ marginInlineStart:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <Button onClick={() => downloadExport('csv')} variant="outline">تصدير CSV</Button>
          <Button onClick={() => downloadExport('xlsx')} variant="outline">تصدير Excel</Button>
        </div>
      </div>

      <div className="cards" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, marginTop:16 }}>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">الطلبات (الفترة)</div>
          {loadingRange ? <div>...</div> : errorRange ? <div className="error">{String(errorRange)}</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.totalOrders}</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">الإيراد (الفترة)</div>
          {loadingRange ? <div>...</div> : errorRange ? <div className="error">{String(errorRange)}</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.totalRevenue.toFixed(2)} SAR</div>}
        </div>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <div className="muted">متوسط الطلب (الفترة)</div>
          {loadingRange ? <div>...</div> : errorRange ? <div className="error">{String(errorRange)}</div> : <div style={{ fontSize:24, fontWeight:700 }}>{agg.avgOrder.toFixed(2)} SAR</div>}
        </div>
      </div>

  <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <h3 style={{ margin:0 }}>الاتجاه اليومي (من {from} إلى {to})</h3>
          {loadingRange ? <span className="muted">جاري التحميل…</span> : errorRange ? <span className="error">{String(errorRange)}</span> : null}
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

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginTop:12 }}>
        <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8 }}>
          <h3 style={{ marginTop:0 }}>التوزيع حسب الحالة</h3>
          {loadingRange ? <div>...</div> : (
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
          {loadingRange ? <div>...</div> : (
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

      <div className="card" style={{ padding:16, border:'1px solid #eee', borderRadius:8, marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>أفضل المنتجات (حسب الإيراد)</h3>
        {loadingRange ? <div>...</div> : (
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
    </AdminLayout>
  );
};
export default Reports;

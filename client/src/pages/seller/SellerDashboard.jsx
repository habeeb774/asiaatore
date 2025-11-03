import React, { useMemo, useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { localizeName } from '../../utils/locale';
const ProductManager = React.lazy(() => import('./ProductManager'));
// Shared admin styles (includes .skeleton and layout helpers)
import '../../styles/AdminPage.scss';

const SellerDashboard = () => {
  const auth = useAuth() || {};
  const { user, devLoginAs } = auth;
  const { orders } = useOrders() || {};
  const store = useStore();
  // Language hook used unconditionally per React rules; guard locale usage
  const lang = useLanguage();
  const locale = lang?.locale || 'ar';

  const notSeller = !user || user.role !== 'seller';

  // My products from store (fallback to empty)
  const myProducts = useMemo(() => (store?.products || []).filter(p => p.sellerId === user.id), [store?.products, user?.id]);

  // Try to attribute order items to this seller
  // Priority: match by productId -> store product id; fallback: match by localized name
  const matchIsMine = (item) => {
    if (!item) return false;
    // Try direct productId match (when backend returns real IDs)
    if (item.productId && myProducts.some(p => p.id === item.productId)) return true;
    // Fallback: name match
  const itemName = typeof item.name === 'string' ? item.name : (item.name?.[locale] || item.name?.ar || item.name?.en || '');
    if (!itemName) return false;
    const lname = String(itemName).trim().toLowerCase();
    return myProducts.some(p => String(localizeName({ name: p.name }, locale)).trim().toLowerCase() === lname);
  };

  const attributed = useMemo(() => {
    const source = Array.isArray(orders) ? orders : [];
    return source.map(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      const mine = items.filter(matchIsMine);
      const qty = mine.reduce((s,i)=> s + (Number(i.quantity)||1), 0);
      const amount = mine.reduce((s,i)=> s + (Number(i.price)||0) * (Number(i.quantity)||1), 0);
      return { ...o, _mineCount: mine.length, _mineQty: qty, _mineAmount: amount };
    });
  }, [orders, myProducts, locale]);

  const myOrders = useMemo(() => attributed.filter(o => (o.sellerId ? o.sellerId === user.id : (o._mineCount > 0 || !o.items))), [attributed, user?.id]);

  // KPIs
  const kpi = useMemo(() => ({
    products: myProducts.length,
    orders: myOrders.length,
    itemsSold: myOrders.reduce((s,o)=> s + (o._mineQty||0), 0),
    revenue: myOrders.reduce((s,o)=> s + (o._mineAmount||0), 0),
  }), [myProducts.length, myOrders]);

  const [tab, setTab] = useState('overview');

  return (
    <div className="container-custom px-4 py-12">
      {notSeller ? (
        <div>
          <div>لا تملك صلاحية الدخول إلى لوحة البائع</div>
          <div className="text-xs text-gray-500 mt-2">لأغراض التجربة، يمكنك تسجيل دخول تجريبي كبائع من قائمة الحساب في الهيدر.</div>
          {typeof devLoginAs === 'function' && (
            <button className="btn-primary mt-4" onClick={() => devLoginAs('seller')}>
              تسجيل دخول تجريبي كبائع الآن
            </button>
          )}
        </div>
      ) : (
        <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>لوحة البائع</h2>
        <div className="flex items-center gap-2">
          <Link to="/seller/products" className="btn-primary" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-alt))' }}>إدارة المنتجات</Link>
          <Link to={`/vendor/${user.id}`} className="btn-secondary" style={{ background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}>متجرى العام</Link>
        </div>
      </div>
      <p className="mb-6">مرحباً، {user.name}</p>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <button className={`btn-chip ${tab==='overview'?'bg-primary-red text-white':'bg-gray-100'}`} onClick={()=>setTab('overview')}>نظرة عامة</button>
        <button className={`btn-chip ${tab==='products'?'bg-primary-red text-white':'bg-gray-100'}`} onClick={()=>setTab('products')}>منتجاتي</button>
      </div>

      {tab==='overview' && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 border rounded" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-soft)' }}><div className="text-sm" style={{ color:'var(--color-text-faint)' }}>منتجاتي</div><div className="text-2xl font-bold" style={{ color:'var(--color-text)' }}>{kpi.products}</div></div>
            <div className="p-4 border rounded" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-soft)' }}><div className="text-sm" style={{ color:'var(--color-text-faint)' }}>طلبات</div><div className="text-2xl font-bold" style={{ color:'var(--color-text)' }}>{kpi.orders}</div></div>
            <div className="p-4 border rounded" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-soft)' }}><div className="text-sm" style={{ color:'var(--color-text-faint)' }}>قطع مباعة (تقريباً)</div><div className="text-2xl font-bold" style={{ color:'var(--color-text)' }}>{kpi.itemsSold}</div></div>
            <div className="p-4 border rounded" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border-soft)' }}><div className="text-sm" style={{ color:'var(--color-text-faint)' }}>إيراد تقديري</div><div className="text-2xl font-bold" style={{ color:'var(--color-text)' }}>{kpi.revenue.toFixed(2)} ر.س</div></div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">أحدث الطلبات</h3>
            <div className="space-y-3">
              {myOrders.slice(0, 10).map(o => (
                <div key={o.id} className="p-4 border rounded flex items-center justify-between gap-4" style={{ background:'var(--color-surface)', borderColor:'var(--color-border-soft)' }}>
                  <div>
                    <div className="font-semibold" style={{ color:'var(--color-text)' }}>#{o.id} — {o.status || 'pending'}</div>
                    <div className="text-xs" style={{ color:'var(--color-text-faint)' }}>بتاريخ: {o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <div style={{ color:'var(--color-text)' }}>عناصر لي: <strong>{o._mineQty || 0}</strong></div>
                    <div style={{ color:'var(--color-text)' }}>إجمالي تقديري: <strong>{(o._mineAmount || 0).toFixed(2)} ر.س</strong></div>
                  </div>
                </div>
              ))}
              {myOrders.length === 0 && <div className="text-gray-600">لا توجد طلبات مرتبطة بك حالياً</div>}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">إجراءات سريعة</h3>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/seller/products" className="btn-outline">إضافة منتج جديد</Link>
              <Link to="/products" className="btn-outline">استعراض المتجر</Link>
              <a href="#" className="btn-outline" onClick={(e)=>e.preventDefault()}>إعدادات الشحن (قريباً)</a>
            </div>
          </div>
        </>
      )}

      {tab==='products' && (
        <div className="bg-white border rounded p-4">
          <Suspense fallback={<div className="text-sm text-gray-500">جاري تحميل إدارة المنتجات…</div>}>
            <ProductManager embedded />
          </Suspense>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default SellerDashboard;

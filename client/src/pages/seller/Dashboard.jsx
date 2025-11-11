// LEGACY FILE NOTICE:
// This is a legacy seller dashboard retained for reference.
// The active seller dashboard used in routes is `SellerDashboard.jsx` in the same folder.
// Do not add new logic here; consider porting any needed code to SellerDashboard.jsx.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../stores/AuthContext';
import { useOrders } from '../../stores/OrdersContext';
import { useStore } from '../../stores/StoreContext';
import { useLanguage } from '../../stores/LanguageContext';
import { localizeName } from '../../utils/locale';

const SellerDashboard = () => {
  const auth = useAuth() || {};
  const { user, devLoginAs } = auth;
  const { orders } = useOrders() || {};
  const store = useStore();
  // Use language hook unconditionally per hooks rules; guard value
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
        <>
          <div>لا تملك صلاحية الدخول إلى لوحة البائع</div>
          <div className="text-xs text-gray-500 mt-2">لأغراض التجربة، يمكنك تسجيل دخول تجريبي كبائع من قائمة الحساب في الهيدر.</div>
          {typeof devLoginAs === 'function' && (
            <button className="btn-primary mt-4" onClick={() => devLoginAs('seller')}>
              تسجيل دخول تجريبي كبائع الآن
            </button>
          )}
        </>
      ) : (
        <div>
          {/* Legacy dashboard is deprecated; redirect users to admin area manually */}
          <div className="mb-4">تم نقل لوحة البائع. يمكنك استخدام لوحة التحكم الإدارية.</div>
          <Link className="btn-primary" to="/admin">الانتقال إلى لوحة التحكم</Link>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;

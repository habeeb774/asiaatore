import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';

const SellerDashboard = () => {
  const { user } = useAuth() || {};
  const { orders } = useOrders() || {};

  if (!user || user.role !== 'seller') {
    return <div className="container-custom px-4 py-12">لا تملك صلاحية الدخول إلى لوحة البائع</div>;
  }

  // placeholder: filter orders for seller (if orders include sellerId)
  const myOrders = (orders || []).filter(o => (o.sellerId ? o.sellerId === user.id : true));

  return (
    <div className="container-custom px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">لوحة البائع</h2>
      <p className="mb-4">مرحباً، {user.name}</p>

      <div className="space-y-4">
        {myOrders.map(o => (
          <div key={o.id} className="p-4 border rounded">
            <div className="font-semibold">#{o.id} — {o.status}</div>
            <div className="text-sm text-gray-600">{(o.items || []).length} عناصر — {o.total || o.items?.reduce((s,i)=>s+(i.price*i.quantity),0)}</div>
          </div>
        ))}
        {myOrders.length === 0 && <div className="text-gray-600">لا توجد طلبات مرتبطة بك</div>}
      </div>
    </div>
  );
};

export default SellerDashboard;

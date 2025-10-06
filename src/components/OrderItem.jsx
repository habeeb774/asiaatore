import React from 'react';

const OrderItem = ({ order }) => {
  if (!order) return null;
  const total = (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">#{order.id}</div>
          <div className="text-sm text-gray-600">{order.userId} — {new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="font-bold">{total} ر.س</div>
          <div className="text-sm text-gray-600">{order.status}</div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;

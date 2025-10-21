import React, { useState } from 'react';
import api from '../../api/client';

export default function StockAdjustModal({ open, onClose, product, onAdjusted }) {
  const [quantity, setQuantity] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('set');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.inventoryAdjust(product.id, {
        quantity: Number(quantity),
        adjustment_type: adjustmentType,
        reason,
      });
      setLoading(false);
      onAdjusted && onAdjusted();
      onClose();
    } catch (err) {
      setError(err.message || 'خطأ في التعديل');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-2">تعديل مخزون المنتج</h2>
        <div className="mb-2 text-sm text-gray-700">{product.name?.ar || product.nameAr} (SKU: {product.sku || '-'})</div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block mb-1">الكمية الجديدة</label>
            <input type="number" className="border rounded px-2 py-1 w-full" value={quantity} onChange={e => setQuantity(e.target.value)} required min="0" />
          </div>
          <div className="mb-3">
            <label className="block mb-1">نوع التعديل</label>
            <select className="border rounded px-2 py-1 w-full" value={adjustmentType} onChange={e => setAdjustmentType(e.target.value)}>
              <option value="set">تعيين</option>
              <option value="increment">زيادة</option>
              <option value="decrement">نقصان</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block mb-1">السبب</label>
            <input type="text" className="border rounded px-2 py-1 w-full" value={reason} onChange={e => setReason(e.target.value)} placeholder="مثال: توريد جديد، تعديل يدوي..." />
          </div>
          {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'جارٍ الحفظ...' : 'حفظ'}</button>
            <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

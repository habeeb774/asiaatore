import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import StockAdjustModal from './StockAdjustModal';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.listProducts(),
      api.inventoryList()
    ]).then(([prodList, invData]) => {
      // Map inventory by productId
      const invMap = new Map();
      (invData.items || []).forEach(inv => {
        invMap.set(inv.productId, inv);
      });
      // Merge inventory into products
      const merged = prodList.map(p => {
        const inv = invMap.get(p.id) || {};
        const stock = inv.quantity ?? p.stock ?? 0;
        const reservedQuantity = inv.reservedQuantity ?? 0;
        const lowStockThreshold = inv.lowStockThreshold ?? 5;
        const isLow = (stock - reservedQuantity) <= lowStockThreshold;
        return {
          ...p,
          stock,
          reservedQuantity,
          lowStockThreshold,
          isLowStock: !!isLow,
        };
      });
      setProducts(merged);
      setLoading(false);
    }).catch(err => {
      setError(err.message || 'خطأ في جلب البيانات');
      setLoading(false);
    });
  }, [refreshFlag]);

  const handleAdjustClick = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAdjusted = () => {
    setRefreshFlag(f => f + 1);
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || (p.name?.ar || p.nameAr || '').toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesLow = !showLowOnly || p.isLowStock;
    return matchesSearch && matchesLow;
  });

  const exportCsv = () => {
    const rows = [
      ['Product Name (AR)', 'SKU', 'Stock', 'Reserved', 'Low Threshold', 'Is Low'].join(',')
    ].concat(
      filtered.map(p => [
        JSON.stringify(p.name?.ar || p.nameAr || ''),
        JSON.stringify(p.sku || ''),
        String(p.stock ?? 0),
        String(p.reservedQuantity ?? 0),
        String(p.lowStockThreshold ?? 0),
        p.isLowStock ? 'yes' : 'no'
      ].join(','))
    );
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = showLowOnly ? 'low-stock.csv' : 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">قائمة المنتجات والمخزون</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            className="border rounded px-2 py-1"
            placeholder="بحث بالاسم أو SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} />
            <span>عرض المخزون المنخفض فقط</span>
          </label>
          <button className="bg-gray-100 border px-3 py-1 rounded" onClick={() => setRefreshFlag(f => f + 1)}>تحديث</button>
          <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={exportCsv}>تصدير CSV</button>
        </div>
      </div>
      {loading ? <div>جارٍ التحميل...</div> : error ? <div className="text-red-600">{error}</div> : (
        <table className="min-w-full border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">اسم المنتج</th>
              <th className="p-2 border">SKU</th>
              <th className="p-2 border">المخزون الحالي</th>
              <th className="p-2 border">محجوز</th>
              <th className="p-2 border">الحد الأدنى</th>
              <th className="p-2 border">تعديل سريع</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className={p.isLowStock ? 'bg-red-50' : ''}>
                <td className="p-2 border">{p.name?.ar || p.nameAr}</td>
                <td className="p-2 border">{p.sku || '-'}</td>
                <td className="p-2 border font-bold">{p.stock}</td>
                <td className="p-2 border">{p.reservedQuantity}</td>
                <td className="p-2 border">{p.lowStockThreshold}</td>
                <td className="p-2 border">
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => handleAdjustClick(p)}>تعديل</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <StockAdjustModal open={modalOpen} onClose={handleModalClose} product={selectedProduct} onAdjusted={handleAdjusted} />
    </div>
  );
}

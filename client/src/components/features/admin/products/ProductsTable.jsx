import React, { useMemo, useState } from 'react';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/input';
import { Select } from '../../../ui/select';

const statusMeta = {
  active: { label: 'نشط', badge: 'bg-green-100 text-green-800' },
  inactive: { label: 'غير نشط', badge: 'bg-red-100 text-red-800' },
  draft: { label: 'مسودة', badge: 'bg-yellow-100 text-yellow-800' },
  archived: { label: 'مؤرشف', badge: 'bg-gray-100 text-gray-800' }
};

const resolveText = (value, fallback = '') => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.ar || value.en || Object.values(value).find((entry) => typeof entry === 'string' && entry.trim().length > 0) || fallback;
  }
  return fallback;
};

const ProductsTable = ({
  products = [],
  loading = false,
  categories = [],
  onEdit,
  onDelete,
  onManageImages,
  onManageTiers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const filters = useMemo(() => ({ searchTerm, selectedCategory, selectedStatus }), [searchTerm, selectedCategory, selectedStatus]);

  const filteredProducts = useMemo(() => {
    const term = filters.searchTerm.trim().toLowerCase();
    return (products || []).filter((product) => {
      const productName = resolveText(product.name);
      const brandName = resolveText(product.brand);
      const matchesSearch = !term
        || productName.toLowerCase().includes(term)
        || product.sku?.toLowerCase().includes(term)
        || brandName.toLowerCase().includes(term);
      const matchesCategory = !filters.selectedCategory || product.categoryId === filters.selectedCategory;
      const matchesStatus = !filters.selectedStatus || product.status === filters.selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, filters]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedStatus('');
  };

  const renderStatusBadge = (status) => {
    const meta = statusMeta[status] || statusMeta.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${meta.badge}`}>
        {meta.label}
      </span>
    );
  };

  const resolveStockState = (stock, minStock) => {
    if (stock <= 0) return { text: 'نفذ المخزون', className: 'text-red-600 font-bold' };
    if (stock <= minStock) return { text: 'مخزون منخفض', className: 'text-yellow-600 font-medium' };
    return { text: 'متوفر', className: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="products-table-loading">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-table">
      <div className="table-filters mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="بحث بالاسم، SKU، أو العلامة التجارية..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full"
          />

          <Select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full"
          >
            <option value="">جميع الفئات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="w-full"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </Select>

          <div className="flex items-end">
            <Button variant="outline" onClick={handleClearFilters} className="w-full">
              مسح الفلاتر
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المخزون</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || selectedCategory || selectedStatus
                    ? 'لا توجد منتجات تطابق البحث'
                    : 'لا توجد منتجات'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const stockState = resolveStockState(product.stock, product.minStock);
                const category = categories.find((item) => item.id === product.categoryId);
                const productName = resolveText(product.name);
                const brandName = resolveText(product.brand);
                const categoryName = resolveText(category?.name, '-');

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image && (
                          <img className="h-10 w-10 rounded-full object-cover ml-3" src={product.image} alt={productName || 'product image'} />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{productName || '—'}</div>
                          {brandName && <div className="text-sm text-gray-500">{brandName}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{categoryName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price ? `${product.price.toFixed(2)} ر.س` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.stock || 0}</div>
                      <div className={`text-xs ${stockState.className}`}>{stockState.text}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(product.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit?.(product)}>
                          تعديل
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onManageImages?.(product)}>
                          الصور
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onManageTiers?.(product)}>
                          الأسعار
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onDelete?.(product)}>
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredProducts.length > 0 && (
        <div className="table-summary mt-4 text-sm text-gray-600">
          عرض {filteredProducts.length} من {products.length} منتج
        </div>
      )}
    </div>
  );
};

export default ProductsTable;

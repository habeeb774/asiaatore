import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage, LocalizedText, CurrencyDisplay, DateDisplay } from '../../contexts/LanguageContext';
import { useNotifications } from '../../components/Notification/Notification';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';
import Modal from '../../ui/Modal';
import ConfirmModal from '../admin/ConfirmModal';

const InventoryManager = ({ className = '' }) => {
  const { t, language } = useLanguage();
  const { success, error } = useNotifications();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: 'all', // all, in_stock, low_stock, out_of_stock
    sortBy: 'name', // name, stock, price, updated
    sortOrder: 'asc'
  });

  // Bulk operations
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOperation, setBulkOperation] = useState('');
  const [bulkValue, setBulkValue] = useState('');

  // Transfer operations
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    products: [],
    quantity: 1
  });

  // Edit operations
  const [editingProduct, setEditingProduct] = useState(null);
  const [editData, setEditData] = useState({});

  // Warehouses
  const warehouses = useMemo(() => [
    { id: 'main', name: t('mainWarehouse') },
    { id: 'secondary', name: t('secondaryWarehouse') },
    { id: 'online', name: t('onlineStore') }
  ], [t]);

  // Load products
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/inventory');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        error(t('failedToLoadInventory'));
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      error(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [t, error]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Stock status filter
      switch (filters.stockStatus) {
        case 'in_stock':
          if (product.stock <= 0) return false;
          break;
        case 'low_stock':
          if (product.stock > 10 || product.stock <= 0) return false;
          break;
        case 'out_of_stock':
          if (product.stock > 0) return false;
          break;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'updated':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [products, filters]);

  // Handle product selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length
        ? []
        : filteredProducts.map(p => p.id)
    );
  };

  // Bulk operations
  const handleBulkOperation = async () => {
    if (!bulkOperation || selectedProducts.length === 0) return;

    try {
      const response = await fetch('/api/admin/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: bulkOperation,
          productIds: selectedProducts,
          value: bulkValue
        })
      });

      if (response.ok) {
        success(t('bulkOperationCompleted'));
        setShowBulkModal(false);
        setSelectedProducts([]);
        setBulkOperation('');
        setBulkValue('');
        loadProducts();
      } else {
        error(t('bulkOperationFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Transfer operations
  const handleTransfer = async () => {
    if (!transferData.fromWarehouse || !transferData.toWarehouse || transferData.products.length === 0) {
      error(t('invalidTransferData'));
      return;
    }

    try {
      const response = await fetch('/api/admin/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });

      if (response.ok) {
        success(t('transferCompleted'));
        setShowTransferModal(false);
        setTransferData({
          fromWarehouse: '',
          toWarehouse: '',
          products: [],
          quantity: 1
        });
        loadProducts();
      } else {
        error(t('transferFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Edit operations
  const handleEdit = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`/api/admin/inventory/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        success(t('productUpdated'));
        setEditingProduct(null);
        setEditData({});
        loadProducts();
      } else {
        error(t('updateFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Export inventory
  const handleExport = () => {
    const csvContent = [
      ['Name', 'SKU', 'Stock', 'Price', 'Category', 'Status'].join(','),
      ...filteredProducts.map(p => [
        `"${p.name}"`,
        p.sku || '',
        p.stock,
        p.price,
        p.category || '',
        p.stock > 0 ? 'In Stock' : 'Out of Stock'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { status: 'out', label: t('outOfStock'), color: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { status: 'low', label: t('lowStock'), color: 'text-orange-600 bg-orange-100' };
    return { status: 'in', label: t('inStock'), color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="tableHeader" />
        {[...Array(10)].map((_, i) => (
          <SkeletonLoader key={i} type="tableRow" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${language.direction === 'rtl' ? 'rtl' : 'ltr'} ${className}`} dir={language.direction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('inventoryManagement')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageProductsStock', { count: products.length })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            {t('exportInventory')}
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('transferStock')}
          </button>
          {selectedProducts.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              {t('bulkOperations')} ({selectedProducts.length})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder={t('searchProducts')}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('allCategories')}</option>
              {/* Add categories here */}
            </select>
          </div>

          <div>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, stockStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('allStockStatuses')}</option>
              <option value="in_stock">{t('inStock')}</option>
              <option value="low_stock">{t('lowStock')}</option>
              <option value="out_of_stock">{t('outOfStock')}</option>
            </select>
          </div>

          <div>
            <select
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('_');
                setFilters(prev => ({ ...prev, sortBy, sortOrder }));
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="name_asc">{t('nameAZ')}</option>
              <option value="name_desc">{t('nameZA')}</option>
              <option value="stock_asc">{t('stockLowHigh')}</option>
              <option value="stock_desc">{t('stockHighLow')}</option>
              <option value="price_asc">{t('priceLowHigh')}</option>
              <option value="price_desc">{t('priceHighLow')}</option>
              <option value="updated_desc">{t('recentlyUpdated')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('stock')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('lastUpdated')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <LazyImage
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          fallbackSrc="/placeholder-product.png"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            SKU: {product.sku || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        stockStatus.status === 'out' ? 'bg-red-100 text-red-800' :
                        stockStatus.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                      <CurrencyDisplay amount={product.price} />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <DateDisplay
                        date={product.updatedAt}
                        options={{ dateStyle: 'short', timeStyle: 'short' }}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setEditData({
                            stock: product.stock,
                            price: product.price,
                            minStock: product.minStock || 0
                          });
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        {t('edit')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('noProductsFound')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('tryAdjustingFilters')}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Operations Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={t('bulkOperations')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('operation')}
            </label>
            <select
              value={bulkOperation}
              onChange={(e) => setBulkOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('selectOperation')}</option>
              <option value="update_stock">{t('updateStock')}</option>
              <option value="adjust_price">{t('adjustPrice')}</option>
              <option value="set_category">{t('setCategory')}</option>
              <option value="mark_out_of_stock">{t('markOutOfStock')}</option>
            </select>
          </div>

          {bulkOperation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {bulkOperation === 'update_stock' && t('newStockLevel')}
                {bulkOperation === 'adjust_price' && t('priceAdjustment')}
                {bulkOperation === 'set_category' && t('category')}
              </label>
              <input
                type={bulkOperation === 'adjust_price' ? 'number' : 'text'}
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder={
                  bulkOperation === 'update_stock' ? t('enterStockLevel') :
                  bulkOperation === 'adjust_price' ? t('enterPriceAdjustment') :
                  t('enterValue')
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleBulkOperation}
              disabled={!bulkOperation || !bulkValue}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={t('transferStock')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('fromWarehouse')}
              </label>
              <select
                value={transferData.fromWarehouse}
                onChange={(e) => setTransferData(prev => ({ ...prev, fromWarehouse: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{t('selectWarehouse')}</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('toWarehouse')}
              </label>
              <select
                value={transferData.toWarehouse}
                onChange={(e) => setTransferData(prev => ({ ...prev, toWarehouse: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{t('selectWarehouse')}</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('products')}
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
              {filteredProducts.map(product => (
                <label key={product.id} className="flex items-center space-x-3 rtl:space-x-reverse p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={transferData.products.includes(product.id)}
                    onChange={(e) => {
                      const productId = product.id;
                      setTransferData(prev => ({
                        ...prev,
                        products: e.target.checked
                          ? [...prev.products, productId]
                          : prev.products.filter(id => id !== productId)
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {product.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('quantity')}
            </label>
            <input
              type="number"
              min="1"
              value={transferData.quantity}
              onChange={(e) => setTransferData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => setShowTransferModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleTransfer}
              disabled={!transferData.fromWarehouse || !transferData.toWarehouse || transferData.products.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('transfer')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingProduct}
        onClose={() => {
          setEditingProduct(null);
          setEditData({});
        }}
        title={t('editProduct')}
      >
        {editingProduct && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('stock')}
              </label>
              <input
                type="number"
                min="0"
                value={editData.stock || 0}
                onChange={(e) => setEditData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('price')}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editData.price || 0}
                onChange={(e) => setEditData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('minimumStock')}
              </label>
              <input
                type="number"
                min="0"
                value={editData.minStock || 0}
                onChange={(e) => setEditData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setEditData({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InventoryManager;
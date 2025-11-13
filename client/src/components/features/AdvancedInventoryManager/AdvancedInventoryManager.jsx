import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage, LocalizedText, DateDisplay } from '../../contexts/LanguageContext';
import { useNotifications } from '../../components/Notification/Notification';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';
import Modal from '../../ui/Modal';
import ConfirmModal from '../admin/ConfirmModal';

const AdvancedInventoryManager = ({ className = '' }) => {
  const { t, language } = useLanguage();
  const { success, error } = useNotifications();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromWarehouse: '',
    toWarehouse: '',
    items: []
  });

  // Warehouses
  const [warehouses] = useState([
    { id: 'main', name: t('mainWarehouse'), location: t('downtown') },
    { id: 'secondary', name: t('secondaryWarehouse'), location: t('suburb') },
    { id: 'online', name: t('onlineWarehouse'), location: t('virtual') }
  ]);

  // Load inventory
  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/inventory?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || []);
      } else {
        error(t('failedToLoadInventory'));
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
      error(t('networkError'));
    } finally {
      setLoading(false);
    }
  }, [filters, t, error]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !item.sku.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      let aValue = a[filters.sortBy];
      let bValue = b[filters.sortBy];

      if (filters.sortBy === 'name' || filters.sortBy === 'category') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [inventory, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = inventory.length;
    const lowStock = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;
    const outOfStock = inventory.filter(i => i.quantity === 0).length;
    const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);

    return {
      total,
      lowStock,
      outOfStock,
      totalValue
    };
  }, [inventory]);

  // Handle item actions
  const handleItemAction = async (itemId, action, data = {}) => {
    try {
      const response = await fetch(`/api/admin/inventory/${itemId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        success(t(`${action}Success`));
        loadInventory();
      } else {
        error(t(`${action}Failed`));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedItems.length === 0) return;

    try {
      const response = await fetch('/api/admin/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          itemIds: selectedItems,
          data: editData
        })
      });

      if (response.ok) {
        success(t('bulkActionCompleted'));
        setShowBulkModal(false);
        setSelectedItems([]);
        setBulkAction('');
        setEditData({});
        loadInventory();
      } else {
        error(t('bulkActionFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Transfer items
  const handleTransfer = async () => {
    if (!transferData.fromWarehouse || !transferData.toWarehouse || transferData.items.length === 0) {
      error(t('transferDataIncomplete'));
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
        setTransferData({ fromWarehouse: '', toWarehouse: '', items: [] });
        loadInventory();
      } else {
        error(t('transferFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  // Edit item
  const handleEditItem = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/admin/inventory/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        success(t('itemUpdated'));
        setEditingItem(null);
        setEditData({});
        loadInventory();
      } else {
        error(t('updateFailed'));
      }
    } catch (err) {
      error(t('networkError'));
    }
  };

  const getStatusColor = (status, quantity, threshold) => {
    if (quantity === 0) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (quantity <= threshold) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getStatusText = (status, quantity, threshold) => {
    if (quantity === 0) return t('outOfStock');
    if (quantity <= threshold) return t('lowStock');
    return t('inStock');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="stats" />
        {[...Array(5)].map((_, i) => (
          <SkeletonLoader key={i} type="table-row" />
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
            {t('advancedInventoryManagement')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageStockLevels')}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            {t('transferItems')}
          </button>
          <button
            onClick={loadInventory}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('refresh')}
          </button>
          {selectedItems.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {t('bulkActions')} ({selectedItems.length})
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t('totalItems')}
          value={stats.total}
          icon="📦"
          color="blue"
        />
        <StatCard
          title={t('lowStockItems')}
          value={stats.lowStock}
          icon="⚠️"
          color="yellow"
        />
        <StatCard
          title={t('outOfStockItems')}
          value={stats.outOfStock}
          icon="❌"
          color="red"
        />
        <StatCard
          title={t('totalValue')}
          value={`$${stats.totalValue.toLocaleString()}`}
          icon="💰"
          color="green"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <input
              type="text"
              placeholder={t('searchInventory')}
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
              <option value="all">{t('allCategories')}</option>
              <option value="electronics">{t('electronics')}</option>
              <option value="clothing">{t('clothing')}</option>
              <option value="books">{t('books')}</option>
              <option value="home">{t('home')}</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">{t('allStatuses')}</option>
              <option value="in_stock">{t('inStock')}</option>
              <option value="low_stock">{t('lowStock')}</option>
              <option value="out_of_stock">{t('outOfStock')}</option>
            </select>
          </div>

          <div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="name">{t('name')}</option>
              <option value="quantity">{t('quantity')}</option>
              <option value="unitCost">{t('unitCost')}</option>
              <option value="category">{t('category')}</option>
            </select>
          </div>

          <div>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="asc">{t('ascending')}</option>
              <option value="desc">{t('descending')}</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="selectAll"
              checked={selectedItems.length === filteredInventory.length && filteredInventory.length > 0}
              onChange={(e) => {
                setSelectedItems(e.target.checked ? filteredInventory.map(i => i.id) : []);
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="selectAll" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
              {t('selectAll')}
            </label>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('select')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('sku')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('quantity')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('unitCost')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('totalValue')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('warehouse')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        setSelectedItems(prev =>
                          e.target.checked
                            ? [...prev, item.id]
                            : prev.filter(id => id !== item.id)
                        );
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <LazyImage
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded"
                        fallbackSrc="/placeholder-product.png"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {item.sku}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {item.category}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {item.quantity}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${item.unitCost}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${(item.quantity * item.unitCost).toFixed(2)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status, item.quantity, item.lowStockThreshold)}`}>
                      {getStatusText(item.status, item.quantity, item.lowStockThreshold)}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {warehouses.find(w => w.id === item.warehouse)?.name || item.warehouse}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 rtl:space-x-reverse">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setEditData({
                          quantity: item.quantity,
                          unitCost: item.unitCost,
                          lowStockThreshold: item.lowStockThreshold,
                          warehouse: item.warehouse
                        });
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => handleItemAction(item.id, 'restock')}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      {t('restock')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0h-2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('noInventoryItems')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('tryAdjustingFilters')}
            </p>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title={t('bulkActions')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('action')}
            </label>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('selectAction')}</option>
              <option value="update_quantity">{t('updateQuantity')}</option>
              <option value="update_cost">{t('updateCost')}</option>
              <option value="change_warehouse">{t('changeWarehouse')}</option>
              <option value="delete">{t('deleteSelected')}</option>
            </select>
          </div>

          {bulkAction === 'update_quantity' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newQuantity')}
              </label>
              <input
                type="number"
                value={editData.quantity || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {bulkAction === 'update_cost' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newUnitCost')}
              </label>
              <input
                type="number"
                step="0.01"
                value={editData.unitCost || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}

          {bulkAction === 'change_warehouse' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('newWarehouse')}
              </label>
              <select
                value={editData.warehouse || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, warehouse: e.target.value }))}
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
          )}

          <div className="flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => {
          setEditingItem(null);
          setEditData({});
        }}
        title={t('editItem')}
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('quantity')}
              </label>
              <input
                type="number"
                value={editData.quantity || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('unitCost')}
              </label>
              <input
                type="number"
                step="0.01"
                value={editData.unitCost || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lowStockThreshold')}
              </label>
              <input
                type="number"
                value={editData.lowStockThreshold || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('warehouse')}
              </label>
              <select
                value={editData.warehouse || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, warehouse: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => {
                  setEditingItem(null);
                  setEditData({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleEditItem}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer Modal */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title={t('transferItems')}
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
              {t('selectItemsToTransfer')}
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
              {inventory
                .filter(item => item.warehouse === transferData.fromWarehouse)
                .map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="checkbox"
                        checked={transferData.items.some(ti => ti.itemId === item.id)}
                        onChange={(e) => {
                          setTransferData(prev => ({
                            ...prev,
                            items: e.target.checked
                              ? [...prev.items, { itemId: item.id, quantity: 1, name: item.name }]
                              : prev.items.filter(ti => ti.itemId !== item.id)
                          }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">{item.name}</span>
                    </div>

                    {transferData.items.find(ti => ti.itemId === item.id) && (
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={transferData.items.find(ti => ti.itemId === item.id)?.quantity || 1}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value);
                          setTransferData(prev => ({
                            ...prev,
                            items: prev.items.map(ti =>
                              ti.itemId === item.id ? { ...ti, quantity } : ti
                            )
                          }));
                        }}
                        className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    )}
                  </div>
                ))}
            </div>
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
              disabled={!transferData.fromWarehouse || !transferData.toWarehouse || transferData.items.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('transfer')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInventoryManager;
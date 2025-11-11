import React, { useState, useEffect } from 'react';

// Advanced Inventory Management Component
const InventoryManager = ({
  products = [],
  warehouses = [],
  onInventoryUpdate,
  onLowStockAlert,
  className = ''
}) => {
  const [inventory, setInventory] = useState({});
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock, out_of_stock, in_stock
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Load inventory data
  useEffect(() => {
    loadInventory();
  }, [selectedWarehouse]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory?warehouse=${selectedWarehouse}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data.inventory || {});
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update inventory item
  const updateInventory = async (productId, warehouseId, updates) => {
    try {
      const response = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          warehouseId,
          ...updates
        })
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setInventory(prev => ({
          ...prev,
          [`${productId}_${warehouseId}`]: updatedItem
        }));

        onInventoryUpdate?.(updatedItem);

        // Check for low stock alerts
        if (updatedItem.quantity <= updatedItem.lowStockThreshold) {
          onLowStockAlert?.(updatedItem);
        }
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
    }
  };

  // Bulk update inventory
  const bulkUpdateInventory = async (updates) => {
    try {
      const response = await fetch('/api/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (response.ok) {
        const results = await response.json();
        // Refresh inventory data
        loadInventory();
        setSelectedItems([]);
        setShowBulkUpdate(false);
      }
    } catch (error) {
      console.error('Failed to bulk update inventory:', error);
    }
  };

  // Transfer inventory between warehouses
  const transferInventory = async (productId, fromWarehouseId, toWarehouseId, quantity) => {
    try {
      const response = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity
        })
      });

      if (response.ok) {
        loadInventory();
      }
    } catch (error) {
      console.error('Failed to transfer inventory:', error);
    }
  };

  // Get inventory status
  const getInventoryStatus = (item) => {
    if (!item) return 'unknown';

    if (item.quantity <= 0) return 'out_of_stock';
    if (item.quantity <= item.lowStockThreshold) return 'low_stock';
    return 'in_stock';
  };

  // Filter inventory items
  const filteredInventory = Object.values(inventory).filter(item => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!product.nameEn?.toLowerCase().includes(searchLower) &&
          !product.nameAr?.includes(searchTerm) &&
          !product.sku?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    const status = getInventoryStatus(item);
    if (filter !== 'all' && status !== filter) {
      return false;
    }

    return true;
  });

  // Calculate totals
  const totals = {
    totalItems: filteredInventory.length,
    totalValue: filteredInventory.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product?.price || 0) * item.quantity;
    }, 0),
    lowStockItems: filteredInventory.filter(item => getInventoryStatus(item) === 'low_stock').length,
    outOfStockItems: filteredInventory.filter(item => getInventoryStatus(item) === 'out_of_stock').length
  };

  // Export inventory data
  const exportInventory = () => {
    const csvData = filteredInventory.map(item => {
      const product = products.find(p => p.id === item.productId);
      const warehouse = warehouses.find(w => w.id === item.warehouseId);

      return {
        'Product Name': product?.nameEn || '',
        'SKU': product?.sku || '',
        'Warehouse': warehouse?.name || '',
        'Quantity': item.quantity,
        'Reserved': item.reservedQuantity,
        'Available': item.quantity - item.reservedQuantity,
        'Low Stock Threshold': item.lowStockThreshold,
        'Status': getInventoryStatus(item),
        'Last Updated': new Date(item.updatedAt).toLocaleDateString()
      };
    });

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`inventory-manager ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Inventory Management
          </h2>
          <div className="flex gap-2">
            <button
              onClick={exportInventory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Export CSV
            </button>
            <button
              onClick={() => setShowBulkUpdate(!showBulkUpdate)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500"
            >
              Bulk Update
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totals.totalItems}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Total Items
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              SAR {totals.totalValue.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Total Value
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {totals.lowStockItems}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">
              Low Stock Items
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totals.outOfStockItems}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">
              Out of Stock
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Items</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Update Panel */}
      {showBulkUpdate && (
        <BulkUpdatePanel
          selectedItems={selectedItems}
          onUpdate={bulkUpdateInventory}
          onClose={() => setShowBulkUpdate(false)}
        />
      )}

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Loading inventory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredInventory.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                      checked={selectedItems.length === filteredInventory.length && filteredInventory.length > 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredInventory.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const warehouse = warehouses.find(w => w.id === item.warehouseId);
                  const status = getInventoryStatus(item);

                  return (
                    <tr key={`${item.productId}_${item.warehouseId}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product?.image && (
                            <img
                              src={product.image}
                              alt={product.nameEn}
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {product?.nameEn || 'Unknown Product'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              SKU: {product?.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {warehouse?.name || 'Unknown Warehouse'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InventoryQuantityInput
                          value={item.quantity}
                          onChange={(value) => updateInventory(item.productId, item.warehouseId, { quantity: value })}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.quantity - (item.reservedQuantity || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          status === 'in_stock'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : status === 'low_stock'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => updateInventory(item.productId, item.warehouseId, {
                            lowStockThreshold: item.lowStockThreshold + 5
                          })}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Adjust Threshold
                        </button>
                        <button
                          onClick={() => transferInventory(item.productId, item.warehouseId, '', 0)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Transfer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Inventory Quantity Input Component
const InventoryQuantityInput = ({ value, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(Number(editValue));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button
          onClick={handleSave}
          className="text-green-600 hover:text-green-800 text-sm"
        >
          ✓
        </button>
        <button
          onClick={handleCancel}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
    >
      {value}
    </button>
  );
};

// Bulk Update Panel Component
const BulkUpdatePanel = ({ selectedItems, onUpdate, onClose }) => {
  const [updates, setUpdates] = useState({
    quantity: '',
    lowStockThreshold: '',
    operation: 'set' // set, add, subtract
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const bulkUpdates = selectedItems.map(itemId => ({
      itemId,
      ...updates,
      quantity: updates.quantity ? Number(updates.quantity) : undefined,
      lowStockThreshold: updates.lowStockThreshold ? Number(updates.lowStockThreshold) : undefined
    }));

    onUpdate(bulkUpdates);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Bulk Update ({selectedItems.length} items)
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Operation
            </label>
            <select
              value={updates.operation}
              onChange={(e) => setUpdates({ ...updates, operation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="set">Set to</option>
              <option value="add">Add</option>
              <option value="subtract">Subtract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={updates.quantity}
              onChange={(e) => setUpdates({ ...updates, quantity: e.target.value })}
              placeholder="Enter quantity"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Low Stock Threshold
            </label>
            <input
              type="number"
              value={updates.lowStockThreshold}
              onChange={(e) => setUpdates({ ...updates, lowStockThreshold: e.target.value })}
              placeholder="Enter threshold"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Update {selectedItems.length} Items
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryManager;
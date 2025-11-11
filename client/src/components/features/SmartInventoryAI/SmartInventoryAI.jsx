import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';
import LazyImage from '../../common/LazyImage';
import { Skeleton } from '../../shared/SkeletonLoader/SkeletonLoader';

const SmartInventoryContext = createContext();

export const useSmartInventory = () => {
  const context = useContext(SmartInventoryContext);
  if (!context) {
    throw new Error('useSmartInventory must be used within a SmartInventoryProvider');
  }
  return context;
};

export const SmartInventoryProvider = ({ children }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState({});

  // Generate AI predictions for inventory items
  const generatePrediction = useCallback((item) => {
    // Simple AI prediction logic based on item properties
    const baseDemand = item.salesVelocity === 'high' ? 50 : item.salesVelocity === 'medium' ? 25 : 10;
    const seasonalMultiplier = item.seasonal ? 1.5 : 1;
    const trendMultiplier = item.trend === 'increasing' ? 1.2 : item.trend === 'decreasing' ? 0.8 : 1;

    const predictedDemand = Math.round(baseDemand * seasonalMultiplier * trendMultiplier);
    const daysToStockout = Math.max(1, Math.floor(item.currentStock / (predictedDemand / 30)));
    const recommendedOrder = Math.max(0, item.maxStock - item.currentStock);

    // Calculate confidence based on data availability and consistency
    const confidence = Math.min(95, Math.max(60, 70 + (item.lastRestocked ? 10 : 0) + (item.trend ? 15 : 0)));

    return {
      predictedDemand,
      daysToStockout,
      recommendedOrder,
      confidence,
      factors: {
        seasonality: item.seasonal,
        trend: item.trend,
        salesVelocity: item.salesVelocity
      }
    };
  }, []);

  // Generate alerts based on inventory status
  const generateAlerts = useCallback((inventory) => {
    const alerts = [];

    inventory.forEach(item => {
      const prediction = predictions[item.id];

      // Low stock alert
      if (item.currentStock <= item.reorderPoint) {
        alerts.push({
          id: `low_stock_${item.id}`,
          type: 'warning',
          priority: 'high',
          title: 'Low Stock Alert',
          titleAr: 'تنبيه انخفاض المخزون',
          message: `${item.name} is running low (${item.currentStock} units remaining)`,
          messageAr: `${item.name} ينخفض مخزونه (${item.currentStock} وحدة متبقية)`,
          itemId: item.id,
          action: 'reorder'
        });
      }

      // Stockout risk alert
      if (prediction && prediction.daysToStockout <= 7) {
        alerts.push({
          id: `stockout_risk_${item.id}`,
          type: 'danger',
          priority: 'critical',
          title: 'Stockout Risk',
          titleAr: 'خطر نفاد المخزون',
          message: `${item.name} may run out in ${prediction.daysToStockout} days`,
          messageAr: `${item.name} قد ينفد خلال ${prediction.daysToStockout} أيام`,
          itemId: item.id,
          action: 'urgent_reorder'
        });
      }

      // Overstock alert
      if (item.currentStock > item.maxStock * 0.9) {
        alerts.push({
          id: `overstock_${item.id}`,
          type: 'info',
          priority: 'medium',
          title: 'Overstock Alert',
          titleAr: 'تنبيه زيادة المخزون',
          message: `${item.name} has excess inventory (${item.currentStock}/${item.maxStock})`,
          messageAr: `${item.name} لديه مخزون زائد (${item.currentStock}/${item.maxStock})`,
          itemId: item.id,
          action: 'review'
        });
      }

      // Seasonal preparation alert
      if (item.seasonal && prediction?.factors?.seasonality) {
        const nextSeason = new Date();
        nextSeason.setMonth(nextSeason.getMonth() + 3);
        alerts.push({
          id: `seasonal_${item.id}`,
          type: 'info',
          priority: 'low',
          title: 'Seasonal Preparation',
          titleAr: 'تحضير موسمي',
          message: `Prepare ${item.name} inventory for upcoming season`,
          messageAr: `تحضير مخزون ${item.name} للموسم القادم`,
          itemId: item.id,
          action: 'plan'
        });
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [predictions]);

  // Generate analytics
  const generateAnalytics = useCallback((inventory) => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0);
    const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderPoint).length;
    const outOfStockRisk = inventory.filter(item => predictions[item.id]?.daysToStockout <= 7).length;

    const categoryBreakdown = inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.currentStock;
      return acc;
    }, {});

    return {
      totalValue,
      totalItems,
      lowStockItems,
      outOfStockRisk,
      categoryBreakdown,
      healthScore: Math.max(0, 100 - (lowStockItems * 10) - (outOfStockRisk * 15))
    };
  }, [predictions]);

  // Initialize with sample inventory data
  useEffect(() => {
    const sampleInventory = [
      {
        id: 1,
        name: 'Wireless Headphones',
        sku: 'WH-001',
        category: 'Electronics',
        currentStock: 45,
        minStock: 20,
        maxStock: 100,
        reorderPoint: 25,
        unitCost: 25.99,
        sellingPrice: 79.99,
        supplier: 'TechCorp',
        location: 'Warehouse A',
        lastRestocked: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        salesVelocity: 'high', // high, medium, low
        seasonal: true,
        trend: 'increasing'
      },
      {
        id: 2,
        name: 'Designer Dress',
        sku: 'DD-002',
        category: 'Fashion',
        currentStock: 12,
        minStock: 15,
        maxStock: 50,
        reorderPoint: 18,
        unitCost: 45.00,
        sellingPrice: 129.99,
        supplier: 'FashionHub',
        location: 'Warehouse B',
        lastRestocked: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        salesVelocity: 'medium',
        seasonal: true,
        trend: 'stable'
      },
      {
        id: 3,
        name: 'Smart Watch',
        sku: 'SW-003',
        category: 'Electronics',
        currentStock: 8,
        minStock: 10,
        maxStock: 75,
        reorderPoint: 12,
        unitCost: 89.99,
        sellingPrice: 249.99,
        supplier: 'GadgetWorld',
        location: 'Warehouse A',
        lastRestocked: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        salesVelocity: 'high',
        seasonal: false,
        trend: 'increasing'
      }
    ];

    setInventoryData(sampleInventory);

    // Generate AI predictions
    const predictions = {};
    sampleInventory.forEach(item => {
      predictions[item.id] = generatePrediction(item);
    });
    setPredictions(predictions);

    // Generate alerts
    const alerts = generateAlerts(sampleInventory);
    setAlerts(alerts);

    // Generate analytics
    setAnalytics(generateAnalytics(sampleInventory));
  }, [generateAlerts, generateAnalytics, generatePrediction]);

  // Update inventory
  const updateInventory = (itemId, updates) => {
    setInventoryData(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        // Regenerate prediction for updated item
        setPredictions(prevPred => ({
          ...prevPred,
          [itemId]: generatePrediction(updatedItem)
        }));
        return updatedItem;
      }
      return item;
    }));

    // Regenerate alerts and analytics
    setTimeout(() => {
      const updatedInventory = inventoryData.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      setAlerts(generateAlerts(updatedInventory));
      setAnalytics(generateAnalytics(updatedInventory));
    }, 100);
  };

  // Auto-reorder suggestion
  const getAutoReorderSuggestions = () => {
    return inventoryData
      .filter(item => item.currentStock <= item.reorderPoint)
      .map(item => ({
        item,
        prediction: predictions[item.id],
        suggestedQuantity: predictions[item.id]?.recommendedOrder || item.maxStock - item.currentStock,
        priority: item.currentStock <= item.minStock ? 'urgent' : 'normal'
      }))
      .sort((a, b) => {
        if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
        if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
        return (b.prediction?.predictedDemand || 0) - (a.prediction?.predictedDemand || 0);
      });
  };

  // Demand forecasting
  const getDemandForecast = (itemId, days = 30) => {
    const item = inventoryData.find(i => i.id === itemId);
    if (!item) return null;

    const prediction = predictions[itemId];
    if (!prediction) return null;

    const forecast = [];
    const baseDailyDemand = prediction.predictedDemand / 30;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Add some variation and trends
      const dayOfWeek = date.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1;
      const randomVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2

      const dailyDemand = Math.round(baseDailyDemand * weekendMultiplier * randomVariation);

      forecast.push({
        date,
        predictedDemand: dailyDemand,
        confidence: prediction.confidence
      });
    }

    return forecast;
  };

  const value = {
    inventoryData,
    predictions,
    alerts,
    analytics,
    updateInventory,
    getAutoReorderSuggestions,
    getDemandForecast
  };

  return (
    <SmartInventoryContext.Provider value={value}>
      {children}
    </SmartInventoryContext.Provider>
  );
};

const SmartInventoryDashboard = ({ className = '' }) => {
  const {
    inventoryData,
    predictions,
    alerts,
    analytics,
    getAutoReorderSuggestions
  } = useSmartInventory();

  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);

  const tabs = [
    { id: 'overview', label: language.code === 'ar' ? 'نظرة عامة' : 'Overview' },
    { id: 'inventory', label: language.code === 'ar' ? 'المخزون' : 'Inventory' },
    { id: 'alerts', label: language.code === 'ar' ? 'التنبيهات' : 'Alerts', count: alerts.length },
    { id: 'analytics', label: language.code === 'ar' ? 'التحليلات' : 'Analytics' }
  ];

  const reorderSuggestions = getAutoReorderSuggestions();

  return (
    <div className={`smart-inventory-dashboard ${className}`} dir={language.direction}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language.code === 'ar' ? 'الذكاء الاصطناعي للمخزون' : 'Smart Inventory AI'}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              analytics.healthScore >= 80 ? 'bg-green-100 text-green-800' :
              analytics.healthScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {language.code === 'ar' ? 'صحة المخزون' : 'Inventory Health'}: {analytics.healthScore}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${analytics.totalValue?.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {language.code === 'ar' ? 'إجمالي قيمة المخزون' : 'Total Inventory Value'}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analytics.totalItems}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {language.code === 'ar' ? 'إجمالي العناصر' : 'Total Items'}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analytics.lowStockItems}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  {language.code === 'ar' ? 'عناصر منخفضة المخزون' : 'Low Stock Items'}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {analytics.outOfStockRisk}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  {language.code === 'ar' ? 'مخاطر نفاد المخزون' : 'Stockout Risks'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {inventoryData.map((item) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  prediction={predictions[item.id]}
                  onClick={() => setSelectedItem(item)}
                />
              ))}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    {language.code === 'ar' ? 'لا توجد تنبيهات حالياً' : 'No alerts at this time'}
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language.code === 'ar' ? 'اقتراحات إعادة الطلب' : 'Reorder Suggestions'}
                </h3>
                <div className="space-y-3">
                  {reorderSuggestions.map((suggestion) => (
                    <ReorderSuggestionCard key={suggestion.item.id} suggestion={suggestion} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <InventoryItemModal
          item={selectedItem}
          prediction={predictions[selectedItem.id]}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

const InventoryItemCard = ({ item, prediction, onClick }) => {
  const { language } = useLanguage();

  const getStockStatus = () => {
    if (item.currentStock <= item.minStock) return { status: 'critical', color: 'red' };
    if (item.currentStock <= item.reorderPoint) return { status: 'warning', color: 'yellow' };
    if (item.currentStock > item.maxStock * 0.9) return { status: 'overstock', color: 'blue' };
    return { status: 'good', color: 'green' };
  };

  const stockStatus = getStockStatus();

  return (
    <div
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{item.sku} • {item.category}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          stockStatus.color === 'red' ? 'bg-red-100 text-red-800' :
          stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          stockStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {item.currentStock} / {item.maxStock}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">
            {language.code === 'ar' ? 'التنبؤ الشهري' : 'Monthly Forecast'}:
          </span>
          <span className="font-medium text-gray-900 dark:text-white ml-1">
            {prediction?.predictedDemand || 0}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">
            {language.code === 'ar' ? 'أيام حتى النفاد' : 'Days to Stockout'}:
          </span>
          <span className="font-medium text-gray-900 dark:text-white ml-1">
            {prediction?.daysToStockout || 0}
          </span>
        </div>
      </div>

      {prediction && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {prediction.confidence}% {language.code === 'ar' ? 'ثقة' : 'confidence'}
          </span>
        </div>
      )}
    </div>
  );
};

const AlertCard = ({ alert }) => {
  const { language } = useLanguage();

  const getAlertIcon = (type) => {
    switch (type) {
      case 'danger': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'danger': return 'border-red-200 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${getAlertColor(alert.type)}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getAlertIcon(alert.type)}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {language.code === 'ar' ? alert.titleAr || alert.title : alert.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {language.code === 'ar' ? alert.messageAr || alert.message : alert.message}
          </p>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
              {language.code === 'ar' ? 'عرض' : 'View'}
            </button>
            <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
              {language.code === 'ar' ? 'تجاهل' : 'Dismiss'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReorderSuggestionCard = ({ suggestion }) => {
  const { language } = useLanguage();

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
            📦
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {suggestion.item.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language.code === 'ar' ? 'مخزون حالي' : 'Current stock'}: {suggestion.item.currentStock}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {suggestion.suggestedQuantity}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {language.code === 'ar' ? 'الكمية المقترحة' : 'Suggested Qty'}
          </div>
        </div>

        <div className="flex gap-2">
          <button className={`px-3 py-1 text-sm rounded font-medium ${
            suggestion.priority === 'urgent'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors`}>
            {language.code === 'ar' ? 'إعادة طلب' : 'Reorder'}
          </button>
        </div>
      </div>
    </div>
  );
};

const InventoryItemModal = ({ item, prediction, isOpen, onClose }) => {
  const { language } = useSmartInventory();
  const [forecastDays, setForecastDays] = useState(30);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="inventory-item-modal" dir={language.direction}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {item.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {item.sku} • {item.category}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language.code === 'ar' ? 'حالة المخزون' : 'Stock Status'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'المخزون الحالي' : 'Current Stock'}:
                  </span>
                  <span className="font-medium">{item.currentStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'الحد الأدنى' : 'Minimum Stock'}:
                  </span>
                  <span className="font-medium">{item.minStock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'نقطة إعادة الطلب' : 'Reorder Point'}:
                  </span>
                  <span className="font-medium">{item.reorderPoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'الحد الأقصى' : 'Maximum Stock'}:
                  </span>
                  <span className="font-medium">{item.maxStock}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language.code === 'ar' ? 'التنبؤات الذكية' : 'AI Predictions'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'الطلب المتوقع شهرياً' : 'Monthly Demand Forecast'}:
                  </span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {prediction?.predictedDemand || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'أيام حتى النفاد' : 'Days to Stockout'}:
                  </span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {prediction?.daysToStockout || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'الكمية المقترحة لإعادة الطلب' : 'Recommended Order Qty'}:
                  </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {prediction?.recommendedOrder || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    {language.code === 'ar' ? 'مستوى الثقة' : 'Confidence Level'}:
                  </span>
                  <span className="font-medium">{prediction?.confidence || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demand Forecast Chart Placeholder */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language.code === 'ar' ? 'تنبؤ الطلب' : 'Demand Forecast'}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language.code === 'ar' ? 'الأيام القادمة' : 'Next days'}:
                </span>
                <select
                  value={forecastDays}
                  onChange={(e) => setForecastDays(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={7}>7 {language.code === 'ar' ? 'أيام' : 'days'}</option>
                  <option value={30}>30 {language.code === 'ar' ? 'يام' : 'days'}</option>
                  <option value={90}>90 {language.code === 'ar' ? 'يام' : 'days'}</option>
                </select>
              </div>
              <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">
                  📊 {language.code === 'ar' ? 'رسم بياني تفاعلي قادم' : 'Interactive chart coming soon'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export { SmartInventoryDashboard };
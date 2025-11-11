import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage, LocalizedText, CurrencyDisplay, DateDisplay } from '../../contexts/LanguageContext';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';

const AnalyticsDashboard = ({ className = '' }) => {
  const { t, language, formatNumber, formatCurrency } = useLanguage();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!analytics) return null;

    const { orders, revenue, customers, products } = analytics;

    return {
      totalRevenue: revenue?.total || 0,
      totalOrders: orders?.total || 0,
      totalCustomers: customers?.total || 0,
      averageOrderValue: orders?.total > 0 ? (revenue?.total || 0) / orders?.total : 0,
      conversionRate: customers?.total > 0 ? (orders?.total / customers?.total) * 100 : 0,
      topProducts: products?.top || [],
      salesByCategory: products?.byCategory || [],
      revenueTrend: revenue?.trend || [],
      customerGrowth: customers?.growth || [],
      orderStatus: orders?.byStatus || {}
    };
  }, [analytics]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!metrics) return null;

    switch (selectedMetric) {
      case 'revenue':
        return {
          labels: metrics.revenueTrend.map(item => item.date),
          data: metrics.revenueTrend.map(item => item.value)
        };
      case 'orders':
        return {
          labels: metrics.revenueTrend.map(item => item.date),
          data: metrics.revenueTrend.map(item => item.orders)
        };
      case 'customers':
        return {
          labels: metrics.customerGrowth.map(item => item.date),
          data: metrics.customerGrowth.map(item => item.value)
        };
      default:
        return null;
    }
  }, [metrics, selectedMetric]);

  const timeRangeOptions = [
    { value: '7d', label: t('last7Days') },
    { value: '30d', label: t('last30Days') },
    { value: '90d', label: t('last90Days') },
    { value: '1y', label: t('lastYear') }
  ];

  const metricOptions = [
    { value: 'revenue', label: t('revenue'), icon: '💰' },
    { value: 'orders', label: t('orders'), icon: '📦' },
    { value: 'customers', label: t('customers'), icon: '👥' }
  ];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <SkeletonLoader key={i} type="card" />
          ))}
        </div>
        <SkeletonLoader type="chart" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonLoader type="table" />
          <SkeletonLoader type="chart" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${language.direction === 'rtl' ? 'rtl' : 'ltr'} ${className}`} dir={language.direction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('analyticsDashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('trackYourBusinessPerformance')}
          </p>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('totalRevenue')}
          value={formatCurrency(metrics.totalRevenue)}
          change={analytics?.revenue?.change}
          icon="💰"
          color="blue"
        />
        <MetricCard
          title={t('totalOrders')}
          value={formatNumber(metrics.totalOrders)}
          change={analytics?.orders?.change}
          icon="📦"
          color="green"
        />
        <MetricCard
          title={t('totalCustomers')}
          value={formatNumber(metrics.totalCustomers)}
          change={analytics?.customers?.change}
          icon="👥"
          color="purple"
        />
        <MetricCard
          title={t('averageOrderValue')}
          value={formatCurrency(metrics.averageOrderValue)}
          change={analytics?.orders?.avgChange}
          icon="📊"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('performanceTrends')}
            </h2>

            <div className="flex space-x-2 rtl:space-x-reverse">
              {metricOptions.map(metric => (
                <button
                  key={metric.value}
                  onClick={() => setSelectedMetric(metric.value)}
                  className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMetric === metric.value
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{metric.icon}</span>
                  <span>{metric.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simple Chart Visualization */}
          <div className="h-64 flex items-end justify-between space-x-2 rtl:space-x-reverse">
            {chartData?.data.map((value, index) => {
              const maxValue = Math.max(...chartData.data);
              const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 transform -rotate-45 origin-top">
                    {chartData.labels[index]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('conversionRate')}
          </h3>

          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {metrics.conversionRate.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('customersToOrders')}
            </p>
          </div>

          {/* Progress Circle */}
          <div className="mt-6">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${metrics.conversionRate * 0.01 * 100}, 100`}
                  className="text-gray-200 dark:text-gray-700"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${metrics.conversionRate}, 100`}
                  className="text-blue-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {metrics.conversionRate.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('topProducts')}
          </h3>

          <div className="space-y-4">
            {metrics.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400">
                  {index + 1}
                </div>

                <LazyImage
                  src={product.image}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                  fallbackSrc="/placeholder-product.png"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatNumber(product.sales)} {t('sales')}
                  </p>
                </div>

                <div className="text-right">
                  <CurrencyDisplay
                    amount={product.revenue}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('salesByCategory')}
          </h3>

          <div className="space-y-4">
            {metrics.salesByCategory.map((category) => {
              const percentage = (category.revenue / metrics.totalRevenue) * 100;

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatNumber(category.orders)} {t('orders')}</span>
                    <CurrencyDisplay amount={category.revenue} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('orderStatus')}
          </h3>

          <div className="space-y-3">
            {Object.entries(metrics.orderStatus).map(([status, count]) => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              };

              return (
                <div key={status} className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                    {t(status)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(count)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('recentActivity')}
          </h3>

          <div className="space-y-4">
            {analytics?.activity?.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 rtl:space-x-reverse">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {activity.type === 'order' && '📦'}
                  {activity.type === 'customer' && '👤'}
                  {activity.type === 'product' && '🛍️'}
                  {activity.type === 'payment' && '💳'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <DateDisplay
                      date={activity.timestamp}
                      options={{ dateStyle: 'short', timeStyle: 'short' }}
                    />
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('noRecentActivity')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, icon, color }) => {
  const { t } = useLanguage();

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const isPositive = change >= 0;

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

          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <svg
                className={`w-4 h-4 mr-1 ${isPositive ? '' : 'transform rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>
                {isPositive ? '+' : ''}{change.toFixed(1)}% {t('fromLastPeriod')}
              </span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
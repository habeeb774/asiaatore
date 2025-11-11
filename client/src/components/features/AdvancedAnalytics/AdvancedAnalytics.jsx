import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage, LocalizedText, DateDisplay } from '../../contexts/LanguageContext';
import { LazyImage } from '../shared/LazyImage/LazyImage';
import { SkeletonLoader } from '../shared/SkeletonLoader/SkeletonLoader';

const AdvancedAnalytics = ({
  className = '',
  dateRange = '30d',
  setDateRange, // Add setDateRange prop
  refreshInterval = 300000 // 5 minutes
}) => {
  const { t, language } = useLanguage();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [chartType, setChartType] = useState('line');

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/advanced?range=${dateRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // Auto-refresh
  useEffect(() => {
    loadAnalytics();

    const interval = setInterval(loadAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [dateRange, refreshInterval, loadAnalytics]);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!analytics) return null;

    const {
      revenue,
      orders,
      customers,
      conversion,
      avgOrderValue,
      customerLifetimeValue,
      returnRate,
      satisfaction
    } = analytics;

    return {
      revenue: {
        current: revenue.current,
        previous: revenue.previous,
        change: ((revenue.current - revenue.previous) / revenue.previous) * 100,
        trend: revenue.trend
      },
      orders: {
        current: orders.current,
        previous: orders.previous,
        change: ((orders.current - orders.previous) / orders.previous) * 100,
        trend: orders.trend
      },
      customers: {
        current: customers.current,
        previous: customers.previous,
        change: ((customers.current - customers.previous) / customers.previous) * 100,
        trend: customers.trend
      },
      conversion: {
        current: conversion.current,
        previous: conversion.previous,
        change: ((conversion.current - conversion.previous) / conversion.previous) * 100,
        trend: conversion.trend
      },
      avgOrderValue: {
        current: avgOrderValue.current,
        previous: avgOrderValue.previous,
        change: ((avgOrderValue.current - avgOrderValue.previous) / avgOrderValue.previous) * 100,
        trend: avgOrderValue.trend
      },
      customerLifetimeValue: {
        current: customerLifetimeValue.current,
        previous: customerLifetimeValue.previous,
        change: ((customerLifetimeValue.current - customerLifetimeValue.previous) / customerLifetimeValue.previous) * 100,
        trend: customerLifetimeValue.trend
      },
      returnRate: {
        current: returnRate.current,
        previous: returnRate.previous,
        change: ((returnRate.current - returnRate.previous) / returnRate.previous) * 100,
        trend: returnRate.trend
      },
      satisfaction: {
        current: satisfaction.current,
        previous: satisfaction.previous,
        change: ((satisfaction.current - satisfaction.previous) / satisfaction.previous) * 100,
        trend: satisfaction.trend
      }
    };
  }, [analytics]);

  // Chart data (placeholder for future chart implementation)
  // const chartData = useMemo(() => {
  //   if (!analytics) return null;
  //
  //   const data = analytics[selectedMetric]?.data || [];
  //   return {
  //     labels: data.map(d => d.date),
  //     datasets: [{
  //       label: t(selectedMetric),
  //       data: data.map(d => d.value),
  //       borderColor: getMetricColor(selectedMetric),
  //       backgroundColor: getMetricColor(selectedMetric, 0.1),
  //       fill: chartType === 'area',
  //       tension: 0.4
  //     }]
  //   };
  // }, [analytics, selectedMetric, chartType, t]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(language.code, {
      style: 'currency',
      currency: 'SAR' // Default to SAR, can be made configurable
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat(language.code).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="stats" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <SkeletonLoader key={i} type="metric" />
          ))}
        </div>
        <SkeletonLoader type="chart" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {t('noAnalyticsData')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('analyticsDataWillLoad')}
        </p>
      </div>
    );
  }

  return (
    <div className={`${language.direction === 'rtl' ? 'rtl' : 'ltr'} ${className}`} dir={language.direction}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('advancedAnalytics')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('analyticsDescription')}
          </p>
        </div>

        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="7d">{t('last7Days')}</option>
            <option value="30d">{t('last30Days')}</option>
            <option value="90d">{t('last90Days')}</option>
            <option value="1y">{t('lastYear')}</option>
          </select>

          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {t('lastUpdated')}: <DateDisplay date={lastUpdated} />
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title={t('totalRevenue')}
          value={formatCurrency(metrics.revenue.current)}
          change={metrics.revenue.change}
          trend={metrics.revenue.trend}
          color="green"
        />
        <MetricCard
          title={t('totalOrders')}
          value={formatNumber(metrics.orders.current)}
          change={metrics.orders.change}
          trend={metrics.orders.trend}
          color="blue"
        />
        <MetricCard
          title={t('totalCustomers')}
          value={formatNumber(metrics.customers.current)}
          change={metrics.customers.change}
          trend={metrics.customers.trend}
          color="purple"
        />
        <MetricCard
          title={t('conversionRate')}
          value={`${metrics.conversion.current.toFixed(1)}%`}
          change={metrics.conversion.change}
          trend={metrics.conversion.trend}
          color="yellow"
        />
        <MetricCard
          title={t('avgOrderValue')}
          value={formatCurrency(metrics.avgOrderValue.current)}
          change={metrics.avgOrderValue.change}
          trend={metrics.avgOrderValue.trend}
          color="red"
        />
        <MetricCard
          title={t('customerLifetimeValue')}
          value={formatCurrency(metrics.customerLifetimeValue.current)}
          change={metrics.customerLifetimeValue.change}
          trend={metrics.customerLifetimeValue.trend}
          color="emerald"
        />
        <MetricCard
          title={t('returnRate')}
          value={`${metrics.returnRate.current.toFixed(1)}%`}
          change={metrics.returnRate.change}
          trend={metrics.returnRate.trend}
          color="red"
          invertTrend={true}
        />
        <MetricCard
          title={t('customerSatisfaction')}
          value={`${metrics.satisfaction.current.toFixed(1)}%`}
          change={metrics.satisfaction.change}
          trend={metrics.satisfaction.trend}
          color="orange"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('performanceTrends')}
          </h2>

          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="revenue">{t('revenue')}</option>
              <option value="orders">{t('orders')}</option>
              <option value="customers">{t('customers')}</option>
              <option value="conversion">{t('conversionRate')}</option>
              <option value="avgOrderValue">{t('avgOrderValue')}</option>
              <option value="customerLifetimeValue">{t('customerLifetimeValue')}</option>
              <option value="returnRate">{t('returnRate')}</option>
              <option value="satisfaction">{t('customerSatisfaction')}</option>
            </select>

            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  chartType === 'line'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t('line')}
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  chartType === 'area'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t('area')}
              </button>
            </div>
          </div>
        </div>

        <div className="h-80">
          {/* Chart would be rendered here using a charting library like Chart.js or Recharts */}
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>{t('chartPlaceholder')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('topProducts')}
          </h3>

          <div className="space-y-4">
            {analytics.topProducts?.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
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

                <div className="text-right rtl:text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('trafficSources')}
          </h3>

          <div className="space-y-4">
            {analytics.trafficSources?.map((source) => (
              <div key={source.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {source.name}
                  </span>
                </div>

                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatNumber(source.visitors)}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {source.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, change, trend, invertTrend = false }) => {

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = () => {
    const isPositive = invertTrend ? change < 0 : change > 0;

    if (trend === 'up' || isPositive) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    } else if (trend === 'down' || !isPositive) {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  const getChangeColor = () => {
    const isPositive = invertTrend ? change < 0 : change > 0;
    return isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
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

        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getChangeColor()}`}>
            {formatPercentage(change)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
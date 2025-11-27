import React, { useState, useEffect } from 'react';
import { motion } from '../../lib/framerLazy';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { adminApi } from '../../services/apiService';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowRight,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * AdminDashboardModern - لوحة التحكم الحديثة
 * 
 * الميزات:
 * - تصميم عصري مع تأثيرات بصرية
 * - إحصائيات مباشرة
 * - رسوم بيانية تفاعلية
 * - دعم كامل للـ RTL
 * - أداء محسّن مع React Query
 */
const AdminDashboardModern = () => {
  const { locale, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setting } = useSettings();
  
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  const isRTL = locale === 'ar';
  
  // جلب الإحصائيات العامة
  const { data: statsOverview, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats-overview', selectedPeriod],
    queryFn: () => adminApi.getStatsOverview(selectedPeriod),
    refetchInterval: refreshInterval,
    staleTime: 10000
  });
  
  // جلب الإحصائيات المالية
  const { data: statsFinancials, isLoading: financialsLoading } = useQuery({
    queryKey: ['admin-stats-financials', selectedPeriod],
    queryFn: () => adminApi.getStatsFinancials(selectedPeriod),
    refetchInterval: refreshInterval,
    staleTime: 10000
  });
  
  // جلب المستخدمين الجدد
  const { data: recentUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => adminApi.getRecentUsers({ limit: 5 }),
    refetchInterval: 60000,
    staleTime: 30000
  });
  
  // جلب الطلبات الأخيرة
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => adminApi.getRecentOrders({ limit: 5 }),
    refetchInterval: 30000,
    staleTime: 15000
  });
  
  // جلب المنتجات الأكثر مبيعاً
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: () => adminApi.getTopProducts({ limit: 5 }),
    refetchInterval: 120000,
    staleTime: 60000
  });
  
  // فترات الوقت
  const periods = [
    { value: 'today', label: t('today') },
    { value: 'week', label: t('this_week') },
    { value: 'month', label: t('this_month') },
    { value: 'year', label: t('this_year') }
  ];
  
  // تنسيق العملة
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount || 0);
  };
  
  // تنسيق الأرقام
  const formatNumber = (num) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US').format(num || 0);
  };
  
  // حساب نسبة التغيير
  const getChangePercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  const stats = statsOverview?.data || {};
  const financials = statsFinancials?.data || {};
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('admin_dashboard')}
            </h1>
            <p className="text-gray-600">
              {t('welcome_back')}, {user?.name || t('admin')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Activity size={20} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              financials.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {financials.revenueChange >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {Math.abs(financials.revenueChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(financials.totalRevenue)}
          </h3>
          <p className="text-sm text-gray-600">{t('total_revenue')}</p>
        </motion.div>
        
        {/* Total Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="text-blue-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              stats.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.ordersChange >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {Math.abs(stats.ordersChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(stats.totalOrders)}
          </h3>
          <p className="text-sm text-gray-600">{t('total_orders')}</p>
        </motion.div>
        
        {/* Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              stats.usersChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.usersChange >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {Math.abs(stats.usersChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(stats.totalUsers)}
          </h3>
          <p className="text-sm text-gray-600">{t('total_users')}</p>
        </motion.div>
        
        {/* Total Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="text-orange-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm ${
              stats.productsChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.productsChange >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {Math.abs(stats.productsChange || 0).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {formatNumber(stats.totalProducts)}
          </h3>
          <p className="text-sm text-gray-600">{t('total_products')}</p>
        </motion.div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('revenue_overview')}
            </h3>
            <BarChart3 className="text-gray-400" size={20} />
          </div>
          
          {financialsLoading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PieChart size={48} className="mx-auto mb-2 text-gray-300" />
                <p>{t('chart_coming_soon')}</p>
              </div>
            </div>
          )}
        </motion.div>
        
        {/* Orders Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('orders_overview')}
            </h3>
            <Activity className="text-gray-400" size={20} />
          </div>
          
          {ordersLoading ? (
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 size={48} className="mx-auto mb-2 text-gray-300" />
                <p>{t('chart_coming_soon')}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('recent_orders')}
            </h3>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('view_all')}
            </button>
          </div>
          
          {ordersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders?.data?.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-500">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                    <p className={`text-xs px-2 py-1 rounded-full inline-block ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {t(order.status)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('new_users')}
            </h3>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('view_all')}
            </button>
          </div>
          
          {usersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentUsers?.data?.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('top_products')}
            </h3>
            <button
              onClick={() => navigate('/admin/products')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {t('view_all')}
            </button>
          </div>
          
          {productsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts?.data?.slice(0, 3).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(product.sold_count)} {t('sold')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t('quick_actions')}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Package className="text-blue-600" size={24} />
            <span className="text-sm font-medium text-blue-900">{t('add_product')}</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ShoppingCart className="text-green-600" size={24} />
            <span className="text-sm font-medium text-green-900">{t('view_orders')}</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/users')}
            className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Users className="text-purple-600" size={24} />
            <span className="text-sm font-medium text-purple-900">{t('manage_users')}</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/settings')}
            className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <AlertCircle className="text-orange-600" size={24} />
            <span className="text-sm font-medium text-orange-900">{t('settings')}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboardModern;

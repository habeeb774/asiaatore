import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from '../../lib/framerLazy';
import {
  BarChart3,
  Users,
  ShoppingBag,
  DollarSign,
  Eye,
  TrendingUp,
  Lightbulb,
  X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api/client';
import { useToast } from '../../stores/ToastContext';
const AnalyticsDashboard = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', selectedPeriod],
    queryFn: () => api.get(`/api/analytics/dashboard?period=${selectedPeriod}`).then(res => res.data.data)
  });

  const { data: insights } = useQuery({
    queryKey: ['analytics-insights'],
    queryFn: () => api.get('/api/analytics/insights').then(res => res.data.data)
  });

  const { data: realtimeData } = useQuery({
    queryKey: ['analytics-realtime'],
    queryFn: () => api.get('/api/analytics/realtime').then(res => res.data.data),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const updateInsightMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/api/analytics/insights/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['analytics-insights']);
      toast.success('Insight updated successfully');
    }
  });

  const generateInsightsMutation = useMutation({
    mutationFn: () => api.post('/api/analytics/generate-insights'),
    onSuccess: () => {
      queryClient.invalidateQueries(['analytics-insights']);
      toast.success('Sample insights generated');
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-SA').format(num);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('analytics.title', 'Analytics Dashboard')}
          </h1>

          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            {[
              { value: '7d', label: '7 أيام' },
              { value: '30d', label: '30 يوم' },
              { value: '90d', label: '90 يوم' },
              { value: '1y', label: 'سنة' }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedPeriod === period.value
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(dashboardData?.metrics?.totalRevenue || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <ShoppingBag className="w-8 h-8 text-blue-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardData?.metrics?.totalOrders || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">المستخدمون الجدد</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardData?.metrics?.totalUsers || 0)}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-orange-500" />
              <div className="mr-4">
                <p className="text-sm text-gray-600">مشاهدات الصفحات</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(dashboardData?.metrics?.pageViews || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Real-time Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            إحصائيات الوقت الفعلي (آخر 24 ساعة)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {formatNumber(realtimeData?.activeUsers || 0)}
              </p>
              <p className="text-sm text-gray-600">مستخدم نشط</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(realtimeData?.pageViews || 0)}
              </p>
              <p className="text-sm text-gray-600">مشاهدة صفحة</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(realtimeData?.orders || 0)}
              </p>
              <p className="text-sm text-gray-600">طلب جديد</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(realtimeData?.revenue || 0)}
              </p>
              <p className="text-sm text-gray-600">إيرادات</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              المنتجات الأكثر مبيعاً
            </h3>
            <div className="space-y-3">
              {dashboardData?.topProducts?.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-900">{product.name}</span>
                  </div>
                  <span className="text-gray-600">{product.quantity} قطعة</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Predictive Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                التحليلات التنبؤية
              </h3>
              <button
                onClick={() => generateInsightsMutation.mutate()}
                disabled={generateInsightsMutation.isLoading}
                className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark disabled:opacity-50"
              >
                {generateInsightsMutation.isLoading ? 'جاري...' : 'إنشاء عينات'}
              </button>
            </div>

            <div className="space-y-4">
              {insights?.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>الثقة: {Math.round(insight.confidence * 100)}%</span>
                        <span className="mx-2">•</span>
                        <span>ينتهي: {new Date(insight.expiresAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => updateInsightMutation.mutate({ id: insight.id, status: 'implemented' })}
                        className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                      >
                        تم التنفيذ
                      </button>
                      <button
                        onClick={() => updateInsightMutation.mutate({ id: insight.id, status: 'dismissed' })}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(!insights || insights.length === 0) && (
                <div className="text-center text-gray-500 py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد تحليلات تنبؤية متاحة</p>
                  <p className="text-sm">اضغط على "إنشاء عينات" لإضافة بعض الأمثلة</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Charts Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            الرسوم البيانية
          </h3>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">الرسوم البيانية ستكون متاحة قريباً</p>
              <p className="text-sm text-gray-400">مخططات تفاعلية للإيرادات والطلبات والمستخدمين</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
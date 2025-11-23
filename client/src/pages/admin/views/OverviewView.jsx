import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useSettings } from '../../../contexts/SettingsContext';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api/client';
import { adminApi } from '../../../services/api/admin';

const OverviewView = () => {
  const { locale } = useLanguage();
  const { setting: storeSettings } = useSettings() || {};

  const localeTag = React.useMemo(() => {
    if (locale === 'ar') return 'ar-SA';
    if (locale === 'fr') return 'fr-FR';
    return 'en-US';
  }, [locale]);

  const currencyCode = storeSettings?.currencyCode || storeSettings?.currency || 'SAR';

  const numberFormatter = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(localeTag, { maximumFractionDigits: 0 });
    } catch {
      return { format: (value) => `${Math.round(Number(value) || 0)}` };
    }
  }, [localeTag]);

  const currencyFormatter = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(localeTag, {
        style: 'currency',
        currency: currencyCode,
        maximumFractionDigits: 1,
      });
    } catch {
      return { format: (value) => `${Math.round(Number(value) || 0)} ${currencyCode}` };
    }
  }, [localeTag, currencyCode]);

  const percentFormatter = React.useMemo(() => {
    try {
      return new Intl.NumberFormat(localeTag, { style: 'percent', maximumFractionDigits: 1 });
    } catch {
      return { format: (value) => `${value}%` };
    }
  }, [localeTag]);

  const formatNumber = React.useCallback(
    (value) => numberFormatter.format(Number.isFinite(+value) ? +value : 0),
    [numberFormatter]
  );

  const formatCurrency = React.useCallback(
    (value) => currencyFormatter.format(Number.isFinite(+value) ? +value : 0),
    [currencyFormatter]
  );

  const formatPercent = React.useCallback(
    (value) => {
      const numeric = Number.isFinite(+value) ? +value : 0;
      try {
        return percentFormatter.format(numeric / 100);
      } catch {
        return `${numeric}%`;
      }
    },
    [percentFormatter]
  );

  const labels = React.useMemo(() => {
    const isArabic = locale === 'ar';
    return {
      loading: isArabic ? 'جاري تحميل البيانات...' : 'Loading dashboard data...',
      fallbackNotice: isArabic
        ? 'تعذر الاتصال بالخادم، لذلك نعرض بيانات توضيحية.'
        : 'Live data is unavailable right now. Showing illustrative metrics instead.',
      sections: {
        daily: isArabic ? 'ملخص اليوم' : "Today's Snapshot",
        store: isArabic ? 'مقاييس المتجر' : 'Store Metrics',
        financial: isArabic ? 'الأداء المالي (14 يوم)' : '14-day Financial Performance',
        orders: isArabic ? 'الطلبات الأخيرة' : 'Recent Orders',
      },
      cards: {
        todayOrders: isArabic ? 'الطلبات اليوم' : 'Orders today',
        todayRevenue: isArabic ? 'الإيرادات اليوم' : 'Revenue today',
        avgOrder: isArabic ? 'متوسط قيمة الطلب' : 'Avg. order value',
        pendingBank: isArabic ? 'تحويلات بنكية معلقة' : 'Pending bank transfers',
        totalUsers: isArabic ? 'إجمالي المستخدمين' : 'Total users',
        totalProducts: isArabic ? 'إجمالي المنتجات' : 'Total products',
        totalOrders: isArabic ? 'إجمالي الطلبات' : 'Total orders',
        activeUsers: isArabic ? 'المستخدمون النشطون' : 'Active users',
        revenue14: isArabic ? 'إجمالي الإيرادات' : 'Revenue (14d)',
        orders14: isArabic ? 'إجمالي الطلبات' : 'Orders (14d)',
        avgOrder14: isArabic ? 'متوسط قيمة الطلب' : 'Avg. order (14d)',
        growth14: isArabic ? 'معدل النمو' : 'Growth rate',
      },
      emptyOrders: isArabic ? 'لا توجد طلبات حديثة' : 'No recent orders yet',
    };
  }, [locale]);

  const fallback = React.useMemo(() => {
    const isArabic = locale === 'ar';
    return {
      stats: {
        todayOrders: 18,
        todayRevenue: 4820,
        avgOrderValueToday: 268,
        pendingBankCount: 2,
        totalProducts: 248,
        totalOrders: 1320,
        activeUsers: 96,
      },
      financials: {
        totals: {
          revenue: 31240,
          orders: 460,
          avgOrderValue: 218,
          growth: 12,
        },
      },
      orders: [
        {
          id: 'demo-1001',
          customer: isArabic ? 'أحمد الغامدي' : 'Ahmed Alghamdi',
          total: 420.5,
          status: isArabic ? 'قيد المعالجة' : 'Processing',
        },
        {
          id: 'demo-1002',
          customer: isArabic ? 'نورة السبيعي' : 'Noura Alsubaie',
          total: 189.0,
          status: isArabic ? 'مكتمل' : 'Completed',
        },
        {
          id: 'demo-1003',
          customer: isArabic ? 'فهد الشهري' : 'Fahad Alshahri',
          total: 764.25,
          status: isArabic ? 'بانتظار الدفع' : 'Awaiting payment',
        },
      ],
      usersCount: 412,
    };
  }, [locale]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats-overview'],
    queryFn: () => adminApi.getStatsOverview(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: financials, isLoading: finLoading, error: finError } = useQuery({
    queryKey: ['admin-stats-financials', 14],
    queryFn: () => adminApi.getStatsFinancials(14),
    staleTime: 10 * 60 * 1000,
  });

  const { data: recentOrders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: () => adminApi.getRecentOrders(5),
    staleTime: 2 * 60 * 1000,
  });

  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.listUsers(),
    staleTime: 5 * 60 * 1000,
  });

  if (statsLoading || finLoading || ordersLoading || usersLoading) {
    return (
      <div className="overview-loading">
        <div className="loading-message">{labels.loading}</div>
      </div>
    );
  }

  const statsData = !statsError && stats ? stats : fallback.stats;
  const financialData = !finError && financials ? financials : fallback.financials;
  const usingFallbackOrders = Boolean(ordersError || !Array.isArray(recentOrders));
  const recentOrdersData = usingFallbackOrders ? fallback.orders : recentOrders || [];
  const showEmptyOrders = !usingFallbackOrders && recentOrdersData.length === 0;
  const totalUsers = !usersError && Array.isArray(users) ? users.length : fallback.usersCount;
  const hasError = Boolean(statsError || finError || ordersError || usersError);

  const summaryCards = [
    { key: 'todayOrders', value: statsData?.todayOrders, label: labels.cards.todayOrders, formatter: formatNumber },
    { key: 'todayRevenue', value: statsData?.todayRevenue, label: labels.cards.todayRevenue, formatter: formatCurrency },
    { key: 'avgOrderValueToday', value: statsData?.avgOrderValueToday, label: labels.cards.avgOrder, formatter: formatCurrency },
    { key: 'pendingBankCount', value: statsData?.pendingBankCount, label: labels.cards.pendingBank, formatter: formatNumber },
  ];

  const storeCards = [
    { key: 'totalUsers', value: totalUsers, label: labels.cards.totalUsers, formatter: formatNumber },
    { key: 'totalProducts', value: statsData?.totalProducts, label: labels.cards.totalProducts, formatter: formatNumber },
    { key: 'totalOrders', value: statsData?.totalOrders, label: labels.cards.totalOrders, formatter: formatNumber },
    { key: 'activeUsers', value: statsData?.activeUsers, label: labels.cards.activeUsers, formatter: formatNumber },
  ];

  const financialTotals = financialData?.totals || {};
  const financialCards = [
    { key: 'revenue', value: financialTotals?.revenue, label: labels.cards.revenue14, formatter: formatCurrency },
    { key: 'orders', value: financialTotals?.orders, label: labels.cards.orders14, formatter: formatNumber },
    { key: 'avgOrderValue', value: financialTotals?.avgOrderValue, label: labels.cards.avgOrder14, formatter: formatCurrency },
    { key: 'growth', value: financialTotals?.growth, label: labels.cards.growth14, formatter: formatPercent },
  ];

  return (
    <div className="overview-view">
      {hasError && (
        <div
          className="overview-notice"
          style={{
            backgroundColor: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.25)',
            color: '#047857',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
          role="status"
        >
          {labels.fallbackNotice}
        </div>
      )}

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.daily}</h2>
        <div className="stat-grid">
          {summaryCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-value">{card.formatter(card.value)}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.store}</h2>
        <div className="stat-grid">
          {storeCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-value">{card.formatter(card.value)}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.financial}</h2>
        <div className="stat-grid">
          {financialCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-value">{card.formatter(card.value)}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="overview-section">
        <h2 className="section-title">{labels.sections.orders}</h2>
        <div className="recent-orders">
          {showEmptyOrders ? (
            <div className="empty-state">{labels.emptyOrders}</div>
          ) : (
            <div className="orders-list">
              {recentOrdersData.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-info">
                    <div className="order-id">#{order.id}</div>
                    <div className="order-customer">{order.customer}</div>
                  </div>
                  <div className="order-details">
                    <div className="order-total">{formatCurrency(order.total)}</div>
                    <div className="order-status">{order.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default OverviewView;

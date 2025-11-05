import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui';
import { Calendar, Package, Clock } from 'lucide-react';

export default function DeliveryHistoryPage() {
  const { user } = useAuth() || {};
  const [tab, setTab] = useState('delivered');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  const load = useCallback(async (which = tab, page = 1) => {
    setLoading(true); 
    setErr(null);
    try {
      const res = await api.deliveryHistory({ 
        status: which, 
        limit: pagination.limit,
        page: page
      });
      setItems(res.orders || []);
      setPagination(prev => ({
        ...prev,
        page,
        total: res.total || 0
      }));
    } catch (e) { 
      setErr(e?.response?.data?.message || e?.message || 'فشل تحميل البيانات');
      console.error('History load error:', e);
    } finally { 
      setLoading(false); 
    }
  }, [tab, pagination.limit]);

  useEffect(() => { 
    load(tab, 1); 
  }, [tab, load]);

  // التحقق من الصلاحيات
  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="container mx-auto p-4">غير مصرح بالوصول</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'failed': return 'danger';
      case 'out_for_delivery': return 'info';
      case 'accepted': return 'warning';
      default: return 'neutral';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">سجل الطلبات</h1>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'delivered' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`} 
            onClick={() => setTab('delivered')}
          >
            <Calendar className="w-4 h-4" />
            تم التسليم
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === 'failed' 
                ? 'bg-white text-red-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`} 
            onClick={() => setTab('failed')}
          >
            <Clock className="w-4 h-4" />
            تعذر التسليم
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-3 text-gray-600">جاري التحميل...</span>
        </div>
      )}

      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm">{err}</p>
          <button 
            onClick={() => load()} 
            className="mt-2 text-red-600 hover:text-red-800 text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {items?.length ? items.map(o => (
          <div key={o.id} className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm hover:shadow-md transition">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-semibold text-gray-900 text-lg">
                    الطلب #{o.id.slice(0,8)}...
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="neutral">طلب: {o.status}</Badge>
                    <Badge color={getStatusColor(o.deliveryStatus)}>
                      توصيل: {o.deliveryStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>الإجمالي: <strong>{o.grandTotal} ر.س</strong></div>
                  {o.customerName && <div>العميل: {o.customerName}</div>}
                  {o.address && <div>العنوان: {o.address}</div>}
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {o.deliveredAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      اكتمل: {formatDate(o.deliveredAt)}
                    </div>
                  )}
                  {o.failedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      فشل: {formatDate(o.failedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          !loading && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد طلبات في هذا القسم</p>
              <p className="text-gray-400 text-sm mt-2">
                {tab === 'delivered' 
                  ? 'لم يتم تسليم أي طلبات بعد' 
                  : 'لا توجد طلبات فاشلة في التسليم'}
              </p>
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            disabled={pagination.page === 1}
            onClick={() => load(tab, pagination.page - 1)}
            className="px-3 py-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            السابق
          </button>
          <span className="px-3 py-2 text-sm text-gray-600">
            الصفحة {pagination.page} من {Math.ceil(pagination.total / pagination.limit)}
          </span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => load(tab, pagination.page + 1)}
            className="px-3 py-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
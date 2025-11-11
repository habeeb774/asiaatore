import React, { useEffect, useState, useCallback } from 'react';
import api from '../../services/api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import { Package, Truck, AlertTriangle, MessageSquare } from 'lucide-react';

export default function DeliveryAssignedPage() {
  const { user } = useAuth() || {};
  const [assigned, setAssigned] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // استخدام useCallback لمنع إعادة إنشاء الدالة
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [a, p] = await Promise.all([
        api.deliveryList({}),
        api.deliveryList({ pool: 1 })
      ]);
      setAssigned(a.orders || []);
      setPool(p.orders || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'فشل تحميل البيانات');
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    load(); 
  }, [load]);

  // تحسين التحقق من الصلاحيات
  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="container mx-auto p-4">غير مصرح بالوصول</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ... باقي الكود بدون تغيير ... */}
    </div>
  );
}

// تحسين OrderList مع إضافة تحسينات الأداء
const OrderList = React.memo(({ orders, type, onReload }) => {
  const { user } = useAuth() || {};
  
  if (!orders?.length) return <p className="text-gray-500 text-sm">لا يوجد طلبات حالياً.</p>;

  const handleAction = async (action, orderId, data = null) => {
    try {
      switch (action) {
        case 'accept':
          await api.deliveryAccept(orderId);
          break;
        case 'start':
          await api.deliveryStart(orderId);
          break;
        case 'complete':
          await api.deliveryComplete(orderId);
          break;
        case 'fail':
          if (data?.reason) await api.deliveryFail(orderId, data.reason);
          break;
        default:
          return;
      }
      onReload();
    } catch (error) {
      console.error('Action failed:', error);
      alert('فشل تنفيذ العملية: ' + (error?.message || 'حدث خطأ'));
    }
  };

  const handleChat = async (order) => {
    try {
      await api.chatEnsureThread(null, { orderId: order.id, driverId: user?.id });
      window.open('/chat?as=delivery', '_blank');
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((o) => (
        <Card key={o.id} className="border-gray-200 rounded-xl shadow-sm hover:shadow-md transition">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Package className="w-4 h-4 text-sky-600" /> 
              الطلب #{o.id.slice(0, 8)}
            </CardTitle>
            <span className={`px-2 py-1 rounded-full text-xs ${
              o.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
              o.deliveryStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {o.deliveryStatus}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">الحالة: {o.status}</div>
            <div className="text-sm text-gray-600">الإجمالي: {o.grandTotal} ر.س</div>
            {o.address && <div className="text-sm text-gray-600">العنوان: {o.address}</div>}

            <div className="flex flex-wrap gap-2 mt-3">
              {type === 'pool' ? (
                <Button 
                  variant="success" 
                  onClick={() => handleAction('accept', o.id)}
                >
                  استلام
                </Button>
              ) : (
                <>
                  {o.deliveryStatus === 'accepted' && (
                    <Button 
                      variant="primary" 
                      onClick={() => handleAction('start', o.id)}
                    >
                      بدء التوصيل
                    </Button>
                  )}
                  {o.deliveryStatus === 'out_for_delivery' && (
                    <Button 
                      variant="success" 
                      onClick={() => handleAction('complete', o.id)}
                    >
                      تم التسليم
                    </Button>
                  )}
                  {['accepted', 'out_for_delivery'].includes(o.deliveryStatus) && (
                    <Button 
                      variant="danger" 
                      onClick={async () => {
                        const reason = prompt('سبب الفشل؟');
                        if (reason) await handleAction('fail', o.id, { reason });
                      }}
                    >
                      تعذر التسليم
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => handleChat(o)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// تحسين Section component
const Section = React.memo(({ title, icon, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 border-b pb-2">
      {icon}
      <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
    </div>
    {children}
  </div>
));
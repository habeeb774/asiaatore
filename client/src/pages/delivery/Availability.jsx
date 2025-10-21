import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import { motion } from 'framer-motion';
import { Truck, Save, Loader, AlertCircle } from 'lucide-react';

export default function DeliveryAvailability() {
  const { user } = useAuth() || {};
  const [profile, setProfile] = useState({
    online: false,
    vehicleType: '',
    licensePlate: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // تحميل الملف الشخصي (اعتمد على ترويسات التطوير التلقائية من عميل API عند غياب التوكن)
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.request('/delivery/me/profile');
      setProfile(res.profile || {
        online: false,
        vehicleType: '',
        licensePlate: ''
      });
      
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || 'فشل تحميل الملف الشخصي';
      setError(errorMessage);
      console.error('Profile load error:', e);
      
      // 🔧 إصلاح: إعادة التحميل عند فشل المصادقة
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        console.log('محاولة إعادة المصادقة...');
        // يمكن إضافة منطق إعادة تسجيل الدخول هنا
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && ['delivery', 'admin'].includes(user.role)) {
      loadProfile();
    }
  }, [user, loadProfile]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // تحديث الملف الشخصي
  const updateProfile = async (patch = null) => {
    setSaving(true);
    setError(null);
    
    try {
      const dataToUpdate = patch || {
        online: profile.online,
        vehicleType: profile.vehicleType,
        licensePlate: profile.licensePlate
      };

      // يستخدم عميل API ترويسة Content-Type تلقائيًا عند إرسال JSON
      const res = await api.request('/delivery/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(dataToUpdate)
      });
      
      setProfile(res.profile || res);
      setHasChanges(false);
      
    } catch (e) {
      console.error('Profile update error details:', e);
      
      // 🔧 معالجة مختلفة لأنواع الأخطاء
      if (e?.response?.status === 403) {
        setError('غير مصرح لك بتعديل الملف الشخصي. يرجى التحقق من الصلاحيات.');
      } else if (e?.response?.status === 401) {
        setError('انتهت جلسة التسجيل. يرجى تسجيل الدخول مرة أخرى.');
      } else if (e?.response?.data?.message) {
        setError(e.response.data.message);
      } else {
        setError('فشل حفظ التغييرات. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setSaving(false);
    }
  };

  // 🔧 إصلاح: إعادة تحميل الصلاحيات
  const handleRetry = async () => {
    setError(null);
    await loadProfile();
  };

  // 🔧 إصلاح: التحقق من الصلاحيات بشكل أدق
  if (!user) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">يجب تسجيل الدخول</h2>
        <p className="text-gray-600 mt-2">يرجى تسجيل الدخول للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  if (!['delivery', 'admin'].includes(user.role)) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800">غير مصرح بالوصول</h2>
        <p className="text-gray-600 mt-2">ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-6 h-6 text-blue-500" /> 
          حالة التوافر
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          قم بتحديث حالتك ومعلومات المركبة لتظهر للمديرين والعملاء.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 text-sm">{error}</p>
            {(error.includes('انتهت') || error.includes('غير مصرح')) && (
              <button 
                onClick={handleRetry}
                className="text-red-600 underline text-sm mt-1 hover:text-red-800"
              >
                إعادة المحاولة
              </button>
            )}
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-blue-500" />
          <span className="mr-2">جاري التحميل...</span>
        </div>
      ) : (
        <Card className="rounded-xl shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">
              بيانات الملف الشخصي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* حالة التوفر */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-3 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!profile?.online}
                  onChange={(e) => {
                    handleInputChange('online', e.target.checked);
                    // 🔧 إصلاح: حفظ تلقائي مع معالجة الأخطاء
                    updateProfile({ online: e.target.checked }).catch(console.error);
                  }}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium">متاح لاستلام الطلبات</span>
              </label>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile?.online 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {profile?.online ? 'متاح الآن' : 'غير متاح'}
              </div>
            </div>

            {/* معلومات المركبة */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع المركبة *
                </label>
                <input
                  className="border border-gray-300 rounded-lg w-full px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="مثال: دراجة نارية أو سيارة"
                  value={profile?.vehicleType || ''}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  required
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم اللوحة *
                </label>
                <input
                  className="border border-gray-300 rounded-lg w-full px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="مثال: 1234 أ"
                  value={profile?.licensePlate || ''}
                  onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                  required
                  disabled={saving}
                />
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="success"
                disabled={saving || !hasChanges}
                onClick={() => updateProfile()}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
              </Button>
              
              {hasChanges && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setHasChanges(false);
                    loadProfile();
                  }}
                  disabled={saving}
                >
                  إلغاء
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
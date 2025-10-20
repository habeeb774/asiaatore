import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card.jsx';
import { motion } from 'framer-motion';
import { Truck, Save, Loader } from 'lucide-react';

export default function DeliveryAvailability() {
  const { user } = useAuth() || {};
  const [profile, setProfile] = useState({ online: false, vehicleType: '', licensePlate: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.request('/delivery/me/profile');
      setProfile(res.profile || { online: false, vehicleType: '', licensePlate: '' });
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'فشل تحميل الملف الشخصي');
      console.error('Profile load error:', e);
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

  const updateProfile = async (patch = null) => {
    setSaving(true);
    setError(null);
    try {
      const dataToUpdate = patch || {
        online: profile.online,
        vehicleType: profile.vehicleType,
        licensePlate: profile.licensePlate
      };
      
      const res = await api.request('/delivery/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToUpdate)
      });
      
      setProfile(res.profile);
      setHasChanges(false);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'فشل حفظ التغييرات');
      console.error('Profile update error:', e);
    } finally {
      setSaving(false);
    }
  };

  // التحقق من الصلاحيات
  if (!user) return <div className="p-6">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="p-6">غير مصرح بالوصول</div>;
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-3 text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!profile?.online}
                  onChange={(e) => {
                    handleInputChange('online', e.target.checked);
                    // حفظ تلقائي عند تغيير حالة التوفر
                    updateProfile({ online: e.target.checked });
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
                />
              </div>
            </div>

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
                  onClick={() => loadProfile()}
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
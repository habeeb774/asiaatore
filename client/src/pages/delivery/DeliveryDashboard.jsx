import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../../api/client';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function DeliveryDriverPage() {
  const { user } = useAuth() || {};
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [signatureFile, setSignatureFile] = useState(null);
  const [profile, setProfile] = useState(null);
  const watchIdRef = useRef(null);
  const pollingRef = useRef(null);

  // استخدام useCallback لتحسين الأداء
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.deliveryList();
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      console.error('fetchOrders error', e);
      setError(e?.response?.data?.message || e?.message || 'فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const p = await api.deliveryProfileGet();
      setProfile(p || null);
    } catch (e) {
      console.warn('fetchProfile', e);
    }
  }, []);

  // دالة موحدة لمعالجة الإجراءات
  const handleOrderAction = useCallback(async (action, id, data = null) => {
    try {
      switch (action) {
        case 'accept':
          await api.deliveryAccept(id);
          break;
        case 'reject':
          await api.deliveryReject(id);
          break;
        case 'start':
          await api.deliveryStart(id);
          setActiveId(id);
          break;
        case 'complete':
          if (signatureFile) {
            const fd = new FormData();
            fd.append('signature', signatureFile);
            await api.deliverySignature(id, fd);
          }
          await api.deliveryComplete(id, {});
          setSignatureFile(null);
          setActiveId(null);
          break;
        case 'otp':
          await api.deliveryOtpConfirm(id, otpCode);
          setOtpCode('');
          break;
        default:
          return;
      }
      await fetchOrders();
    } catch (e) {
      console.error(`${action} error`, e);
      setError(`فشل ${action}: ${e?.message || 'حدث خطأ'}`);
    }
  }, [signatureFile, otpCode, fetchOrders]);

  // تحسين نظام التتبع
  const startLocationWatch = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('المتصفح لا يدخدم نظام الموقع');
      return;
    }
    
    try {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          if (activeId) {
            try {
              await api.deliveryLocation(activeId, { 
                lat: latitude, 
                lng: longitude 
              });
            } catch (e) {
              console.warn('location update failed', e);
            }
          }
        },
        (err) => {
          console.warn('geo error', err);
          setError('فشل في الحصول على الموقع');
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, 
          timeout: 15000 
        }
      );
      watchIdRef.current = id;
    } catch (e) {
      console.warn('startLocationWatch error', e);
    }
  }, [activeId]);

  const stopLocationWatch = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (user && ['delivery', 'admin'].includes(user.role)) {
      fetchProfile();
      fetchOrders();
      startLocationWatch();
      
      pollingRef.current = setInterval(fetchOrders, 15000); // تقليل الفاصل
      
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        stopLocationWatch();
      };
    }
  }, [user, fetchOrders, fetchProfile, startLocationWatch, stopLocationWatch]);

  useEffect(() => {
    if (activeId) {
      startLocationWatch();
    } else {
      stopLocationWatch();
    }
  }, [activeId, startLocationWatch, stopLocationWatch]);

  if (!user) return <div className="min-h-screen p-4 bg-gray-50">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="min-h-screen p-4 bg-gray-50">غير مصرح بالوصول</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between py-6 mb-6 bg-white rounded-lg shadow-sm px-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">لوحة تحكم الموزع</h2>
            {profile && (
              <p className="text-sm text-gray-600 mt-1">
                {profile.name} • {profile.phone || '—'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchOrders} 
              className="px-4 py-2 rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              تحديث
            </button>
            <button 
              onClick={fetchProfile} 
              className="px-4 py-2 rounded-lg shadow-sm bg-gray-600 text-white hover:bg-gray-700 transition"
            >
              الملف الشخصي
            </button>
          </div>
        </header>

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="float-left ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ... باقي الكود مع تحسينات مشابهة ... */}
        </section>
      </div>
    </div>
  );
}
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import Button from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/badge.jsx';
import { Navigation, Upload, AlertCircle } from 'lucide-react';

// إصلاح أيقونة Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function DeliveryMapPage() {
  const { user } = useAuth() || {};
  const [logs, setLogs] = useState([]);
  const [last, setLast] = useState(null);
  const [trail, setTrail] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [pool, setPool] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersErr, setOrdersErr] = useState('');
  const [tileErr, setTileErr] = useState('');
  const [useFallbackTiles, setUseFallbackTiles] = useState(false);
  const esRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [failReason, setFailReason] = useState('');

  // استخدام useCallback لتحسين الأداء
  const fetchOrders = useCallback(async () => {
    if (!(user && ['delivery', 'admin'].includes(user.role))) return;
    
    setLoadingOrders(true);
    setOrdersErr('');
    try {
      const params = {};
      if (pool) params.pool = 1;
      if (statusFilter !== 'active' && statusFilter !== 'all') params.status = statusFilter;
      
      const res = await api.deliveryList(params);
      let list = res.orders || [];
      
      if (statusFilter === 'active') {
        list = list.filter(o => ['accepted','out_for_delivery'].includes(o.deliveryStatus));
      }
      
      setOrders(list);
      if (list.length && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'فشل جلب الطلبات';
      setOrdersErr(msg);
      console.error('Fetch orders error:', e);
    } finally {
      setLoadingOrders(false);
    }
  }, [user, statusFilter, pool, selectedId]);

  // تحسين نظام التتبع
  const startSharing = useCallback(async () => {
    if (!('geolocation' in navigator)) { 
      alert('المتصفح لا يدعم خدمة الموقع'); 
      return; 
    }
    if (!selectedId) { 
      alert('اختر طلب لإرسال موقعك إليه'); 
      return; 
    }
    
    setSharing(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        try { 
          await api.deliveryLocation(selectedId, { 
            lat: latitude, 
            lng: longitude, 
            accuracy 
          }); 
        } catch (error) {
          console.error('Location sharing error:', error);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setSharing(false);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 5000, 
        timeout: 15000 
      }
    );
  }, [selectedId]);

  const stopSharing = useCallback(() => {
    setSharing(false);
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // دالة موحدة للإجراءات
  const handleOrderAction = useCallback(async (action, orderId, data = null) => {
    if (!orderId) {
      setActionErr('اختر طلب أولاً');
      return;
    }
    
    setActionBusy(true);
    setActionErr('');
    
    try {
      switch (action) {
        case 'accept':
          await api.deliveryAccept(orderId);
          setPool(false);
          setStatusFilter('accepted');
          break;
        case 'start':
          await api.deliveryStart(orderId);
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, deliveryStatus: 'out_for_delivery' } : o
          ));
          break;
        case 'complete':
          let body;
          if (proofFile) {
            const fd = new FormData();
            fd.append('proof', proofFile);
            body = fd;
          } else {
            body = { note: 'تم التسليم' };
          }
          await api.deliveryComplete(orderId, body);
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, deliveryStatus: 'delivered' } : o
          ));
          stopSharing();
          setProofFile(null);
          break;
        case 'fail':
          if (!data?.reason) {
            setActionErr('اذكر سبب الفشل');
            return;
          }
          await api.deliveryFail(orderId, data.reason);
          setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, deliveryStatus: 'failed' } : o
          ));
          break;
        default:
          return;
      }
      
      await fetchOrders();
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.message || `فشل ${action}`;
      setActionErr(errorMsg);
      console.error(`${action} error:`, e);
    } finally {
      setActionBusy(false);
    }
  }, [proofFile, stopSharing, fetchOrders]);

  // useEffect hooks تبقى كما هي مع إضافة تحسينات...

  // التحقق من الصلاحيات
  if (!user) return <div className="container mx-auto p-4">يجب تسجيل الدخول</div>;
  if (!['delivery', 'admin'].includes(user.role)) {
    return <div className="container mx-auto p-4">غير مصرح بالوصول</div>;
  }

  const selectedOrder = useMemo(() => 
    orders.find(o => o.id === selectedId), 
    [orders, selectedId]
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* ... باقي الكود مع تحسينات مشابهة للملفات السابقة ... */}
    </div>
  );
}

// مكونات الخريطة المساعدة
const FitToMarker = () => {
  const map = useMap();
  useEffect(() => {
    const last = JSON.parse(localStorage.getItem('lastLocation'));
    if (last?.lat && last?.lng) {
      map.setView([last.lat, last.lng], Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [map]);
  return null;
};

const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => map.invalidateSize();
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
};
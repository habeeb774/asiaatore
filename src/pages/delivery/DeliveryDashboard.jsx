// Delivery Worker Dashboard
// Main dashboard for delivery workers to manage their orders and track deliveries

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Package, Clock, CheckCircle, XCircle, Navigation, Phone, MessageCircle, Star } from 'lucide-react';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // active, history, stats

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes, profileRes] = await Promise.all([
        fetch('/api/delivery/orders/assigned', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/delivery/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/delivery/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      const profileData = await profileRes.json();

      if (ordersData.ok) setAssignedOrders(ordersData.data || []);
      if (statsData.ok) setStats(statsData.data);
      if (profileData.ok) setProfile(profileData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (assignmentId) => {
    try {
      const res = await fetch(`/api/delivery/orders/${assignmentId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await res.json();
      if (data.ok) {
        await loadData();
        alert('تم قبول الطلب بنجاح');
      } else {
        alert(data.error || 'فشل قبول الطلب');
      }
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('فشل قبول الطلب');
    }
  };

  const handleReject = async (assignmentId) => {
    const reason = prompt('سبب الرفض:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/delivery/orders/${assignmentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();
      if (data.ok) {
        await loadData();
        alert('تم رفض الطلب');
      } else {
        alert(data.error || 'فشل رفض الطلب');
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('فشل رفض الطلب');
    }
  };

  const handleUpdateStatus = async (assignmentId, newStatus) => {
    try {
      const res = await fetch(`/api/delivery/orders/${assignmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.ok) {
        await loadData();
        alert('تم تحديث حالة الطلب');
      } else {
        alert(data.error || 'فشل تحديث الحالة');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('فشل تحديث الحالة');
    }
  };

  const handleCompleteDelivery = async (assignmentId) => {
    const otp = prompt('أدخل رمز التحقق من العميل (OTP):');
    if (!otp) return;

    try {
      const res = await fetch(`/api/delivery/orders/${assignmentId}/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          proofType: 'otp',
          proofData: { otp, timestamp: new Date().toISOString() }
        })
      });

      const data = await res.json();
      if (data.ok) {
        await loadData();
        alert('تم تسليم الطلب بنجاح!');
      } else {
        alert(data.error || 'فشل تأكيد التسليم');
      }
    } catch (error) {
      console.error('Error completing delivery:', error);
      alert('فشل تأكيد التسليم');
    }
  };

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/delivery/location/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              speed: position.coords.speed,
              heading: position.coords.heading
            })
          });

          const data = await res.json();
          if (data.ok) {
            console.log('تم تحديث الموقع');
          }
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  // Auto-update location every 30 seconds
  useEffect(() => {
    const interval = setInterval(updateLocation, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      accepted: '#3b82f6',
      in_progress: '#8b5cf6',
      delivered: '#10b981',
      failed: '#ef4444',
      cancelled: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'قيد الانتظار',
      accepted: 'مقبول',
      in_progress: 'قيد التوصيل',
      delivered: 'تم التسليم',
      failed: 'فشل',
      cancelled: 'ملغى',
      rejected: 'مرفوض'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', color: '#666' }}>جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1400px', margin: '0 auto', direction: 'rtl' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '0.5rem' }}>
          لوحة تحكم عامل التوصيل
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>مرحباً {user?.name || 'عامل التوصيل'}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Package size={24} color="#667eea" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>الطلبات الحالية</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.pendingDeliveries || 0}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <CheckCircle size={24} color="#10b981" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>المكتملة</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.completedDeliveries || 0}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Star size={24} color="#f59e0b" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>التقييم</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {(stats.rating || 0).toFixed(1)} ⭐
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Navigation size={24} color="#3b82f6" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>المسافة الكلية</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {(stats.totalDistance || 0).toFixed(1)} كم
            </div>
          </div>
        </div>
      )}

      {/* Location Update Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          onClick={updateLocation}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <MapPin size={20} />
          تحديث الموقع الحالي
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb'
      }}>
        {['active', 'history', 'stats'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem',
              fontSize: '1rem',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #667eea' : 'none',
              color: activeTab === tab ? '#667eea' : '#666',
              fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}
          >
            {tab === 'active' ? 'الطلبات النشطة' : tab === 'history' ? 'السجل' : 'الإحصائيات'}
          </button>
        ))}
      </div>

      {/* Active Orders */}
      {activeTab === 'active' && (
        <div>
          {assignedOrders.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
              color: '#666'
            }}>
              <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <div style={{ fontSize: '1.2rem' }}>لا توجد طلبات حالياً</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {assignedOrders.map(({ assignment, order }) => (
                <div
                  key={assignment.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    borderRight: `4px solid ${getStatusColor(assignment.status)}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        طلب #{order?.id?.slice(-8)}
                      </div>
                      <div style={{
                        display: 'inline-block',
                        background: getStatusColor(assignment.status),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.875rem'
                      }}>
                        {getStatusLabel(assignment.status)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', color: '#666' }}>
                      <Clock size={18} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                      {new Date(assignment.assignedAt).toLocaleString('ar-SA')}
                    </div>
                  </div>

                  {/* Order Items */}
                  {order?.items && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                        المنتجات ({order.items.length}):
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#333' }}>
                        {order.items.map((item, idx) => (
                          <div key={idx}>• {item.nameAr} (×{item.quantity})</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Delivery Address */}
                  {assignment.deliveryAddress && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        <MapPin size={16} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                        عنوان التسليم:
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#333' }}>
                        {assignment.deliveryAddress.line1 && <div>{assignment.deliveryAddress.line1}</div>}
                        {assignment.deliveryAddress.city && <div>{assignment.deliveryAddress.city}</div>}
                        {assignment.deliveryAddress.phone && (
                          <div>
                            <Phone size={14} style={{ display: 'inline', marginLeft: '0.25rem' }} />
                            {assignment.deliveryAddress.phone}
                          </div>
                        )}
                      </div>
                      {(assignment.deliveryAddress.line1 || assignment.deliveryAddress.city) && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${assignment.deliveryAddress.line1 || ''} ${assignment.deliveryAddress.city || ''}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            color: '#667eea',
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                          }}
                        >
                          فتح في خرائط جوجل →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {assignment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(assignment.id)}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          قبول
                        </button>
                        <button
                          onClick={() => handleReject(assignment.id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          رفض
                        </button>
                      </>
                    )}

                    {assignment.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateStatus(assignment.id, 'in_progress')}
                        style={{
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        بدء التوصيل
                      </button>
                    )}

                    {assignment.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteDelivery(assignment.id)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        تأكيد التسليم
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History & Stats tabs would go here - simplified for now */}
      {activeTab === 'history' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          color: '#666'
        }}>
          سجل التوصيل - قريباً
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>الإحصائيات التفصيلية</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>إجمالي التوصيلات</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalDeliveries}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>التوصيلات المكتملة</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completedDeliveries}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>التوصيلات الحالية</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pendingDeliveries}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>المسافة الإجمالية</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalDistance.toFixed(1)} كم</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;

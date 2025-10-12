// Admin Delivery Management Dashboard
// Monitoring and management interface for delivery workers and assignments

import React, { useState, useEffect } from 'react';
import { MapPin, Users, Package, Clock, Activity, Plus, Edit2, Trash2 } from 'lucide-react';

const DeliveryManagement = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, workers, assignments, locations
  const [workers, setWorkers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorker, setSelectedWorker] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (activeTab === 'overview' || activeTab === 'workers') {
        const [statsRes, workersRes] = await Promise.all([
          fetch('/api/admin/delivery/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/delivery/workers', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const statsData = await statsRes.json();
        const workersData = await workersRes.json();

        if (statsData.ok) setStats(statsData.data);
        if (workersData.ok) setWorkers(workersData.data || []);
      }

      if (activeTab === 'assignments') {
        const res = await fetch('/api/admin/delivery/assignments', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) setAssignments(data.data || []);
      }

      if (activeTab === 'locations') {
        const res = await fetch('/api/admin/delivery/locations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) setLocations(data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkerStatus = async (workerId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/delivery/workers/${workerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (data.ok) {
        await loadData();
        alert('تم تحديث حالة العامل');
      } else {
        alert(data.error || 'فشل التحديث');
      }
    } catch (error) {
      console.error('Error updating worker:', error);
      alert('فشل التحديث');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981',
      inactive: '#6b7280',
      suspended: '#ef4444',
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
      active: 'نشط',
      inactive: 'غير نشط',
      suspended: 'موقوف',
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
    <div style={{ padding: '1rem', maxWidth: '1600px', margin: '0 auto', direction: 'rtl' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '0.5rem' }}>
          إدارة التوصيل
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>مراقبة وإدارة عمال التوصيل والطلبات</p>
      </div>

      {/* Stats Overview */}
      {stats && activeTab === 'overview' && (
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
              <Users size={24} color="#667eea" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>العمال النشطون</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.workers.active} / {stats.workers.total}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Package size={24} color="#f59e0b" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>طلبات معلقة</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.assignments.pending}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Activity size={24} color="#8b5cf6" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>قيد التوصيل</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.assignments.inProgress}
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Clock size={24} color="#10b981" />
              <div style={{ fontSize: '0.875rem', color: '#666' }}>توصيلات اليوم</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.today.deliveries}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb',
        overflowX: 'auto'
      }}>
        {['overview', 'workers', 'assignments', 'locations'].map(tab => (
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
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              whiteSpace: 'nowrap'
            }}
          >
            {tab === 'overview' ? 'نظرة عامة' :
             tab === 'workers' ? 'العمال' :
             tab === 'assignments' ? 'المهام' : 'المواقع'}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>ملخص النظام</h2>
          
          {stats && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#667eea' }}>العمال</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>إجمالي العمال</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.workers.total}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>النشطون</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.workers.active}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#667eea' }}>المهام</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>إجمالي المهام</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.assignments.total}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>معلقة</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.assignments.pending}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>قيد التوصيل</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{stats.assignments.inProgress}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>مكتملة</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.assignments.completed}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>فاشلة</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.assignments.failed}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#667eea' }}>إحصائيات اليوم</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>التوصيلات</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.today.deliveries}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>المسافة</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.today.distance.toFixed(1)} كم</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'workers' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>عمال التوصيل ({workers.length})</h2>
            <button
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onClick={() => alert('إضافة عامل جديد - قريباً')}
            >
              <Plus size={18} />
              إضافة عامل
            </button>
          </div>

          {workers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              لا يوجد عمال توصيل
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>الاسم</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>البريد</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>الهاتف</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>نوع المركبة</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>التوصيلات</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>التقييم</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>الحالة</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(worker => (
                    <tr key={worker.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>{worker.user?.name || '—'}</td>
                      <td style={{ padding: '1rem' }}>{worker.user?.email || '—'}</td>
                      <td style={{ padding: '1rem' }}>{worker.user?.phone || '—'}</td>
                      <td style={{ padding: '1rem' }}>{worker.vehicleType || '—'}</td>
                      <td style={{ padding: '1rem' }}>{worker.totalDeliveries}</td>
                      <td style={{ padding: '1rem' }}>{worker.rating?.toFixed(1) || '0.0'} ⭐</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          background: getStatusColor(worker.status),
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.875rem'
                        }}>
                          {getStatusLabel(worker.status)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              const newStatus = worker.status === 'active' ? 'inactive' : 'active';
                              handleUpdateWorkerStatus(worker.id, newStatus);
                            }}
                            style={{
                              background: 'none',
                              border: '1px solid #667eea',
                              color: '#667eea',
                              borderRadius: '6px',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                          >
                            {worker.status === 'active' ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>المهام ({assignments.length})</h2>
          
          {assignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              لا توجد مهام توصيل
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>رقم الطلب</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>العامل</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>الحالة</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>تاريخ التكليف</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>المسافة</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>المدة</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}>{assignment.orderId.slice(-8)}</td>
                      <td style={{ padding: '1rem' }}>{assignment.workerId.slice(-8)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          background: getStatusColor(assignment.status),
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.875rem'
                        }}>
                          {getStatusLabel(assignment.status)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {new Date(assignment.assignedAt).toLocaleString('ar-SA', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {assignment.actualDistance
                          ? `${assignment.actualDistance.toFixed(1)} كم`
                          : assignment.estimatedDistance
                          ? `~${assignment.estimatedDistance.toFixed(1)} كم`
                          : '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {assignment.actualDuration
                          ? `${assignment.actualDuration} د`
                          : assignment.estimatedDuration
                          ? `~${assignment.estimatedDuration} د`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'locations' && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>مواقع العمال الحالية</h2>
          
          {locations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
              <MapPin size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <div>لا توجد بيانات موقع متاحة</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {locations.map(({ workerId, userId, location }) => (
                <div
                  key={workerId}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      عامل {workerId.slice(-8)}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                      آخر تحديث: {new Date(location.timestamp).toLocaleString('ar-SA')}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <MapPin size={16} />
                    عرض على الخريطة
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;

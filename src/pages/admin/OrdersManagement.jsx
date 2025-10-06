import React, { useState, useEffect } from 'react';
import { useOrders } from '../../context/OrdersContext';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';

const statusOptions = ['pending','paid','shipped','completed','cancelled'];

const OrderCard = ({ o, updateOrderStatus, deleteOrder }) => (
  <div
    style={{
      padding:'10px 12px',
      border:'1px solid #e5e7eb',
      borderRadius:12,
      background:'#fff',
      display:'grid',
      gap:6
    }}
  >
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <strong style={{fontSize:'.8rem'}}>طلب #{o.id}</strong>
      <span style={{fontSize:'.6rem',background:'#f1f5f9',padding:'4px 8px',borderRadius:20}}>
        {o.status}
      </span>
    </div>
    <div style={{fontSize:'.65rem',color:'#475569',display:'flex',gap:12,flexWrap:'wrap'}}>
      <span>العميل: {o.customer?.name || o.customer?.fullName || 'غير محدد'}</span>
      <span>الإجمالي: {(o.totals?.grandTotal || 0)} ر.س</span>
      <span>العناصر: {o.items?.length || 0}</span>
    </div>
    <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
      <select
        value={o.status}
        onChange={e=>updateOrderStatus && updateOrderStatus(o.id, e.target.value)}
        style={{padding:'4px 8px',border:'1px solid #d1d5db',borderRadius:8,fontSize:'.6rem'}}
      >
        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button
        type="button"
        onClick={()=> deleteOrder && window.confirm('حذف الطلب؟') && deleteOrder(o.id)}
        style={{
          background:'#dc2626',
          color:'#fff',
          border:0,
          borderRadius:8,
          padding:'4px 10px',
          fontSize:'.6rem',
          cursor:'pointer'
        }}
      >
        حذف
      </button>
    </div>
  </div>
);

const OrdersManagement = () => {
  const { user } = useAuth() || {};
  const { orders = [], updateOrderStatus } = useOrders() || {};
  const { deleteOrder } = useAdmin() || {};
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = (filter === 'all' ? orders : orders.filter(o => o.status === filter))
    .filter(o => {
      if (!search.trim()) return true;
      const t = search.trim().toLowerCase();
      return (o.id+'').includes(t) || (o.customer?.name||'').toLowerCase().includes(t);
    });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  useEffect(()=> { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);

  return (
    <div style={{direction:'rtl'}}>
      <h2 style={{margin:'0 0 1rem'}}>إدارة الطلبات</h2>
      {!user || user.role !== 'admin' ? (
        <div style={{padding:'1rem',background:'#fef2f2',color:'#b91c1c',borderRadius:10,fontSize:'.8rem'}}>
          صلاحيات غير كافية
        </div>
      ) : (
        <>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
            <select
              value={filter}
              onChange={e=>{ setFilter(e.target.value); setPage(1); }}
              style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb',fontSize:12}}
            >
              <option value="all">جميع الحالات</option>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              value={search}
              onChange={e=>{ setSearch(e.target.value); setPage(1); }}
              placeholder="بحث (رقم / عميل)"
              style={{padding:6,borderRadius:8,border:'1px solid #e5e7eb',fontSize:12,minWidth:180}}
            />
            <div style={{fontSize:12,alignSelf:'center'}}>عدد: {filtered.length}</div>
          </div>
          <div style={{display:'grid',gap:10}}>
            {filtered.length === 0
              ? <div style={{fontSize:13,color:'#64748b'}}>لا توجد طلبات مطابقة.</div>
              : paged.map(o => (
                  <OrderCard
                    key={o.id}
                    o={o}
                    updateOrderStatus={updateOrderStatus}
                    deleteOrder={deleteOrder}
                  />
                ))
            }
          </div>
          {pageCount > 1 && (
            <div style={{display:'flex',gap:6,marginTop:16,flexWrap:'wrap'}}>
              <button
                disabled={page===1}
                onClick={()=>setPage(p=>Math.max(1,p-1))}
                style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:12,cursor:page===1?'not-allowed':'pointer'}}
              >السابق</button>
              <span style={{fontSize:12,alignSelf:'center'}}>صفحة {page} / {pageCount}</span>
              <button
                disabled={page===pageCount}
                onClick={()=>setPage(p=>Math.min(pageCount,p+1))}
                style={{padding:'6px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:'#fff',fontSize:12,cursor:page===pageCount?'not-allowed':'pointer'}}
              >التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersManagement;

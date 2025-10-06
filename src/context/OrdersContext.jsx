import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext.jsx';

const OrdersContext = createContext(null);

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useRemote, setUseRemote] = useState(true); // toggle fallback automatically if server fails
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { user } = useAuth() || {};

  // local fallback store (persisted) if server unavailable
  const [localBackup, setLocalBackup] = useState(() => {
    try { const raw = localStorage.getItem('my_store_orders'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('my_store_orders', JSON.stringify(localBackup)); } catch {}
  }, [localBackup]);

  const refresh = useCallback(async (userId) => {
    if (!useRemote) return; // if remote disabled skip
    setLoading(true); setError(null);
    try {
      const res = await api.listOrders(userId);
      if (res?.orders) setOrders(res.orders);
    } catch (e) {
      setError(e.message);
      setUseRemote(false); // fallback
      setOrders(localBackup);
    } finally {
      setLoading(false);
    }
  }, [useRemote, localBackup]);

  // Fetch when mounting AND whenever user identity changes (e.g., after login)
  useEffect(() => { refresh(); }, [refresh, user?.id]);

  const addOrder = async (order) => {
    const base = { createdAt: new Date().toISOString(), status: 'pending', ...order };
    if (useRemote) {
      try {
        const res = await api.createOrder(base);
        if (res?.order) {
          setOrders(prev => [res.order, ...prev]);
          return res.order;
        }
      } catch (e) {
        // fallback to local
        setUseRemote(false);
      }
    }
    const id = base.id || `ord_${Date.now()}`;
    const localOrder = { ...base, id };
    setLocalBackup(prev => [localOrder, ...prev]);
    setOrders(prev => [localOrder, ...prev]);
    return localOrder;
  };

  const updateOrderStatus = async (orderId, status) => {
    if (useRemote) {
      try {
        await api.updateOrder(orderId, { status });
      } catch {
        setUseRemote(false);
      }
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    setLocalBackup(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // Merge/patch a full order object locally (no server call)
  const mergeOrder = (updated) => {
    if (!updated || !updated.id) return;
    setOrders(prev => {
      const exists = prev.some(o => o.id === updated.id);
      return exists ? prev.map(o => o.id === updated.id ? { ...o, ...updated } : o) : [updated, ...prev];
    });
    setLocalBackup(prev => {
      const exists = prev.some(o => o.id === updated.id);
      return exists ? prev.map(o => o.id === updated.id ? { ...o, ...updated } : o) : [updated, ...prev];
    });
  };

  const getOrders = () => orders;
  const getOrderById = (id) => orders.find(o => o.id === id);
  const paged = orders.slice((page-1)*pageSize, page*pageSize);
  const totalPages = Math.ceil(orders.length / pageSize) || 1;

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, mergeOrder, getOrders, getOrderById, loading, error, refresh, page, setPage, totalPages, paged, useRemote }}>
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => useContext(OrdersContext);
export default OrdersContext;

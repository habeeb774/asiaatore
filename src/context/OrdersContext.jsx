import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext.jsx';
import OrderEventsListener from '../components/OrderEventsListener.jsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const OrdersContext = createContext(null);

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [useRemote, setUseRemote] = useState(true); // toggle fallback automatically if server fails
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { user } = useAuth() || {};
  const qc = useQueryClient();

  // local fallback store (persisted) if server unavailable
  const [localBackup, setLocalBackup] = useState(() => {
    try { const raw = localStorage.getItem('my_store_orders'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem('my_store_orders', JSON.stringify(localBackup)); } catch {}
  }, [localBackup]);

  // Query: fetch orders (admin gets all, normal users get own via server guard)
  const ordersQueryKey = ['orders', { scope: user?.role === 'admin' ? 'all' : (user?.id || 'guest') }];
  const {
    data: remoteOrders,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const res = await api.listOrders();
      return Array.isArray(res?.orders) ? res.orders : [];
    },
    enabled: useRemote, // disable when we switch to local fallback
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  // Sync query results into our local state when available
  useEffect(() => {
    if (useRemote && Array.isArray(remoteOrders)) {
      setOrders(remoteOrders);
      setError(null);
    }
  }, [remoteOrders, useRemote]);

  // If query errors, fallback to local backup
  useEffect(() => {
    if (isError) {
      setUseRemote(false);
      setOrders(localBackup);
      setError(queryError?.message || 'Failed to load orders');
    }
  }, [isError, queryError, localBackup]);

  // Fetch when mounting AND whenever user identity changes (e.g., after login)
  useEffect(() => {
    if (useRemote) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addOrder = async (order) => {
    const base = { createdAt: new Date().toISOString(), status: 'pending', ...order };
    if (useRemote) {
      try {
        const res = await api.createOrder(base);
        if (res?.order) {
          // Update local state and query cache
          setOrders(prev => [res.order, ...prev]);
          qc.setQueriesData({ queryKey: ['orders'] }, (prev) => Array.isArray(prev) ? [res.order, ...prev] : [res.order]);
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
    qc.setQueriesData({ queryKey: ['orders'] }, (prev) => Array.isArray(prev) ? [localOrder, ...prev] : [localOrder]);
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
    qc.setQueriesData({ queryKey: ['orders'] }, (prev) => Array.isArray(prev) ? prev.map(o => o.id === orderId ? { ...o, status } : o) : prev);
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
    <OrdersContext.Provider value={{
      orders,
      addOrder,
      updateOrderStatus,
      mergeOrder,
      getOrders,
      getOrderById,
      loading: isLoading || isFetching,
      error,
      refresh: () => useRemote ? refetch() : null,
      page,
      setPage,
      totalPages,
      paged,
      useRemote,
    }}>
      {/* Live updates via SSE: update local state on order events */}
      <OrderEventsListener onOrderEvent={(type, payload) => {
        if (!payload?.orderId) return;
        const { orderId, status } = payload;
        // Update local state and backup
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        setLocalBackup(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        // Update React Query cache for all matching order lists
        qc.setQueriesData({ queryKey: ['orders'] }, (prev) => {
          if (!Array.isArray(prev)) return prev;
          let found = false;
          const next = prev.map(o => {
            if (o.id === orderId) { found = true; return { ...o, status }; }
            return o;
          });
          if (!found && type === 'order.created') {
            return [{ id: orderId, status, createdAt: new Date().toISOString(), items: [], userId: payload.userId }, ...next];
          }
          return next;
        });
      }} />
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = () => useContext(OrdersContext);
export default OrdersContext;

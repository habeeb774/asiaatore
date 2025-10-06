import React, { createContext, useContext, useEffect, useCallback, useReducer } from 'react';

const AdminContext = createContext(null);
export const useAdmin = () => useContext(AdminContext);

const STORAGE_KEY = 'adminConsoleData_v1';

const initialState = {
  products: [],
  users: [],
  orders: []
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [action.payload, ...state.products] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p)
      };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.id) };
    case 'ADD_USER':
      return { ...state, users: [action.payload, ...state.users] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u)
      };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.id) };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.payload.id ? { ...o, ...action.payload } : o)
      };
    case 'DELETE_ORDER':
      return { ...state, orders: state.orders.filter(o => o.id !== action.id) };
    default:
      return state;
  }
}

export function AdminProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: 'INIT', payload: JSON.parse(raw) });
      } else {
        // seed demo
        const seed = {
          products: [
            { id: 'p1', name: 'منتج تجريبي', price: 120, stock: 50, status: 'active' },
            { id: 'p2', name: 'حقيبة جلد', price: 340, stock: 8, status: 'draft' }
          ],
          users: [
            { id: 'u1', name: 'مدير عام', role: 'admin', active: true },
            { id: 'u2', name: 'بائع أحمد', role: 'seller', active: true }
          ],
            orders: [
              { id: 'o1', total: 450.75, status: 'pending', customer: 'مشتري 1', items: 3 },
              { id: 'o2', total: 90, status: 'paid', customer: 'مشتري 2', items: 1 }
            ]
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
        dispatch({ type: 'INIT', payload: seed });
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // products
  const addProduct = useCallback(data => {
    // Support both legacy string name and new localized object { ar, en }
    let nameValue;
    if (data && typeof data.name === 'object' && data.name !== null && !(data.name instanceof Date)) {
      // Normalize localized object: trim each field
      const ar = (data.name.ar || '').toString().trim();
      const en = (data.name.en || '').toString().trim();
      // keep object form so later UI that expects name.ar / name.en works
      nameValue = { ar: ar || en || 'بدون اسم', en: en || ar || 'Product' };
    } else if (typeof data?.name === 'string') {
      const trimmed = data.name.trim();
      nameValue = trimmed || 'بدون اسم';
    } else {
      nameValue = 'بدون اسم';
    }
    const payload = {
      id: 'p' + Date.now(),
      name: nameValue,
      price: +data?.price || 0,
      stock: +data?.stock || 0,
      status: data?.status || 'active'
    };
    dispatch({ type: 'ADD_PRODUCT', payload });
    return payload;
  }, []);
  const updateProduct = useCallback((id, data) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { id, ...data } });
  }, []);
  const deleteProduct = useCallback(id => dispatch({ type: 'DELETE_PRODUCT', id }), []);

  // users
  const addUser = useCallback(data => {
    let nameValue;
    if (data && typeof data.name === 'object' && data.name !== null) {
      const ar = (data.name.ar || '').toString().trim();
      const en = (data.name.en || '').toString().trim();
      nameValue = ar || en || 'مستخدم';
    } else if (typeof data?.name === 'string') {
      nameValue = data.name.trim() || 'مستخدم';
    } else {
      nameValue = 'مستخدم';
    }
    const payload = {
      id: 'u' + Date.now(),
      name: nameValue,
      role: data?.role || 'user',
      active: data?.active ?? true
    };
    dispatch({ type: 'ADD_USER', payload });
    return payload;
  }, []);
  const updateUser = useCallback((id, data) => {
    dispatch({ type: 'UPDATE_USER', payload: { id, ...data } });
  }, []);
  const deleteUser = useCallback(id => dispatch({ type: 'DELETE_USER', id }), []);

  // orders
  const addOrder = useCallback(data => {
    const payload = {
      id: 'o' + Date.now(),
      total: +data.total || 0,
      status: data.status || 'pending',
      customer: data.customer || 'عميل',
      items: +data.items || 1
    };
    dispatch({ type: 'ADD_ORDER', payload });
    return payload;
  }, []);
  const updateOrder = useCallback((id, data) => {
    dispatch({ type: 'UPDATE_ORDER', payload: { id, ...data } });
  }, []);
  const deleteOrder = useCallback(id => dispatch({ type: 'DELETE_ORDER', id }), []);

  const value = {
    ...state,
    addProduct,
    updateProduct,
    deleteProduct,
    addUser,
    updateUser,
    deleteUser,
    addOrder,
    updateOrder,
    deleteOrder
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

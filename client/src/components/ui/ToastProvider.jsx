import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const push = useCallback((msg, opts = {}) => {
    const { type = 'info', ttl = 3000 } = opts;
    const isObject = typeof msg === 'object' && msg !== null;
    const data = isObject ? msg : { title: msg };

    const toastOptions = {
      autoClose: ttl > 0 ? ttl : false,
      position: "top-right",
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    };

    let toastContent = data.title || msg;

    // Handle complex toast with image and action
    if (isObject && (data.image || data.action)) {
      toastContent = (
        <div className="flex items-center gap-3">
          {data.image && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/20 flex-shrink-0">
              <img src={data.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{data.title}</div>
            {data.name && <div className="text-xs opacity-90">{data.name}</div>}
          </div>
          {data.action?.href && (
            <a
              href={data.action.href}
              className="px-3 py-1 bg-white text-gray-800 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {data.action.label || 'فتح'}
            </a>
          )}
        </div>
      );
    }

    switch (type) {
      case 'success':
        return toast.success(toastContent, toastOptions);
      case 'error':
        return toast.error(toastContent, toastOptions);
      case 'warning':
      case 'warn':
        return toast.warning(toastContent, toastOptions);
      default:
        return toast.info(toastContent, toastOptions);
    }
  }, []);

  const remove = useCallback((id) => {
    toast.dismiss(id);
  }, []);

  // Listen to cart:add event for auto toast
  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || {};
      const name = d.name || 'منتج';
      push({
        title: 'تمت الإضافة إلى السلة',
        name,
        image: d.image || null,
        type: 'success',
        action: { label: 'إتمام الشراء', href: '/checkout' }
      }, { ttl: 2600 });
      try {
        window.dispatchEvent(new CustomEvent('cart:icon-bump'));
      } catch {}
    };
    window.addEventListener('cart:add', handler);
    return () => window.removeEventListener('cart:add', handler);
  }, [push]);

  // Listen to auth required and show a toast
  useEffect(() => {
    const authHandler = (e) => {
      push('سجّل الدخول لإضافة المنتجات إلى السلة', { type: 'error', ttl: 2500 });
    };
    window.addEventListener('auth:required', authHandler);
    return () => window.removeEventListener('auth:required', authHandler);
  }, [push]);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export default ToastProvider;

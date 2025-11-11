import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const show = useCallback((opts) => {
    const { type = 'info', title, description, duration = 3500, action } = opts || {};

    const toastOptions = {
      autoClose: duration > 0 ? duration : false,
      position: "top-right",
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    };

    let toastContent = title;
    if (description) {
      toastContent = (
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-90 mt-1">{description}</div>
          {action && action.label && (
            <button
              type="button"
              className="mt-2 px-3 py-1 bg-white text-gray-800 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                try { action.onClick?.(); } catch {}
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      );
    } else if (action && action.label) {
      toastContent = (
        <div className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <button
            type="button"
            className="px-3 py-1 bg-white text-gray-800 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              try { action.onClick?.(); } catch {}
            }}
          >
            {action.label}
          </button>
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

  const api = useMemo(() => ({
    show,
    success: (title, description, duration, extras = {}) => show({ type:'success', title, description, duration, ...extras }),
    error: (title, description, duration, extras = {}) => show({ type:'error', title, description, duration, ...extras }),
    info: (title, description, duration, extras = {}) => show({ type:'info', title, description, duration, ...extras }),
    warn: (title, description, duration, extras = {}) => show({ type:'warn', title, description, duration, ...extras })
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export default ToastContext;

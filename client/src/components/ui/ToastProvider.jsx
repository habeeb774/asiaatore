import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((msg, opts = {}) => {
    const id = ++idCounter;
    const toast = { id, msg, type: opts.type || 'info', ttl: opts.ttl || 3000 };
    setToasts(prev => [...prev, toast]);
    if (toast.ttl > 0) {
      setTimeout(() => remove(id), toast.ttl);
    }
    return id;
  }, [remove]);

  // Listen to cart:add event for auto toast
  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || {};
      const name = d.name || 'منتج';
      const id = push({
        title: 'تمت الإضافة إلى السلة',
        name,
        image: d.image || null,
        type: 'success',
        action: { label: 'إتمام الشراء', href: '/checkout' }
      }, { ttl: 2600 });
      try {
        window.dispatchEvent(new CustomEvent('cart:icon-bump'));
      } catch {}
      return id;
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
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map(t => {
          const isObject = typeof t.msg === 'object' && t.msg !== null;
          const data = isObject ? t.msg : { title: t.msg };
          if (data && data.name && typeof data.name === 'object') {
            try { data.name = JSON.stringify(data.name); } catch { data.name = String(data.name); }
          }
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role="status">
              {data.image && (
                <div className="toast-media"><img src={data.image} alt="" /></div>
              )}
              <div className="toast-body">
                <div className="toast-title">{data.title}</div>
                {data.name && <div className="toast-sub">{data.name}</div>}
              </div>
              {data.action?.href && (
                <a className="toast-cta" href={data.action.href}>{data.action.label || 'فتح'}</a>
              )}
              <button onClick={() => remove(t.id)} aria-label="إغلاق" className="toast-close">×</button>
            </div>
          );
        })}
      </div>
      <style>{`
        .toast-region { position: fixed; top: 1rem; inset-inline-end: 1rem; display: flex; flex-direction: column; gap: .5rem; z-index: 2000; }
        .toast { background: #111827; color:#fff; padding:.65rem .75rem; border-radius: 12px; box-shadow:0 10px 30px -10px rgba(9,9,11,.5); font-size:.85rem; display:flex; align-items:center; gap:.65rem; animation: toast-in .28s var(--ease-standard, ease); min-width: 240px; }
        .toast-success { background: linear-gradient(90deg, var(--color-primary), var(--color-primary-alt)); }
        .toast-error { background:#b91c1c; }
        .toast-media { width: 38px; height: 38px; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,.15); flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .toast-media img { width:100%; height:100%; object-fit: cover; display:block; }
        .toast-body { display:flex; flex-direction:column; gap:2px; min-width:0; }
        .toast-title { font-weight: 700; font-size: .82rem; }
        .toast-sub { font-size: .72rem; opacity: .95; }
        .toast-cta { margin-inline-start: .35rem; font-weight:700; font-size:.72rem; background: #fff; color:#0f172a; text-decoration:none; padding:.4rem .6rem; border-radius: 8px; box-shadow:0 3px 8px rgba(0,0,0,.15); }
        .toast-close { background:transparent; border:0; color:#fff; cursor:pointer; font-size:1rem; line-height:1; padding: .1rem .2rem; }
        @keyframes toast-in { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0);} }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export default ToastProvider;

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react'

const ToastContext = createContext(null)

let idSeq = 1

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((opts) => {
    const id = idSeq++
    const { type = 'info', title, description, duration = 3500, action } = opts || {}
    const t = { id, type, title, description, action, createdAt: Date.now() }
    setToasts(prev => [...prev, t])
    if (duration > 0) setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  const api = useMemo(() => ({
    show,
    success: (title, description, duration, extras = {}) => show({ type:'success', title, description, duration, ...extras }),
    error: (title, description, duration, extras = {}) => show({ type:'error', title, description, duration, ...extras }),
    info: (title, description, duration, extras = {}) => show({ type:'info', title, description, duration, ...extras }),
    warn: (title, description, duration, extras = {}) => show({ type:'warn', title, description, duration, ...extras })
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toaster" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status" onClick={() => remove(t.id)}>
            {t.title && <div className="toast-title">{t.title}</div>}
            {t.description && <div className="toast-desc">{t.description}</div>}
            {t.action && t.action.label ? (
              <button
                type="button"
                className="toast-action"
                onClick={(e) => {
                  e.stopPropagation()
                  try { t.action.onClick?.() } catch {}
                  if (t.action.autoClose !== false) remove(t.id)
                }}
              >{t.action.label}</button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export default ToastContext

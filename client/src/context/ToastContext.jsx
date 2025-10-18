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
    const { type = 'info', title, description, duration = 3500 } = opts || {}
    const t = { id, type, title, description, createdAt: Date.now() }
    setToasts(prev => [...prev, t])
    if (duration > 0) setTimeout(() => remove(id), duration)
    return id
  }, [remove])

  const api = useMemo(() => ({
    show,
    success: (title, description, duration) => show({ type:'success', title, description, duration }),
    error: (title, description, duration) => show({ type:'error', title, description, duration }),
    info: (title, description, duration) => show({ type:'info', title, description, duration }),
    warn: (title, description, duration) => show({ type:'warn', title, description, duration })
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toaster" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="status" onClick={() => remove(t.id)}>
            {t.title && <div className="toast-title">{t.title}</div>}
            {t.description && <div className="toast-desc">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
export default ToastContext

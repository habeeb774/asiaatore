import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const toast = useToast?.()
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (user) localStorage.setItem('my_store_user', JSON.stringify(user))
      else localStorage.removeItem('my_store_user')
    } catch {}
  }, [user])

  const login = async (email, password) => {
    const resp = await api.authLogin(email, password)
    if (resp.ok && (resp.accessToken || resp.token)) {
      const access = resp.accessToken || resp.token
      try { localStorage.setItem('my_store_token', access) } catch {}
      setUser(resp.user)
      try { toast?.success?.('تم تسجيل الدخول', resp.user?.email || '') } catch {}
      return { ok: true }
    }
    try { toast?.error?.('فشل تسجيل الدخول', resp?.error || 'تحقق من بيانات الدخول') } catch {}
    return { ok: false, error: resp.error || 'LOGIN_FAILED' }
  }

  // Dev fallback to quickly assume roles (optional)
  const devLoginAs = (role = 'user') => {
    const mock = { id: role + '-mock', role, name: role }
    setUser(mock)
  }

  const logout = async () => {
    try {
      // Ask server to clear cookie session
      await api.request('/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
    } catch {}
    setUser(null)
    try { localStorage.removeItem('my_store_token') } catch {}
    try { toast?.info?.('تم تسجيل الخروج') } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, devLoginAs }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client.js'
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
    try {
      const resp = await api.authLogin(email, password)
      if (resp.ok && (resp.accessToken || resp.token)) {
        const access = resp.accessToken || resp.token
        try { localStorage.setItem('my_store_token', access) } catch {}
        setUser(resp.user)
        try { toast?.success?.('تم تسجيل الدخول', resp.user?.email || '') } catch {}
        return { ok: true }
      }
      const code = resp?.error
      if (code === 'USER_NOT_FOUND') {
        toast?.warn?.('المستخدم غير موجود', 'تحقق من البريد الإلكتروني أو قم بالتسجيل')
      } else if (code === 'WRONG_PASSWORD') {
        toast?.error?.('كلمة المرور غير صحيحة', 'حاول مرة أخرى أو استخدم خيار استعادة كلمة المرور')
      } else if (code === 'DB_UNAVAILABLE') {
        toast?.error?.('خدمة الدخول غير متاحة', 'حاول لاحقاً، أو استخدم تسجيل الدخول التجريبي إن كان مفعلاً')
      } else if (code === 'MISSING_CREDENTIALS') {
        toast?.warn?.('بيانات ناقصة', 'يرجى إدخال البريد الإلكتروني وكلمة المرور')
      } else {
        toast?.error?.('فشل تسجيل الدخول', code || 'تحقق من بيانات الدخول')
      }
      return { ok: false, error: code || 'LOGIN_FAILED' }
    } catch (e) {
      const msg = e?.message?.includes('Network error') ? 'تعذر الاتصال بالخادم' : 'حدث خطأ غير متوقع'
      toast?.error?.('فشل تسجيل الدخول', msg)
      return { ok: false, error: 'NETWORK_OR_UNKNOWN' }
    }
  }

  // Dev fallback to quickly assume roles (optional)
  const devLoginAs = (role = 'user') => {
    // Use stable IDs to align with demo data from StoreContext (e.g., seller-1)
    const ids = { seller: 'seller-1', admin: 'admin-1', user: 'user-1', delivery: 'delivery-1' }
    const mock = { id: ids[role] || (role + '-mock'), role, name: role }
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
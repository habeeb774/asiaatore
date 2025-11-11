import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api/client.js'
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

  // Ensure user state matches token presence on boot (avoid server 401 spam when a stale user remains)
  useEffect(() => {
    try {
      const token = localStorage.getItem('my_store_token')
      if (!token && user) {
        // If no access token, treat as guest (clear stale user)
        setUser(null)
      }
    } catch {}
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email, password, mfaCode = null) => {
    try {
      const resp = await api.authLogin(email, password, mfaCode)
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
      } else if (code === 'MFA_REQUIRED') {
        toast?.info?.('مطلوب رمز MFA', 'أدخل رمز التحقق من تطبيق المصادقة')
        return { ok: false, error: 'MFA_REQUIRED' }
      } else if (code === 'INVALID_MFA_CODE') {
        toast?.error?.('رمز MFA غير صحيح', 'تحقق من الرمز وحاول مرة أخرى')
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

  // Method to set user and token directly (for auto-login after registration)
  const setAuthData = (token, userData) => {
    try {
      localStorage.setItem('my_store_token', token);
      setUser(userData);
      try { toast?.success?.('تم إنشاء الحساب وتسجيل الدخول', userData?.email || userData?.phone || '') } catch {}
    } catch (e) {
      console.error('Failed to set auth data:', e);
    }
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
    <AuthContext.Provider value={{ user, login, logout, setAuthData }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext
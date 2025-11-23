import React, { createContext, useContext, useEffect, useState } from 'react'
import { useCurrentUser, useLogin, useLogout, useSetAuthData, authKeys } from '../hooks/useAuthQuery'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from './ToastContext'
import { useLanguage } from '../context/LanguageContext'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const toast = useToast?.()
  const queryClient = useQueryClient()
  const { t } = useLanguage()
  
  // Server state from React Query
  const { data: user, isLoading, error } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const setAuthDataMutation = useSetAuthData();
  
  // Client-only state for initial synchronous load from localStorage
  const [localUser, setLocalUser] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  // Sync server state (from React Query) to local state and localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('my_store_user', JSON.stringify(user))
        setLocalUser(user)
      } else {
        localStorage.removeItem('my_store_user')
        setLocalUser(null)
      }
    } catch {}
  }, [user])

  // Ensure user state matches token presence on boot
  useEffect(() => {
    try {
      const token = localStorage.getItem('my_store_token')
      if (!token && localUser) {
        // If no access token, treat as guest (clear stale user)
        setLocalUser(null)
      }
    } catch {}
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Centralized error handling for login
  const loginErrorMap = new Map([
    ['USER_NOT_FOUND', { type: 'warn', title: t('user_not_found'), description: t('check_email_or_register') }],
    ['WRONG_PASSWORD', { type: 'error', title: t('incorrect_password'), description: t('try_again_or_reset') }],    
    ['INVALID_LOGIN', { type: 'error', title: t('invalid_credentials'), description: t('incorrect_email_or_password') }],
    ['MFA_REQUIRED', { type: 'info', title: t('mfa_required'), description: t('enter_mfa_code') }],
    ['INVALID_MFA_CODE', { type: 'error', title: t('invalid_mfa_code'), description: t('check_code_and_retry') }],
    ['DB_UNAVAILABLE', { type: 'error', title: t('login_service_unavailable'), description: t('try_again_later') }],
    ['MISSING_CREDENTIALS', { type: 'warn', title: t('missing_data'), description: t('enter_email_and_password') }],
    ['MISSING_FIELDS', { type: 'warn', title: t('incomplete_data'), description: t('complete_required_fields') }],
    ['ACCOUNT_LOCKED', { type: 'error', title: t('account_locked'), description: t('account_locked_due_to_attempts') }],
    ['ACCOUNT_SUSPENDED', { type: 'error', title: t('account_suspended'), description: t('contact_support') }],
    ['EMAIL_NOT_VERIFIED', { type: 'warn', title: t('email_not_verified'), description: t('please_verify_email') }],
    ['PHONE_NOT_VERIFIED', { type: 'warn', title: t('phone_not_verified'), description: t('please_verify_phone') }],
  ]);

  const login = async (identifier, password, mfaCode = null) => {
    try {
      const result = await loginMutation.mutateAsync({ identifier, password, mfaCode });
      
      // If we get here, login was successful
      return { 
        ok: true, 
        user: result.user || result.data?.user,
        token: result.token || result.jwt || result.accessToken
      };
      
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      
      const code = error?.error || error?.code || 'UNKNOWN_ERROR';
      const errorDetails = loginErrorMap.get(code);
      const errorMessage = error?.message || error?.error?.message;

      if (errorDetails) {
        toast?.[errorDetails.type]?.(
          errorDetails.title, 
          errorDetails.description
        );
      } else {
        toast?.error?.(
          t('login_failed'), 
          errorMessage || code || t('unexpected_error')
        );
      }

      if (code === 'MFA_REQUIRED') {
        return { ok: false, error: 'MFA_REQUIRED' };
      }
      
      return { 
        ok: false, 
        error: code,
        message: errorMessage
      };
    }
  }

  // Method to set user and token directly (for auto-login after registration)
  const setAuthData = (token, userData) => {
    try {
      setAuthDataMutation.mutate({ token, userData });
      try { toast?.success?.(t('account_created_and_logged_in'), userData?.email || userData?.phone || '') } catch {}
    } catch (e) {
      console.error('Failed to set auth data:', e);
    }
  }

  // Development login helper
  const devLoginAs = (role = 'user') => {
    const devUser = {
      id: role === 'admin' ? 'dev-admin' : 'dev-user',
      email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
      name: role === 'admin' ? 'Dev Admin' : 'Dev User',
      role: role,
      phone: '+966000000000'
    };
    
    // Set dev user in local state
    setLocalUser(devUser);
    localStorage.setItem('my_store_user', JSON.stringify(devUser));
    
    // Set a dev token
    const devToken = btoa(JSON.stringify(devUser));
    localStorage.setItem('my_store_token', devToken);
    
    // Update query cache
    queryClient.setQueryData(authKeys.user(), devUser);
    
    try { 
      const roleName = role === 'admin' ? t('admin') : t('user');
      toast?.success?.(`${t('logged_in_as')} ${roleName}`); 
    } catch {}
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      console.error('Logout failed:', e);
    }
    try { toast?.info?.(t('logged_out')) } catch {}
  }

  // Expose auth functions to window for development testing
  if (import.meta.env.DEV) {
    window.auth = { login, logout, devLoginAs, user: user || localUser };
  }

  return (
    <AuthContext.Provider value={{ user: user || localUser, login, logout, setAuthData, devLoginAs, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export default AuthContext

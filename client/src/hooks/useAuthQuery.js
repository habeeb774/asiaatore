import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api/client';

// Query keys
export const authKeys = {
  all: ['auth'],
  user: () => [...authKeys.all, 'user'],
};

// Get current user
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      return await api.me();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    // Enable fetching current user when an access token exists OR when a
    // local dev user stub is present in localStorage (helps local admin testing).
    // This avoids requiring a valid access token during local development while
    // still keeping production behavior unchanged unless the localStorage key
    // is explicitly set by the developer or tests.
    enabled: !!localStorage.getItem('my_store_token') || !!localStorage.getItem('my_store_user'),
    retry: false,
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ identifier, password, mfaCode = null }) => {
      try {
        const resp = await api.authLogin(identifier, password, mfaCode);
        console.log('Login response:', resp); // Debug log
        
        // Check for token in common response formats
        const token = resp?.data?.jwt || resp?.jwt || resp?.accessToken || resp?.token;
        if (token) {
          localStorage.setItem('my_store_token', token);
          return { ...resp, user: resp.user || resp.data?.user };
        }
        
        // If no token but response is ok, still return the response
        if (resp.ok) {
          return resp;
        }
        
        throw { error: resp.error || 'LOGIN_FAILED', ...resp };
      } catch (error) {
        console.error('Login error:', error);
        throw error.error ? error : { error: 'LOGIN_FAILED', message: error.message };
      }
    },
    onSuccess: (data) => {
      // Set user data in query cache
      queryClient.setQueryData(authKeys.user(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onError: (error) => {
      // Clear invalid token
      if (error.code === 'USER_NOT_FOUND' || error.code === 'WRONG_PASSWORD') {
        localStorage.removeItem('my_store_token');
      }
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        // Ask server to clear cookie session
        await api.authLogout();
      } catch {
        // Continue with client-side logout even if server call fails
      }
    },
    onSuccess: () => {
      // Clear client-side data
      localStorage.removeItem('my_store_token');
      queryClient.clear();
      queryClient.setQueryData(authKeys.user(), null);
    },
  });
};

// Update user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (patch) => {
      return await api.meUpdate(patch);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(authKeys.user(), updatedUser);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

// Set auth data (for registration/auto-login)
export const useSetAuthData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ token, userData }) => {
      localStorage.setItem('my_store_token', token);
      return userData;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(authKeys.user(), userData);
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
};

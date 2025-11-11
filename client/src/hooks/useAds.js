import { useQuery } from '@tanstack/react-query';
import api from '../services/api/client';

/**
 * Hook for fetching ads with React Query caching
 * @param {Object} options - Query options
 * @param {number} options.staleTime - How long to consider data fresh (default: 5 minutes)
 * @param {number} options.gcTime - How long to keep in cache (default: 10 minutes)
 * @param {boolean} options.enabled - Whether to run the query (default: true)
 * @returns {Object} React Query result object
 */
export const useAds = (options = {}) => {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    enabled = true,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      console.log('[useAds] Fetching ads...');
      const res = await api.listAds();
      console.log('[useAds] Raw response:', res);
      const arr = Array.isArray(res) ? res : [];
      const filtered = arr.filter(a => a && a.active);
      console.log('[useAds] Filtered active ads:', filtered);
      return filtered;
    },
    staleTime,
    gcTime,
    enabled,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });
};
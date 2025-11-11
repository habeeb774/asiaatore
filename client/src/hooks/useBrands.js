import { useQuery } from '@tanstack/react-query';
import api from '../services/api/client';

/**
 * Hook for fetching brands with React Query caching
 * @param {Object} options - Query options
 * @param {number} options.staleTime - How long to consider data fresh (default: 5 minutes)
 * @param {number} options.gcTime - How long to keep in cache (default: 10 minutes)
 * @param {boolean} options.enabled - Whether to run the query (default: true)
 * @returns {Object} React Query result object
 */
export const useBrands = (options = {}) => {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    enabled = true,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const list = await api.brandsList();
      return Array.isArray(list) ? list : [];
    },
    staleTime,
    gcTime,
    enabled,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });
};
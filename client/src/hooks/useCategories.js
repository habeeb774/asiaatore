import { useQuery } from '@tanstack/react-query';
import api from '../services/api/client';

/**
 * Hook for fetching categories with React Query caching
 * @param {Object} options - Query options
 * @param {number} options.withCounts - Whether to include product counts (default: 1)
 * @param {number} options.staleTime - How long to consider data fresh (default: 5 minutes)
 * @param {number} options.gcTime - How long to keep in cache (default: 10 minutes)
 * @param {boolean} options.enabled - Whether to run the query (default: true)
 * @returns {Object} React Query result object
 */
export default function useCategories(options = {}) {
  const {
    withCounts = 1,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
    enabled = true,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ['categories', { withCounts }],
    queryFn: async () => {
      const res = await api.listCategories({ withCounts });
      return Array.isArray(res?.categories) ? res.categories : [];
    },
    staleTime,
    gcTime,
    enabled,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions,
  });
}

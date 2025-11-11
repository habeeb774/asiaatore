import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for better performance
      staleTime: 15 * 60_000, // 15 minutes - products/categories don't change often
      gcTime: 60 * 60_000, // 1 hour cache retention
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors like 401, 403, 404, 429)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 1 time for 5xx errors to reduce load
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Disable to reduce unnecessary API calls
      refetchOnReconnect: 'always',
      refetchOnMount: false, // Use cache if available
      // Abort fetch when component unmounts
      networkMode: 'online',
      // Add background refetch for critical data
      refetchInterval: (query) => {
        // Refetch cart/user data every 2 minutes in background
        if (query.queryKey[0] === 'cart' || query.queryKey[0] === 'user') {
          return 2 * 60_000;
        }
        return false;
      },
    },
    mutations: {
      retry: 0,
      // Optimistic updates for better UX
      onError: (error, variables, context) => {
        // Revert optimistic updates on error
        if (context?.previousData) {
          // This would be handled by individual mutation hooks
        }
      },
    },
  },
});

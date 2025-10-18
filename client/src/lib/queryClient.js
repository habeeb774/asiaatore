import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 60s; garbage-collect after 5 minutes
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: 'always',
      // Abort fetch when component unmounts
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
    },
  },
});

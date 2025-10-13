import { Stack } from 'expo-router';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { ThemeProvider } from '../lib/theme';
import { useStoreSettings } from '../lib/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function InnerLayout() {
  const { data } = useStoreSettings();
  const overrides = {
    primary: data?.colorPrimary || undefined,
    secondary: data?.colorSecondary || undefined,
    accent: data?.colorAccent || undefined,
  } as any;
  return (
    <ThemeProvider overrides={overrides}>
      <ToastProvider>
        <CartProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ title: 'الرئيسية' }} />
            <Stack.Screen name="login" options={{ title: 'دخول' }} />
            <Stack.Screen name="orders" options={{ title: 'طلباتي' }} />
            <Stack.Screen name="product/[id]" options={{ title: 'المنتج' }} />
          </Stack>
        </CartProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <InnerLayout />
    </QueryClientProvider>
  );
}

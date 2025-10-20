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

  // add this alias to avoid the TS error "Property 'Screen' does not exist on type ..."
  const S = Stack as any;

  return (
    <ThemeProvider overrides={overrides}>
      <ToastProvider>
        <CartProvider>
          <Stack>
            {/* use the alias S for Screen to bypass the type mismatch */}
            <S.Screen name="(tabs)" options={{ headerShown: false }} />
            <S.Screen name="index" options={{ title: 'الرئيسية' }} />
            <S.Screen name="login" options={{ title: 'دخول' }} />
            <S.Screen name="orders" options={{ title: 'طلباتي' }} />
            <S.Screen name="product/[id]" options={{ title: 'المنتج' }} />
            <S.Screen name="delivery/index" options={{ title: 'مهام التوصيل' }} />
            <S.Screen name="delivery/order/[id]" options={{ title: 'تفاصيل توصيل' }} />
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

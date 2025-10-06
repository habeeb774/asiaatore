import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import './index.css';
// SCSS bundles
import './css/_design-system.scss';
import './css/theme.scss';
import './css/product-details.scss';
import './css/ProductList.scss';
import './css/product-card.scss';
import './css/pages.scss';
import './css/enhancements.scss';
import './css/HomePage.scss'; // لاحقاً استبدل باستيراد partials
import './css/top-strips.scss';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { OrdersProvider } from './context/OrdersContext';
import { AdminProvider } from './context/AdminContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { useToast } from './context/ToastContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

// Component to sync <html dir/lang>
const HtmlLanguageSync = () => {
  const { locale } = useLanguage();
  React.useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', locale === 'ar' ? 'ar' : 'en');
    html.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  }, [locale]);
  return null;
};

// Providers must render within Router so any hooks like useLocation/useNavigate work.
const GlobalToastEvents = () => {
  const toast = useToast();
  React.useEffect(() => {
    const onToast = (e) => {
      const { type='info', title, description, duration } = e.detail || {};
      const fn = type === 'success' ? toast.success : type === 'error' ? toast.error : type === 'warn' ? toast.warn : toast.info;
      fn(title, description, duration);
    };
    window.addEventListener('toast:show', onToast);
    return () => window.removeEventListener('toast:show', onToast);
  }, [toast]);
  return null;
};

const Providers = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    <LanguageProvider>
      <AuthProvider>
        <ProductsProvider>
          <CartProvider>
            <WishlistProvider>
              <OrdersProvider>
                <AdminProvider>
                  <SettingsProvider>
                    <ToastProvider>
                    <HtmlLanguageSync />
                    <GlobalToastEvents />
                    {children}
                    </ToastProvider>
                  </SettingsProvider>
                </AdminProvider>
              </OrdersProvider>
            </WishlistProvider>
          </CartProvider>
        </ProductsProvider>
      </AuthProvider>
    </LanguageProvider>
  </I18nextProvider>
);

const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <Providers>
        <AppRoutes />
      </Providers>
    )
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    />
    {/* Devtools only in dev */}
    {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>
);

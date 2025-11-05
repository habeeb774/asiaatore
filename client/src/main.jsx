import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import './index.css';
import './styles/ui.css';
// Local Cairo font (self-hosted via package)
import '@fontsource/cairo/300.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
// Tajawal is loaded from Google Fonts in index.html to avoid requiring the npm package
// SCSS bundles
import './styles/index.scss';
// Route-specific styles are imported in their pages to allow CSS code-splitting
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
import { useRegisterSW } from 'virtual:pwa-register/react';
// AOS (Animate On Scroll) initialization — optional: will initialize if library is available
// We try to initialize AOS if it's loaded via CDN (window.AOS) or installed as a module.
if (typeof window !== 'undefined') {
  // Prefer CDN-included AOS (via index.html) and initialize it if present.
  if (window.AOS && typeof window.AOS.init === 'function') {
    try { window.AOS.init({ duration: 600, once: true }); } catch (e) {}
  }
}
import { ThemeProvider } from './context/ThemeContext';
import ScrollTopButton from './components/common/ScrollTopButton';
// Leaflet CSS is imported by the map route to avoid bundling it into the main entry

// In development, ensure no stale service workers/caches interfere with Vite HMR
if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    if (window.caches && caches.keys) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
  } catch {}
}

// Component to sync <html dir/lang>
const HtmlLanguageSync = () => {
  const { locale } = useLanguage();
  React.useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', ['ar','en','fr'].includes(locale) ? locale : (locale === 'ar' ? 'ar' : 'en'));
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
    <ThemeProvider>
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
                        <PwaUpdatePrompt />
                        {/* Global haptics: vibrate briefly on add-to-cart if supported and not reduced-motion */}
                        <HapticsEvents />
                        <ScrollTopButton />
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
    </ThemeProvider>
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

const showRQDevtools = import.meta.env.VITE_SHOW_RQ_DEVTOOLS === '1';

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider
      router={router}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    />
    {/* TanStack Devtools: opt-in via VITE_SHOW_RQ_DEVTOOLS=1 */}
    {showRQDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
  </QueryClientProvider>
);

// Component placed after render to register global haptic feedback events
function HapticsEvents() {
  React.useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    if (!canVibrate) return;
    const onAdd = () => {
      if (prefersReduced) return;
      try { navigator.vibrate(12); } catch {}
    };
    window.addEventListener('cart:add', onAdd);
    return () => window.removeEventListener('cart:add', onAdd);
  }, []);
  return null;
}

function PwaUpdatePrompt() {
  const toast = useToast();
  const updateToastRef = React.useRef(null);
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      if (!toast?.show) return;
      if (updateToastRef.current) return;
      const id = toast.show({
        type: 'info',
        title: 'تحديث جديد جاهز',
        description: 'أعد تحميل التطبيق لتطبيق آخر التحسينات.',
        duration: 0,
        action: {
          label: 'تحديث الآن',
          onClick: () => {
            updateToastRef.current = null;
            if (typeof updateServiceWorker === 'function') {
              try { updateServiceWorker(true); } catch {}
            } else {
              window.location.reload();
            }
          }
        }
      });
      updateToastRef.current = id;
    },
    onOfflineReady() {
      toast?.success?.('جاهز للعمل دون اتصال', 'يمكنك متابعة التصفح حتى بدون إنترنت', 4000);
    },
    onRegisterError(err) {
      console.warn('[PWA] register error', err);
    }
  });

  React.useEffect(() => {
    return () => { updateToastRef.current = null; };
  }, []);

  return null;
}

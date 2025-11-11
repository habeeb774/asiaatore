import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import AppRoutes from './AppRoutes';
import './index.css';
import './styles/ui.css';
import './styles/design-tokens.css';
import './styles/reda-store-theme.css';
// Local Cairo font (self-hosted via package) - load only essential weights initially
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';

// Lazy load additional font weights only when needed
const loadAdditionalFonts = () => {
  if (typeof document !== 'undefined') {
    // Load additional weights after initial render with lower priority
    setTimeout(() => {
      import('@fontsource/cairo/300.css');
      import('@fontsource/cairo/500.css');
      import('@fontsource/cairo/700.css');
    }, 2000); // Delay additional fonts to prioritize content
  }
};

// Tajawal is loaded from Google Fonts in index.html to avoid requiring the npm package
// SCSS bundles
import './styles/index.scss';
// Route-specific styles are imported in their pages to allow CSS code-splitting
import { LanguageProvider, useLanguage } from './stores/LanguageContext';
import { ProductsProvider } from './stores/ProductsContext';
import { CartProvider } from './stores/CartContext';
import { WishlistProvider } from './stores/WishlistContext';
import { AuthProvider } from './stores/AuthContext';
import { OrdersProvider } from './stores/OrdersContext';
import { AdminProvider } from './stores/AdminContext';
import { SettingsProvider } from './stores/SettingsContext';
import { ToastProvider } from './stores/ToastContext';
import { useToast } from './stores/ToastContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import ErrorBoundary from './components/ErrorBoundary';
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
// AOS (Animate On Scroll) initialization — optional: will initialize if library is available
// We try to initialize AOS if it's loaded via CDN (window.AOS) or installed as a module.
if (typeof window !== 'undefined') {
  // Prefer CDN-included AOS (via index.html) and initialize it if present.
  if (window.AOS && typeof window.AOS.init === 'function') {
  try { window.AOS.init({ duration: 600, once: true }); } catch {}
  }
}
import { DesignTokenProvider } from './stores/DesignTokenContext';
import { ThemeProvider } from './stores/ThemeContext';
import { ExperimentProvider } from './stores/ExperimentContext';
import ScrollTopButton from './components/common/ScrollTopButton';
// Leaflet CSS is imported by the map route to avoid bundling it into the main entry
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Lazy load advanced feature providers - only load when needed
const GamificationProvider = React.lazy(() => import('./components/features/Gamification/Gamification.jsx').then(m => ({ default: m.GamificationProvider })));
const NFTLoyaltyProvider = React.lazy(() => import('./components/features/NFTLoyalty/NFTLoyalty.jsx').then(m => ({ default: m.NFTLoyaltyProvider })));
const SmartInventoryProvider = React.lazy(() => import('./components/features/SmartInventoryAI/SmartInventoryAI.jsx').then(m => ({ default: m.SmartInventoryProvider })));
const PersonalizationProvider = React.lazy(() => import('./components/features/DynamicPersonalization/DynamicPersonalization.jsx').then(m => ({ default: m.PersonalizationProvider })));
const SustainabilityProvider = React.lazy(() => import('./components/features/Sustainability/Sustainability.jsx').then(m => ({ default: m.SustainabilityProvider })));
const SocialCommerceProvider = React.lazy(() => import('./components/features/SocialCommerce/SocialCommerce.jsx').then(m => ({ default: m.SocialCommerceProvider })));

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

const Providers = ({ children }) => {
  const location = useLocation();
  const pathname = location.pathname || '/';

  // Check if current route needs advanced features
  const needsAdvancedFeatures = pathname.includes('/gamification') ||
                               pathname.includes('/nft-loyalty') ||
                               pathname.includes('/smart-inventory') ||
                               pathname.includes('/personalization') ||
                               pathname.includes('/sustainability') ||
                               pathname.includes('/social-commerce') ||
                               pathname.includes('/ar-viewer') ||
                               pathname.includes('/voice-commerce');

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

  return (
    <I18nextProvider i18n={i18n}>
      <DesignTokenProvider>
        <ThemeProvider>
          <ExperimentProvider>
            <LanguageProvider>
              <AuthProvider>
                <ProductsProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <OrdersProvider>
                        <AdminProvider>
                          <SettingsProvider>
                            <ToastProvider>
                              <Elements stripe={stripePromise}>
                                <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "SAR" }}>
                                  <HtmlLanguageSync />
                                  <GlobalToastEvents />
                                  <PwaUpdatePrompt />
                                  {/* Global haptics: vibrate briefly on add-to-cart if supported and not reduced-motion */}
                                  <HapticsEvents />
                                  <ScrollTopButton />
                                  {needsAdvancedFeatures ? (
                                    <Suspense fallback={null}>
                                      <GamificationProvider>
                                        <NFTLoyaltyProvider>
                                          <SmartInventoryProvider>
                                            <PersonalizationProvider>
                                              <SustainabilityProvider>
                                                <SocialCommerceProvider>
                                                  {children}
                                                </SocialCommerceProvider>
                                              </SustainabilityProvider>
                                            </PersonalizationProvider>
                                          </SmartInventoryProvider>
                                        </NFTLoyaltyProvider>
                                      </GamificationProvider>
                                    </Suspense>
                                  ) : (
                                    children
                                  )}
                                </PayPalScriptProvider>
                              </Elements>
                            </ToastProvider>
                          </SettingsProvider>
                        </AdminProvider>
                      </OrdersProvider>
                    </WishlistProvider>
                  </CartProvider>
                </ProductsProvider>
              </AuthProvider>
            </LanguageProvider>
          </ExperimentProvider>
        </ThemeProvider>
      </DesignTokenProvider>
    </I18nextProvider>
  );
};const router = createBrowserRouter([
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

// Load additional fonts after initial render
loadAdditionalFonts();

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
  // Temporarily disabled to fix React 19 compatibility issues
  /*
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
  */

  return null;
}

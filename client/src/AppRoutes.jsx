import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ChatProvider } from './contexts/ChatContext.jsx';
import { RouteErrorBoundary, PageFallback } from './components/routing/RouteBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import lazyWithRetry from './utils/lazyWithRetry';
// Admin and account pages were previously eagerly imported; convert to lazy for bundle size reduction.
const AdminUsers = lazyWithRetry(() => import(/* webpackChunkName: "admin-users" */ './pages/admin/users/AdminUsers'));
const Reports = lazyWithRetry(() => import(/* webpackChunkName: "admin-reports" */ './pages/admin/reports/Reports'));
const BankTransfers = lazyWithRetry(() => import(/* webpackChunkName: "admin-orders" */ './pages/admin/orders/BankTransfers'));
const Analytics = lazyWithRetry(() => import(/* webpackChunkName: "admin-analytics" */ './pages/admin/analytics/Analytics'));
const Customers = lazyWithRetry(() => import(/* webpackChunkName: "admin-users" */ './pages/admin/users/Customers'));
const Settings = lazyWithRetry(() => import(/* webpackChunkName: "admin-settings" */ './pages/admin/Settings'));
const AuditAdmin = lazyWithRetry(() => import(/* webpackChunkName: "admin-reports" */ './pages/admin/reports/AuditAdmin'));
const ReviewsAdmin = lazyWithRetry(() => import(/* webpackChunkName: "admin-products" */ './pages/admin/products/ReviewsAdmin'));
const BrandsAdmin = lazyWithRetry(() => import(/* webpackChunkName: "admin-products" */ './pages/admin/products/BrandsAdmin'));
const AccountSecurity = lazyWithRetry(() => import(/* webpackChunkName: "account-security" */ './pages/account/AccountSecurity.jsx'));
const DeveloperSettings = lazyWithRetry(() => import(/* webpackChunkName: "admin-settings" */ './pages/admin/integrations/DeveloperSettings.jsx'));
const AnalyticsDashboard = lazyWithRetry(() => import(/* webpackChunkName: "admin-analytics" */ './pages/admin/analytics/AnalyticsDashboard'));
import { initAnalytics, trackPageView } from './lib/analytics';

// Lazy load heavy pages to split bundles per-route
const Home = lazyWithRetry(() => import('./pages/misc/Home.jsx'));
const Cart = lazyWithRetry(() => import('./pages/checkout/Cart.jsx'));
const CheckoutPage = lazyWithRetry(() => import('./pages/checkout/CheckoutPage.jsx'));
const LoginPage = lazyWithRetry(() => import('./pages/auth/index.js').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazyWithRetry(() => import('./pages/auth/index.js').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazyWithRetry(() => import('./pages/auth/index.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazyWithRetry(() => import('./pages/auth/ResetPasswordPage.jsx'));
const VerifyEmailPage = lazyWithRetry(() => import('./pages/auth/VerifyEmailPage.jsx'));
const Orders = lazyWithRetry(() => import('./pages/orders/Orders.jsx'));
const MyOrders = lazyWithRetry(() => import('./pages/orders/MyOrders.jsx'));
const OrderDetails = lazyWithRetry(() => import('./pages/orders/OrderDetails.jsx'));
const AdminDashboard = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/dashboard/AdminDashboard.jsx'));
const ProductInventory = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/products/ProductInventory.jsx'));
const AdminOrders = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/orders/Orders.jsx'));
const AdminInvoices = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/orders/Invoices.jsx'));
const AdminMarketing = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/Marketing.jsx'));
const AdminCategories = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/products/CategoriesAdmin.jsx'));
const AdminApps = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/Apps.jsx'));
const AdminIntegrations = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/Integrations.jsx'));
const AdminAds = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/AdsAdmin.jsx'));
const SellerDashboard = lazyWithRetry(() => import(/* webpackChunkName: "seller" */ './pages/seller/SellerDashboard.jsx'));
const DeliveryDashboard = lazyWithRetry(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/DeliveryDashboard.jsx'));
import Canonical from './components/Canonical';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence, motion } from './lib/framerLazy.js';
// NOTE: useLanguage was imported but unused; removed to prevent lint warning.
const ProductDetailPage = lazyWithRetry(() => import(/* webpackChunkName: "product" */ './pages/products/ProductDetailPage.jsx'));
const StoresPage = lazyWithRetry(() => import(/* webpackChunkName: "stores" */ './pages/store/StoresPage.jsx'));
const OffersPage = lazyWithRetry(() => import(/* webpackChunkName: "offers" */ './pages/misc/OffersPage.jsx'));
const InvoiceViewer = lazyWithRetry(() => import(/* webpackChunkName: "invoice" */ './pages/orders/InvoiceViewer.jsx'));
const CatalogPage = lazyWithRetry(() => import(/* webpackChunkName: "catalog" */ './pages/products/CatalogPage.jsx'));
const LegalPage = lazyWithRetry(() => import(/* webpackChunkName: "legal" */ './pages/legal/Legal.jsx'));
const ProductsPage = lazyWithRetry(() => import(/* webpackChunkName: "products" */ './pages/products/Products.jsx'));
const ChatPage = lazyWithRetry(() => import(/* webpackChunkName: "chat" */ './pages/misc/Chat.jsx'));
const ProductReviews = lazyWithRetry(() => import(/* webpackChunkName: "reviews" */ './pages/products/ProductReviews.jsx'));
const StyleGuide = lazyWithRetry(() => import(/* webpackChunkName: "styleguide" */ './pages/dev/StyleGuide.jsx'));
const SubscriptionPlans = lazyWithRetry(() => import(/* webpackChunkName: "subscriptions" */ './pages/features/SubscriptionPlans.jsx'));
const Wishlist = lazyWithRetry(() => import(/* webpackChunkName: "wishlist" */ './pages/features/Wishlist.jsx'));
const ProfilePage = lazyWithRetry(() => import(/* webpackChunkName: "profile" */ './pages/account/Profile'));
const ProductManager = lazyWithRetry(() => import(/* webpackChunkName: "seller" */ './pages/seller/ProductManager'));
const OrderTracker = lazyWithRetry(() => import(/* webpackChunkName: "orders" */ './pages/orders/OrderTracker.jsx'));
const AddressesPage = lazyWithRetry(() => import(/* webpackChunkName: "profile" */ './pages/account/Addresses.jsx'));
const SellerKyc = lazyWithRetry(() => import(/* webpackChunkName: "seller" */ './pages/seller/SellerKyc.jsx'));
const AdminKycReview = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/users/AdminKycReview.jsx'));
const SellerAdminPage = lazyWithRetry(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/users/SellerAdminPage.jsx'));
const DeliveryMap = lazyWithRetry(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/Map.jsx'));
const DeliveryHistory = lazyWithRetry(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/History.jsx'));
const DeliveryAvailability = lazyWithRetry(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/Availability.jsx'));
const DeliverySummary = lazyWithRetry(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/DeliverySummary.jsx'));
const UIPreview = lazyWithRetry(() => import(/* webpackChunkName: "ui" */ './pages/dev/UIPreview.jsx'));
const SearchResults = lazyWithRetry(() => import(/* webpackChunkName: "search" */ './pages/misc/SearchResults.jsx'));
// Home page now fully implemented (replaces placeholder)
const ToastTest = lazyWithRetry(() => import('./pages/dev/ToastTest.jsx'));
const NFTLoyaltyPage = lazyWithRetry(() => import(/* webpackChunkName: "nft" */ './pages/features/NFTLoyaltyPage.jsx'));
const GamificationPage = lazyWithRetry(() => import(/* webpackChunkName: "gamification" */ './pages/features/GamificationPage.jsx'));
const ARViewerPage = lazyWithRetry(() => import(/* webpackChunkName: "ar" */ './pages/features/ARViewerPage.jsx'));
const VoiceCommercePage = lazyWithRetry(() => import(/* webpackChunkName: "voice" */ './pages/features/VoiceCommercePage.jsx'));
const SocialCommercePage = lazyWithRetry(() => import(/* webpackChunkName: "social" */ './pages/features/SocialCommercePage.jsx'));
const SmartInventoryPage = lazyWithRetry(() => import(/* webpackChunkName: "inventory" */ './pages/features/SmartInventoryPage.jsx'));
const PersonalizationPage = lazyWithRetry(() => import(/* webpackChunkName: "personalization" */ './pages/features/PersonalizationPage.jsx'));
const SustainabilityPage = lazyWithRetry(() => import(/* webpackChunkName: "sustainability" */ './pages/features/SustainabilityPage.jsx'));

const RouteTracker = () => {
  const location = useLocation();
  const [analyticsLoaded, setAnalyticsLoaded] = React.useState(false);

  // Lazy load analytics on user interaction
  const loadAnalytics = React.useCallback(() => {
    if (analyticsLoaded) return;
    try {
      initAnalytics();
      setAnalyticsLoaded(true);
    } catch {}
  }, [analyticsLoaded]);

  // Load analytics on first user interaction
  React.useEffect(() => {
    const handleInteraction = () => {
      loadAnalytics();
      // Remove listeners after first interaction
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    // Add interaction listeners
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('scroll', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    // Fallback: load after 30 seconds if no interaction (increased delay)
    const timeout = setTimeout(() => {
      loadAnalytics();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    }, 30000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [loadAnalytics]);

  useEffect(() => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'page_view',
        path: location.pathname,
        timestamp: Date.now()
      });
      // GA4 page_view - only if analytics is loaded
      if (analyticsLoaded) {
        trackPageView(location.pathname);
      }
      // Dispatch a single SPA re-init event for home enhancements (throttled per route change)
      const ev = new CustomEvent('reinit:home', {
        detail: { path: location.pathname, ts: Date.now() }
      });
      // schedule after paint to ensure DOM for the new route is ready
      requestAnimationFrame(() => {
        try { document.dispatchEvent(ev); } catch {}
      });
    } catch {}
  }, [location, analyticsLoaded]);
  return null;
};

// Scroll to top smoothly on pathname changes (keep search/hash behavior intact)
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      // Use instant scroll for extremely long pages to avoid long animations
      if (window.scrollY > 2000) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    } catch {}
  }, [pathname]);
  return null;
};

const LocaleGuard = ({ children }) => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  // Allow: (a) no locale segment (Arabic default) (b) supported locale segments 'ar' or 'en' or 'fr'
  // Redirect only if the first segment looks like a 2-letter locale code but is unsupported.
  if (parts[0] && parts[0].length === 2 && !['ar','en','fr'].includes(parts[0])) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Redirect legacy admin query views to dedicated pages while preserving auth/role guards
const AdminRedirect = ({ prefix = '' }) => {
  const { user } = useAuth() || {};
  const userRole = user?.role;
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const view = params.get('view');
  if (!view) return <Navigate to={`${prefix}/admin/overview`} replace />;
  if (view === 'users') return <Navigate to={`${prefix}/admin/users`} replace />;
  if (view === 'customers') return <Navigate to={`${prefix}/admin/customers`} replace />;
  if (view === 'products') return <Navigate to={`${prefix}/admin/products`} replace />;
  if (view === 'orders') return <Navigate to={`${prefix}/admin/orders`} replace />;
  if (view === 'marketing') return <Navigate to={`${prefix}/admin/marketing`} replace />;
  if (view === 'ads') return <Navigate to={`${prefix}/admin/marketing?section=ads`} replace />;
  if (view === 'settings') return <Navigate to={`${prefix}/admin/settings`} replace />;
  if (view === 'invoices') return <Navigate to={`${prefix}/admin/invoices`} replace />;
  if (view === 'audit') return <Navigate to={`${prefix}/admin/audit`} replace />;
  if (view === 'reviews') return <Navigate to={`${prefix}/admin/reviews`} replace />;
  if (view === 'brands') return <Navigate to={`${prefix}/admin/brands`} replace />;
  if (view === 'cats') return <Navigate to={`${prefix}/admin/categories`} replace />;
  if (view === 'sellers') return <Navigate to={`${prefix}/admin/sellers`} replace />;
  if (view === 'sellers_kyc') return <Navigate to={`${prefix}/admin/sellers/kyc`} replace />;
  return (
    <ProtectedRoute
      isAuthed={!!user}
      userRole={userRole}
      requiredRoles={['admin']}
      element={<AdminDashboard />}
      redirectTo={`${prefix}/login`}
    />
  );
};

const MainAppShell = ({ user, userRole }) => (
  <AppLayout>
    <Canonical />
    <LocaleGuard>
      <ScrollToTop />
      <RouteTracker />
      <RouteErrorBoundary>
      <Suspense fallback={<PageFallback /> }>
      <AnimatePresence mode="wait">
      {/* Key the route container by pathname for page-level transitions */}
      <RouteContainer>
      <Routes>
        {/* Arabic default */}
  <Route path="/" element={<Home />} />
  <Route path="/admin/inventory" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ProductInventory />} redirectTo="/login" />} />
  <Route path="/chat" element={<ProtectedRoute isAuthed={!!user} element={<ChatPage />} redirectTo="/login" />} />
          {/* Admin entry (handles legacy query redirects) */}
          <Route path="/admin" element={<AdminRedirect prefix="" />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ErrorBoundary><ProductDetailPage /></ErrorBoundary>} />
          <Route path="/product/:productId/reviews" element={<ProductReviews />} />
          <Route path="/search" element={<SearchResults />} />
        <Route path="/stores" element={<StoresPage />} />
    <Route path="/offers" element={<OffersPage />} />
  <Route path="/wishlist" element={<Wishlist />} />
    <Route path="/style-guide" element={<StyleGuide />} />
    <Route path="/ui" element={<UIPreview />} />
  {/* demo/hero removed - demo page not present in this template */}
  <Route path="/test/toast" element={<ToastTest />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/subscriptions" element={<SubscriptionPlans />} />
  <Route path="/checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
  <Route path="/orders" element={<Orders />} />
  <Route path="/legal/:slug" element={<LegalPage />} />
  <Route path="/my-orders" element={<MyOrders />} />
  <Route path="/order/:id" element={<OrderDetails />} />
  <Route path="/order/:id/track" element={<OrderTracker />} />
  <Route path="/account/addresses" element={<ProtectedRoute isAuthed={!!user} element={<AddressesPage />} redirectTo="/login" />} />
  <Route path="/invoice/:id" element={<InvoiceViewer />} />
  <Route path="/seller/kyc" element={<ProtectedRoute isAuthed={!!user} element={<SellerKyc />} redirectTo="/login" />} />
  <Route path="/admin/sellers/kyc" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminKycReview />} redirectTo="/login" />} />
  {/* Seller products manager (protected) */}
  <Route
    path="/seller/products"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['seller','admin']}
        element={<ProductManager />}
        redirectTo="/login"
      />
    }
  />
  {/* Delivery dashboard (protected) */}
  <Route
    path="/delivery"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryDashboard />}
        redirectTo="/login"
      />
    }
  />
  <Route
    path="/delivery/map"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryMap />}
        redirectTo="/login"
      />
    }
  />
  <Route
    path="/delivery/history"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryHistory />}
        redirectTo="/login"
      />
    }
  />
  <Route
    path="/delivery/availability"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryAvailability />}
        redirectTo="/login"
      />
    }
  />
  <Route
    path="/delivery/summary"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliverySummary />}
        redirectTo="/login"
      />
    }
  />
  <Route path="/DeliveryDashboard" element={<Navigate to="/delivery" replace />} />
  {/* Seller dashboard (protected) */}
  <Route
    path="/seller"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['seller','admin']}
        element={<SellerDashboard />}
        redirectTo="/login"
      />
    }
  />
  {/* Alias: support capitalized path */}
  <Route path="/SellerDashboard" element={<Navigate to="/seller" replace />} />
  <Route path="/account/security" element={<ProtectedRoute isAuthed={!!user} element={<AccountSecurity />} redirectTo="/login" />} />
  <Route path="/account/profile" element={<ProtectedRoute isAuthed={!!user} element={<ProfilePage />} redirectTo="/login" />} />
  {/* Protected admin route (Arabic default) */}
  <Route path="/admin/overview" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/login" />} />
  <Route path="/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/login" />} />
  <Route path="/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/login" />} />
  <Route path="/admin/products" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/login" />} />
  <Route path="/admin/orders" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminOrders />} redirectTo="/login" />} />
  <Route path="/admin/invoices" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminInvoices />} redirectTo="/login" />} />
  <Route path="/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/login" />} />
  {/* Dedicated Admin Categories page -> redirects to AdminDashboard cats view */}
  <Route path="/admin/categories" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminCategories />} redirectTo="/login" />} />
  <Route path="/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/login" />} />
  <Route path="/admin/audit" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AuditAdmin />} redirectTo="/login" />} />
  <Route path="/admin/reviews" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<ReviewsAdmin />} redirectTo="/login" />} />
  <Route path="/admin/brands" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BrandsAdmin />} redirectTo="/login" />} />
  <Route path="/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/login" />} />
  <Route path="/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/login" />} />
  <Route path="/admin/sellers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<SellerAdminPage />} redirectTo="/login" />} />

<Route path="/checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
<Route path="/en/checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />
<Route path="/fr/checkout" element={<ErrorBoundary><CheckoutPage /></ErrorBoundary>} />

// ...

<Route path="/admin/developer-settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["developer"]} element={<ErrorBoundary><DeveloperSettings /></ErrorBoundary>} redirectTo="/login" />} />
<Route path="/admin/marketing" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminMarketing /></ErrorBoundary>} redirectTo="/login" />} />
<Route path="/admin/apps" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminApps /></ErrorBoundary>} redirectTo="/login" />} />
<Route path="/admin/integrations" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminIntegrations /></ErrorBoundary>} redirectTo="/login" />} />
<Route path="/admin/ads" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminAds /></ErrorBoundary>} redirectTo="/login" />} />

// ...

<Route path="/en/admin/overview" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/en/login" />} />
<Route path="/en/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/en/login" />} />
<Route path="/en/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/en/login" />} />
<Route path="/en/admin/products" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/en/login" />} />
<Route path="/en/admin/orders" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminOrders />} redirectTo="/en/login" />} />
<Route path="/en/admin/invoices" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminInvoices />} redirectTo="/en/login" />} />
<Route path="/en/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/en/login" />} />
<Route path="/en/admin/developer-settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["developer"]} element={<ErrorBoundary><DeveloperSettings /></ErrorBoundary>} redirectTo="/en/login" />} />
<Route path="/en/admin/marketing" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminMarketing /></ErrorBoundary>} redirectTo="/en/login" />} />
<Route path="/en/admin/apps" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminApps /></ErrorBoundary>} redirectTo="/en/login" />} />
<Route path="/en/admin/integrations" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminIntegrations /></ErrorBoundary>} redirectTo="/en/login" />} />
<Route path="/en/admin/ads" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminAds /></ErrorBoundary>} redirectTo="/en/login" />} />
<Route path="/en/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/en/login" />} />
<Route path="/en/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/en/login" />} />
<Route path="/en/admin/audit" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AuditAdmin />} redirectTo="/en/login" />} />
<Route path="/en/admin/reviews" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<ReviewsAdmin />} redirectTo="/en/login" />} />
<Route path="/en/admin/brands" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BrandsAdmin />} redirectTo="/en/login" />} />
<Route path="/en/admin/categories" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminCategories />} redirectTo="/en/login" />} />
<Route path="/en/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/en/login" />} />
<Route path="/en/admin/sellers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<SellerAdminPage />} redirectTo="/en/login" />} />
<Route path="/en/admin/sellers/kyc" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminKycReview />} redirectTo="/en/login" />} />

// ...

<Route path="/fr/admin/overview" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/products" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/orders" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminOrders />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/invoices" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminInvoices />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/developer-settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["developer"]} element={<ErrorBoundary><DeveloperSettings /></ErrorBoundary>} redirectTo="/fr/login" />} />
<Route path="/fr/admin/marketing" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminMarketing /></ErrorBoundary>} redirectTo="/fr/login" />} />
<Route path="/fr/admin/apps" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminApps /></ErrorBoundary>} redirectTo="/fr/login" />} />
<Route path="/fr/admin/integrations" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminIntegrations /></ErrorBoundary>} redirectTo="/fr/login" />} />
<Route path="/fr/admin/ads" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ErrorBoundary><AdminAds /></ErrorBoundary>} redirectTo="/fr/login" />} />
<Route path="/fr/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/audit" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AuditAdmin />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/reviews" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<ReviewsAdmin />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/brands" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BrandsAdmin />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/categories" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminCategories />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/sellers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<SellerAdminPage />} redirectTo="/fr/login" />} />
<Route path="/fr/admin/sellers/kyc" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminKycReview />} redirectTo="/fr/login" />} />
  {/* Advanced Features */}
  <Route path="/fr/gamification" element={<ProtectedRoute isAuthed={!!user} element={<GamificationPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/ar-viewer" element={<ARViewerPage />} />
  <Route path="/fr/voice-commerce" element={<VoiceCommercePage />} />
  <Route path="/fr/social-commerce" element={<ProtectedRoute isAuthed={!!user} element={<SocialCommercePage />} redirectTo="/fr/login" />} />
  <Route path="/fr/smart-inventory" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin','seller']} element={<SmartInventoryPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/personalization" element={<ProtectedRoute isAuthed={!!user} element={<PersonalizationPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/sustainability" element={<SustainabilityPage />} />
  <Route path="/fr/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/account/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/fr/login" />} />
      </Routes>
      </RouteContainer>
      </AnimatePresence>
      </Suspense>
      </RouteErrorBoundary>
    </LocaleGuard>
  </AppLayout>
);

const DashboardRoute = () => {
  const { user } = useAuth() || {};
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/account/profile" replace />;
  return <AdminDashboard />;
};

const AppRoutes = () => {
  const { user } = useAuth() || {};
  const userRole = user?.role;
  return (
    <ChatProvider>
      <Suspense fallback={<PageFallback /> }>
        <Routes>
          {/* Auth routes without the main AppLayout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/en/login" element={<LoginPage />} />
          <Route path="/en/register" element={<RegisterPage />} />
          <Route path="/en/forgot" element={<ForgotPasswordPage />} />
          <Route path="/en/reset-password" element={<ResetPasswordPage />} />
          <Route path="/en/verify-email" element={<VerifyEmailPage />} />
          <Route path="/fr/login" element={<LoginPage />} />
          <Route path="/fr/register" element={<RegisterPage />} />
          <Route path="/fr/forgot" element={<ForgotPasswordPage />} />
          <Route path="/fr/reset-password" element={<ResetPasswordPage />} />
          <Route path="/fr/verify-email" element={<VerifyEmailPage />} />

          {/* Main app routes with the layout */}
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/*" element={<MainAppShell user={user} userRole={userRole} />} />
        </Routes>
      </Suspense>
    </ChatProvider>
  );
};

export default AppRoutes;

// Motion route container extracted to keep JSX above tidy
function RouteContainer({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

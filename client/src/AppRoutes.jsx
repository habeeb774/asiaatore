import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ChatProvider } from './contexts/ChatContext.jsx';
import { RouteErrorBoundary, PageFallback } from './components/routing/RouteBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import AdminUsers from "./pages/admin/users/AdminUsers";
import Reports from "./pages/admin/reports/Reports";
import BankTransfers from "./pages/admin/orders/BankTransfers";
import Analytics from "./pages/admin/analytics/Analytics";
import Customers from "./pages/admin/users/Customers";
import Settings from "./pages/admin/Settings";
import AuditAdmin from "./pages/admin/reports/AuditAdmin";
import ReviewsAdmin from "./pages/admin/products/ReviewsAdmin";
import BrandsAdmin from "./pages/admin/products/BrandsAdmin";
import AccountSecurity from "./pages/account/AccountSecurity.jsx";
import DeveloperSettings from "./pages/admin/integrations/DeveloperSettings.jsx";
import AnalyticsDashboard from "./pages/admin/analytics/AnalyticsDashboard";
import { initAnalytics, trackPageView } from './lib/analytics';

// Lazy load heavy pages to split bundles per-route
const Home = React.lazy(() => import('./pages/misc/Home.jsx'));
const Cart = React.lazy(() => import('./pages/checkout/Cart.jsx'));
const CheckoutPage = React.lazy(() => import('./pages/checkout/CheckoutPage.jsx'));
const LoginPage = React.lazy(() => import('./pages/auth/index.js').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/auth/index.js').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/index.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/VerifyEmailPage.jsx'));
const Orders = React.lazy(() => import('./pages/orders/Orders.jsx'));
const MyOrders = React.lazy(() => import('./pages/orders/MyOrders.jsx'));
const OrderDetails = React.lazy(() => import('./pages/orders/OrderDetails.jsx'));
const AdminDashboard = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/dashboard/AdminDashboard.jsx'));
const ProductInventory = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/products/ProductInventory.jsx'));
const AdminOrders = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/orders/Orders.jsx'));
const AdminInvoices = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/orders/Invoices.jsx'));
const AdminMarketing = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/Marketing.jsx'));
const AdminCategories = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/products/CategoriesAdmin.jsx'));
const AdminApps = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/Apps.jsx'));
const AdminIntegrations = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/Integrations.jsx'));
const AdminAds = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/integrations/AdsAdmin.jsx'));
const SellerDashboard = React.lazy(() => import(/* webpackChunkName: "seller" */ './pages/seller/SellerDashboard.jsx'));
const DeliveryDashboard = React.lazy(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/DeliveryDashboard.jsx'));
import Canonical from './components/Canonical';
import { AnimatePresence, motion } from './lib/framerLazy.js';
// NOTE: useLanguage was imported but unused; removed to prevent lint warning.
const ProductDetailPage = React.lazy(() => import(/* webpackChunkName: "product" */ './pages/products/ProductDetailPage.jsx'));
const StoresPage = React.lazy(() => import(/* webpackChunkName: "stores" */ './pages/store/StoresPage.jsx'));
const OffersPage = React.lazy(() => import(/* webpackChunkName: "offers" */ './pages/misc/OffersPage.jsx'));
const InvoiceViewer = React.lazy(() => import(/* webpackChunkName: "invoice" */ './pages/orders/InvoiceViewer.jsx'));
const CatalogPage = React.lazy(() => import(/* webpackChunkName: "catalog" */ './pages/products/CatalogPage.jsx'));
const LegalPage = React.lazy(() => import(/* webpackChunkName: "legal" */ './pages/legal/Legal.jsx'));
const ProductsPage = React.lazy(() => import(/* webpackChunkName: "products" */ './pages/products/Products.jsx'));
const ChatPage = React.lazy(() => import(/* webpackChunkName: "chat" */ './pages/misc/Chat.jsx'));
const ProductReviews = React.lazy(() => import(/* webpackChunkName: "reviews" */ './pages/products/ProductReviews.jsx'));
const StyleGuide = React.lazy(() => import(/* webpackChunkName: "styleguide" */ './pages/dev/StyleGuide.jsx'));
const SubscriptionPlans = React.lazy(() => import(/* webpackChunkName: "subscriptions" */ './pages/features/SubscriptionPlans.jsx'));
const ProfilePage = React.lazy(() => import(/* webpackChunkName: "profile" */ './pages/account/Profile'));
const ProductManager = React.lazy(() => import(/* webpackChunkName: "seller" */ './pages/seller/ProductManager'));
const OrderTracker = React.lazy(() => import(/* webpackChunkName: "orders" */ './pages/orders/OrderTracker.jsx'));
const AddressesPage = React.lazy(() => import(/* webpackChunkName: "profile" */ './pages/account/Addresses.jsx'));
const SellerKyc = React.lazy(() => import(/* webpackChunkName: "seller" */ './pages/seller/SellerKyc.jsx'));
const AdminKycReview = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/users/AdminKycReview.jsx'));
const SellerAdminPage = React.lazy(() => import(/* webpackChunkName: "admin-core" */ './pages/admin/users/SellerAdminPage.jsx'));
const DeliveryMap = React.lazy(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/Map.jsx'));
const DeliveryHistory = React.lazy(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/History.jsx'));
const DeliveryAvailability = React.lazy(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/Availability.jsx'));
const DeliverySummary = React.lazy(() => import(/* webpackChunkName: "delivery" */ './pages/delivery/DeliverySummary.jsx'));
const UIPreview = React.lazy(() => import(/* webpackChunkName: "ui" */ './pages/dev/UIPreview.jsx'));
const SearchResults = React.lazy(() => import(/* webpackChunkName: "search" */ './pages/misc/SearchResults.jsx'));
// Home page now fully implemented (replaces placeholder)
const ToastTest = React.lazy(() => import('./pages/dev/ToastTest.jsx'));
const NFTLoyaltyPage = React.lazy(() => import(/* webpackChunkName: "nft" */ './pages/features/NFTLoyaltyPage.jsx'));
const GamificationPage = React.lazy(() => import(/* webpackChunkName: "gamification" */ './pages/features/GamificationPage.jsx'));
const ARViewerPage = React.lazy(() => import(/* webpackChunkName: "ar" */ './pages/features/ARViewerPage.jsx'));
const VoiceCommercePage = React.lazy(() => import(/* webpackChunkName: "voice" */ './pages/features/VoiceCommercePage.jsx'));
const SocialCommercePage = React.lazy(() => import(/* webpackChunkName: "social" */ './pages/features/SocialCommercePage.jsx'));
const SmartInventoryPage = React.lazy(() => import(/* webpackChunkName: "inventory" */ './pages/features/SmartInventoryPage.jsx'));
const PersonalizationPage = React.lazy(() => import(/* webpackChunkName: "personalization" */ './pages/features/PersonalizationPage.jsx'));
const SustainabilityPage = React.lazy(() => import(/* webpackChunkName: "sustainability" */ './pages/features/SustainabilityPage.jsx'));

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
  if (view === 'ads') return <Navigate to={`${prefix}/admin/ads`} replace />;
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
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/product/:productId/reviews" element={<ProductReviews />} />
          <Route path="/search" element={<SearchResults />} />
        <Route path="/stores" element={<StoresPage />} />
    <Route path="/offers" element={<OffersPage />} />
    <Route path="/style-guide" element={<StyleGuide />} />
    <Route path="/ui" element={<UIPreview />} />
  {/* demo/hero removed - demo page not present in this template */}
  <Route path="/test/toast" element={<ToastTest />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/subscriptions" element={<SubscriptionPlans />} />
  <Route path="/checkout" element={<CheckoutPage />} />
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
  {/* Dedicated Admin Categories page -> redirects to AdminDashboard cats view */}
  <Route path="/admin/categories" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminCategories />} redirectTo="/login" />} />
  <Route path="/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/login" />} />
  <Route path="/admin/audit" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AuditAdmin />} redirectTo="/login" />} />
  <Route path="/admin/reviews" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<ReviewsAdmin />} redirectTo="/login" />} />
  <Route path="/admin/brands" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BrandsAdmin />} redirectTo="/login" />} />
  <Route path="/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/login" />} />
  <Route path="/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/login" />} />
  <Route path="/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/login" />} />
  <Route path="/admin/sellers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<SellerAdminPage />} redirectTo="/login" />} />
  <Route path="/admin/analytics-dashboard" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AnalyticsDashboard />} redirectTo="/login" />} />
  <Route path="/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/login" />} />
  <Route path="/admin/developer-settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['developer']} element={<DeveloperSettings />} redirectTo="/login" />} />
  <Route path="/admin/orders" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminOrders />} redirectTo="/login" />} />
  <Route path="/admin/products" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/login" />} />
  <Route path="/admin/invoices" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminInvoices />} redirectTo="/login" />} />
  <Route path="/admin/marketing" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminMarketing />} redirectTo="/login" />} />
  <Route path="/admin/apps" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminApps />} redirectTo="/login" />} />
  <Route path="/admin/integrations" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminIntegrations />} redirectTo="/login" />} />
  <Route path="/admin/ads" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminAds />} redirectTo="/login" />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />

  {/* Advanced Features */}
  <Route path="/gamification" element={<ProtectedRoute isAuthed={!!user} element={<GamificationPage />} redirectTo="/login" />} />
  <Route path="/ar-viewer" element={<ARViewerPage />} />
  <Route path="/voice-commerce" element={<VoiceCommercePage />} />
  <Route path="/social-commerce" element={<ProtectedRoute isAuthed={!!user} element={<SocialCommercePage />} redirectTo="/login" />} />
  <Route path="/smart-inventory" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin','seller']} element={<SmartInventoryPage />} redirectTo="/login" />} />
  <Route path="/personalization" element={<ProtectedRoute isAuthed={!!user} element={<PersonalizationPage />} redirectTo="/login" />} />
  <Route path="/sustainability" element={<SustainabilityPage />} />
  <Route path="/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/login" />} />
  <Route path="/account/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/login" />} />

        {/* English prefixed */}
  <Route path="/en" element={<Home />} />
  <Route path="/en/admin/overview" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/en/login" />} />
  <Route path="/en/admin/inventory" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ProductInventory />} redirectTo="/en/login" />} />
  <Route path="/en/chat" element={<ProtectedRoute isAuthed={!!user} element={<ChatPage />} redirectTo="/en/login" />} />
  <Route path="/en/catalog" element={<CatalogPage />} />
  <Route path="/en/products" element={<ProductsPage />} />
  <Route path="/en/product/:id" element={<ProductDetailPage />} />
  <Route path="/en/search" element={<SearchResults />} />
        <Route path="/en/stores" element={<StoresPage />} />
    <Route path="/en/offers" element={<OffersPage />} />
    <Route path="/en/style-guide" element={<StyleGuide />} />
  <Route path="/fr/ui" element={<UIPreview />} />
  {/* fr/demo/hero removed - demo page not present in this template */}
  <Route path="/fr/test/toast" element={<ToastTest />} />
  <Route path="/en/test/toast" element={<ToastTest />} />
  <Route path="/en/cart" element={<Cart />} />
  <Route path="/en/subscriptions" element={<SubscriptionPlans />} />
  <Route path="/en/checkout" element={<CheckoutPage />} />
  <Route path="/en/orders" element={<Orders />} />
  <Route path="/en/legal/:slug" element={<LegalPage />} />
  <Route path="/en/my-orders" element={<MyOrders />} />
  <Route path="/en/order/:id" element={<OrderDetails />} />
  <Route path="/en/order/:id/track" element={<OrderTracker />} />
  <Route path="/en/account/addresses" element={<ProtectedRoute isAuthed={!!user} element={<AddressesPage />} redirectTo="/en/login" />} />
  <Route path="/en/invoice/:id" element={<InvoiceViewer />} />
  <Route path="/en/seller/kyc" element={<ProtectedRoute isAuthed={!!user} element={<SellerKyc />} redirectTo="/en/login" />} />
  <Route path="/en/admin/sellers/kyc" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminKycReview />} redirectTo="/en/login" />} />
  <Route
    path="/en/seller/products"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['seller','admin']}
        element={<ProductManager />}
        redirectTo="/en/login"
      />
    }
  />
  <Route
    path="/en/delivery"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryDashboard />}
        redirectTo="/en/login"
      />
    }
  />
  <Route
    path="/en/delivery/map"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryMap />}
        redirectTo="/en/login"
      />
    }
  />
  <Route
    path="/en/delivery/history"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryHistory />}
        redirectTo="/en/login"
      />
    }
  />
  <Route
    path="/en/delivery/availability"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryAvailability />}
        redirectTo="/en/login"
      />
    }
  />
  <Route
    path="/en/delivery/summary"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliverySummary />}
        redirectTo="/en/login"
      />
    }
  />
  <Route path="/en/DeliveryDashboard" element={<Navigate to="/en/delivery" replace />} />
  <Route
    path="/en/seller"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['seller','admin']}
        element={<SellerDashboard />}
        redirectTo="/en/login"
      />
    }
  />
  {/* Alias (EN): capitalized path redirect */}
  <Route path="/en/SellerDashboard" element={<Navigate to="/en/seller" replace />} />
  <Route path="/en/account/security" element={<ProtectedRoute isAuthed={!!user} element={<AccountSecurity />} redirectTo="/en/login" />} />
  <Route path="/en/account/profile" element={<ProtectedRoute isAuthed={!!user} element={<ProfilePage />} redirectTo="/en/login" />} />
  {/* Protected admin route (English) with legacy query redirect */}
  <Route path="/en/admin" element={<AdminRedirect prefix="/en" />} />
  {/* Legacy en redirect to users if query has view=users will be handled client-side (optional) */}
  <Route path="/en/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/en/login" />} />
  {/* EN: Admin Categories */}
  <Route path="/en/admin/categories" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminCategories />} redirectTo="/en/login" />} />
  <Route path="/en/admin/audit" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AuditAdmin />} redirectTo="/en/login" />} />
  <Route path="/en/admin/reviews" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<ReviewsAdmin />} redirectTo="/en/login" />} />
  <Route path="/en/admin/brands" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BrandsAdmin />} redirectTo="/en/login" />} />
  <Route path="/en/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/en/login" />} />
  <Route path="/en/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/en/login" />} />
  <Route path="/en/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/en/login" />} />
  <Route path="/en/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/en/login" />} />
  <Route path="/en/admin/analytics-dashboard" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AnalyticsDashboard />} redirectTo="/en/login" />} />
  <Route path="/en/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/en/login" />} />
  <Route path="/en/admin/orders" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminOrders />} redirectTo="/en/login" />} />
  <Route path="/en/admin/products" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/en/login" />} />
  <Route path="/en/admin/invoices" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminInvoices />} redirectTo="/en/login" />} />
  <Route path="/en/admin/marketing" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminMarketing />} redirectTo="/en/login" />} />
  <Route path="/en/admin/apps" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminApps />} redirectTo="/en/login" />} />
  <Route path="/en/admin/integrations" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminIntegrations />} redirectTo="/en/login" />} />
  <Route path="/en/admin/ads" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminAds />} redirectTo="/en/login" />} />
  <Route path="/en/login" element={<LoginPage />} />
  <Route path="/en/register" element={<RegisterPage />} />
  <Route path="/en/forgot" element={<ForgotPasswordPage />} />
  <Route path="/en/reset-password" element={<ResetPasswordPage />} />
  <Route path="/en/verify-email" element={<VerifyEmailPage />} />
  <Route path="/en/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/en/login" />} />
  <Route path="/en/account/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/en/login" />} />

  {/* Advanced Features */}
  <Route path="/en/gamification" element={<ProtectedRoute isAuthed={!!user} element={<GamificationPage />} redirectTo="/en/login" />} />
  <Route path="/en/ar-viewer" element={<ARViewerPage />} />
  <Route path="/en/voice-commerce" element={<VoiceCommercePage />} />
  <Route path="/en/social-commerce" element={<ProtectedRoute isAuthed={!!user} element={<SocialCommercePage />} redirectTo="/en/login" />} />
  <Route path="/en/smart-inventory" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin','seller']} element={<SmartInventoryPage />} redirectTo="/en/login" />} />
  <Route path="/en/personalization" element={<ProtectedRoute isAuthed={!!user} element={<PersonalizationPage />} redirectTo="/en/login" />} />
  <Route path="/en/sustainability" element={<SustainabilityPage />} />
  <Route path="/en/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/en/login" />} />
  <Route path="/en/account/nft-loyalty" element={<ProtectedRoute isAuthed={!!user} element={<NFTLoyaltyPage />} redirectTo="/en/login" />} />

        {/* French prefixed */}
  <Route path="/fr" element={<Home />} />
  <Route path="/fr/admin/inventory" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={["admin"]} element={<ProductInventory />} redirectTo="/fr/login" />} />
  <Route path="/fr/chat" element={<ProtectedRoute isAuthed={!!user} element={<ChatPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/catalog" element={<CatalogPage />} />
  <Route path="/fr/products" element={<ProductsPage />} />
  <Route path="/fr/product/:id" element={<ProductDetailPage />} />
  <Route path="/fr/search" element={<SearchResults />} />
  <Route path="/fr/stores" element={<StoresPage />} />
    <Route path="/fr/offers" element={<OffersPage />} />
    <Route path="/fr/style-guide" element={<StyleGuide />} />
  <Route path="/fr/ui" element={<UIPreview />} />
  <Route path="/fr/cart" element={<Cart />} />
  <Route path="/fr/subscriptions" element={<SubscriptionPlans />} />
  <Route path="/fr/checkout" element={<CheckoutPage />} />
  <Route path="/fr/orders" element={<Orders />} />
  <Route path="/fr/legal/:slug" element={<LegalPage />} />
  <Route path="/fr/my-orders" element={<MyOrders />} />
  <Route path="/fr/order/:id" element={<OrderDetails />} />
  <Route path="/fr/order/:id/track" element={<OrderTracker />} />
  <Route path="/fr/account/addresses" element={<ProtectedRoute isAuthed={!!user} element={<AddressesPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/invoice/:id" element={<InvoiceViewer />} />
  <Route path="/fr/seller/kyc" element={<ProtectedRoute isAuthed={!!user} element={<SellerKyc />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/sellers/kyc" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminKycReview />} redirectTo="/fr/login" />} />
  <Route
    path="/fr/seller/products"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['seller','admin']}
        element={<ProductManager />}
        redirectTo="/fr/login"
      />
    }
  />
  <Route
    path="/fr/delivery"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryDashboard />}
        redirectTo="/fr/login"
      />
    }
  />
  <Route
    path="/fr/delivery/map"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryMap />}
        redirectTo="/fr/login"
      />
    }
  />
  <Route
    path="/fr/delivery/history"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryHistory />}
        redirectTo="/fr/login"
      />
    }
  />
  <Route
    path="/fr/delivery/availability"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliveryAvailability />}
        redirectTo="/fr/login"
      />
    }
  />
  <Route
    path="/fr/delivery/summary"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['delivery','admin']}
        element={<DeliverySummary />}
        redirectTo="/fr/login"
      />
    }
  />
  <Route path="/fr/DeliveryDashboard" element={<Navigate to="/fr/delivery" replace />} />
  <Route
    path="/fr/seller"
    element={
      <ProtectedRoute
        isAuthed={!!user}
        userRole={userRole}
        requiredRoles={['seller','admin']}
        element={<SellerDashboard />}
        redirectTo="/fr/login"
      />
    }
  />
  {/* Alias (FR): capitalized path redirect */}
  <Route path="/fr/SellerDashboard" element={<Navigate to="/fr/seller" replace />} />
  <Route path="/fr/account/security" element={<ProtectedRoute isAuthed={!!user} element={<AccountSecurity />} redirectTo="/fr/login" />} />
  <Route path="/fr/account/profile" element={<ProtectedRoute isAuthed={!!user} element={<ProfilePage />} redirectTo="/fr/login" />} />
  {/* Protected admin route (French) with legacy query redirect */}
  <Route path="/fr/admin" element={<AdminRedirect prefix="/fr" />} />
  <Route path="/fr/admin/overview" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/fr/login" />} />
  {/* FR: Admin Categories */}
  <Route path="/fr/admin/categories" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminCategories />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/audit" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AuditAdmin />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/reviews" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<ReviewsAdmin />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/brands" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BrandsAdmin />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/analytics-dashboard" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AnalyticsDashboard />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/orders" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminOrders />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/products" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/invoices" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminInvoices />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/marketing" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminMarketing />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/apps" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminApps />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/integrations" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminIntegrations />} redirectTo="/fr/login" />} />
  <Route path="/fr/login" element={<LoginPage />} />
  <Route path="/fr/register" element={<RegisterPage />} />
  <Route path="/fr/forgot" element={<ForgotPasswordPage />} />
  <Route path="/fr/reset-password" element={<ResetPasswordPage />} />
  <Route path="/fr/verify-email" element={<VerifyEmailPage />} />

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
      <Routes>
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/*" element={<MainAppShell user={user} userRole={userRole} />} />
      </Routes>
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

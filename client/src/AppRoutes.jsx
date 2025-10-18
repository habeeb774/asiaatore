import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { ChatProvider } from './context/ChatContext.jsx';
import { RouteErrorBoundary, PageFallback } from './components/routing/RouteBoundary';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Cart from './pages/Cart';
import CheckoutPage from './pages/CheckoutPage'; // upgraded checkout with address-before-payment
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/auth/index.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import Orders from './pages/Orders';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import Reports from './pages/admin/Reports';
import SellerDashboard from './pages/seller/SellerDashboard.jsx'; 
import DeliveryDashboard from './pages/delivery/DeliveryDashboard.jsx';
import BankTransfers from './pages/admin/BankTransfers';
import Analytics from './pages/admin/Analytics';
import Customers from './pages/admin/Customers';
import Settings from './pages/admin/Settings';
import AccountSecurity from './pages/AccountSecurity';
import Canonical from './components/Canonical';
import { AnimatePresence, motion } from 'framer-motion';
// NOTE: useLanguage was imported but unused; removed to prevent lint warning.
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const StoresPage = React.lazy(() => import('./pages/StoresPage'));
const OffersPage = React.lazy(() => import('./pages/OffersPage'));
const InvoiceViewer = React.lazy(() => import('./pages/InvoiceViewer'));
const CatalogPage = React.lazy(() => import('./pages/CatalogPage'));
const ProductsPage = React.lazy(() => import('./pages/Products'));
const ChatPage = React.lazy(() => import('./pages/Chat.jsx'));
const StyleGuide = React.lazy(() => import('./pages/StyleGuide'));
const ProfilePage = React.lazy(() => import('./pages/account/Profile'));
const ProductManager = React.lazy(() => import('./pages/seller/ProductManager'));
const OrderTracker = React.lazy(() => import('./pages/orders/OrderTracker.jsx'));
const AddressesPage = React.lazy(() => import('./pages/account/Addresses.jsx'));
const SellerKyc = React.lazy(() => import('./pages/seller/SellerKyc.jsx'));
const AdminKycReview = React.lazy(() => import('./pages/admin/AdminKycReview.jsx'));
const DeliveryMap = React.lazy(() => import('./pages/delivery/Map.jsx'));
const DeliveryHistory = React.lazy(() => import('./pages/delivery/History.jsx'));
const DeliveryAvailability = React.lazy(() => import('./pages/delivery/Availability.jsx'));
const UIPreview = React.lazy(() => import('./pages/UIPreview.jsx'));
// Home page now fully implemented (replaces placeholder)

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'page_view',
        path: location.pathname,
        timestamp: Date.now()
      });
      // Dispatch a single SPA re-init event for home enhancements (throttled per route change)
      const ev = new CustomEvent('reinit:home', {
        detail: { path: location.pathname, ts: Date.now() }
      });
      // schedule after paint to ensure DOM for the new route is ready
      requestAnimationFrame(() => {
        try { document.dispatchEvent(ev); } catch {}
      });
    } catch {}
  }, [location]);
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
  if (view === 'users') return <Navigate to={`${prefix}/admin/users`} replace />;
  if (view === 'customers') return <Navigate to={`${prefix}/admin/customers`} replace />;
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

const AppRoutes = () => {
  const { user } = useAuth() || {};
  const isAdmin = user?.role === 'admin';
  const userRole = user?.role;
  return (
  <ChatProvider>
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
  <Route path="/chat" element={<ProtectedRoute isAuthed={!!user} element={<ChatPage />} redirectTo="/login" />} />
          {/* Admin entry (handles legacy query redirects) */}
          <Route path="/admin" element={<AdminRedirect prefix="" />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/stores" element={<StoresPage />} />
    <Route path="/offers" element={<OffersPage />} />
    <Route path="/style-guide" element={<StyleGuide />} />
    <Route path="/ui" element={<UIPreview />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/checkout" element={<CheckoutPage />} />
  <Route path="/orders" element={<Orders />} />
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
  <Route path="/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/login" />} />
  <Route path="/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/login" />} />
  <Route path="/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/login" />} />
  <Route path="/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/login" />} />
  <Route path="/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/login" />} />
  <Route path="/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/login" />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot" element={<ForgotPasswordPage />} />
  <Route path="/reset-password" element={<ResetPasswordPage />} />
  <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* English prefixed */}
  <Route path="/en" element={<Home />} />
  <Route path="/en/chat" element={<ProtectedRoute isAuthed={!!user} element={<ChatPage />} redirectTo="/en/login" />} />
  <Route path="/en/catalog" element={<CatalogPage />} />
  <Route path="/en/products" element={<ProductsPage />} />
  <Route path="/en/product/:id" element={<ProductDetailPage />} />
        <Route path="/en/stores" element={<StoresPage />} />
    <Route path="/en/offers" element={<OffersPage />} />
    <Route path="/en/style-guide" element={<StyleGuide />} />
  <Route path="/en/ui" element={<UIPreview />} />
  <Route path="/en/cart" element={<Cart />} />
  <Route path="/en/checkout" element={<CheckoutPage />} />
  <Route path="/en/orders" element={<Orders />} />
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
  <Route path="/en/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/en/login" />} />
  <Route path="/en/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/en/login" />} />
  <Route path="/en/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/en/login" />} />
  <Route path="/en/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/en/login" />} />
  <Route path="/en/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/en/login" />} />
  <Route path="/en/login" element={<LoginPage />} />
  <Route path="/en/register" element={<RegisterPage />} />
  <Route path="/en/forgot" element={<ForgotPasswordPage />} />
  <Route path="/en/reset-password" element={<ResetPasswordPage />} />
  <Route path="/en/verify-email" element={<VerifyEmailPage />} />
  {/* Duplicate /admin protected route removed (now defined above) */}
  {/* French prefixed */}
  <Route path="/fr" element={<Home />} />
  <Route path="/fr/chat" element={<ProtectedRoute isAuthed={!!user} element={<ChatPage />} redirectTo="/fr/login" />} />
  <Route path="/fr/catalog" element={<CatalogPage />} />
  <Route path="/fr/products" element={<ProductsPage />} />
  <Route path="/fr/product/:id" element={<ProductDetailPage />} />
  <Route path="/fr/stores" element={<StoresPage />} />
  <Route path="/fr/offers" element={<OffersPage />} />
  <Route path="/fr/style-guide" element={<StyleGuide />} />
  <Route path="/fr/ui" element={<UIPreview />} />
  <Route path="/fr/cart" element={<Cart />} />
  <Route path="/fr/checkout" element={<CheckoutPage />} />
  <Route path="/fr/orders" element={<Orders />} />
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
  <Route path="/fr/admin/users" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminUsers />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/reports" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Reports />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/bank-transfers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<BankTransfers />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/analytics" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Analytics />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/customers" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Customers />} redirectTo="/fr/login" />} />
  <Route path="/fr/admin/settings" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<Settings />} redirectTo="/fr/login" />} />
  <Route path="/fr/login" element={<LoginPage />} />
  <Route path="/fr/register" element={<RegisterPage />} />
  <Route path="/fr/forgot" element={<ForgotPasswordPage />} />
  <Route path="/fr/reset-password" element={<ResetPasswordPage />} />
  <Route path="/fr/verify-email" element={<VerifyEmailPage />} />
      </Routes>
      </RouteContainer>
      </AnimatePresence>
      </Suspense>
      </RouteErrorBoundary>
    </LocaleGuard>
  </AppLayout>
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

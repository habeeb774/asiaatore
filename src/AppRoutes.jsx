import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { RouteErrorBoundary, PageFallback } from './components/routing/RouteBoundary';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import CartPage from './pages/Cart'; // legacy simple cart (will be replaced)
import Cart from './pages/Cart';
import CheckoutPage from './pages/CheckoutPage'; // upgraded checkout with address-before-payment
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/auth/index.js';
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/auth/VerifyEmailPage.jsx';
import Orders from './pages/Orders';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import Reports from './pages/admin/Reports';
import BankTransfers from './pages/admin/BankTransfers';
import Analytics from './pages/admin/Analytics';
import Customers from './pages/admin/Customers';
import Settings from './pages/admin/Settings';
import AccountSecurity from './pages/AccountSecurity';
import Canonical from './components/Canonical';
// NOTE: useLanguage was imported but unused; removed to prevent lint warning.
const ProductDetailPage = React.lazy(() => import('./pages/ProductDetailPage'));
const StoresPage = React.lazy(() => import('./pages/StoresPage'));
const OffersPage = React.lazy(() => import('./pages/OffersPage'));
const InvoiceViewer = React.lazy(() => import('./pages/InvoiceViewer'));
const CatalogPage = React.lazy(() => import('./pages/CatalogPage'));
const ProductsPage = React.lazy(() => import('./pages/Products'));
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
    } catch {}
  }, [location]);
  return null;
};

const LocaleGuard = ({ children }) => {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  // Allow: (a) no locale segment (Arabic default) (b) supported locale segments 'ar' or 'en'
  // Redirect only if the first segment looks like a 2-letter locale code but is unsupported.
  if (parts[0] && parts[0].length === 2 && !['ar','en'].includes(parts[0])) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth() || {};
  const isAdmin = user?.role === 'admin';
  const userRole = user?.role;
  return (
  <AppLayout>
    <Canonical />
    <LocaleGuard>
      <RouteTracker />
      <RouteErrorBoundary>
      <Suspense fallback={<PageFallback /> }>
      <Routes>
        {/* Arabic default */}
  <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/stores" element={<StoresPage />} />
    <Route path="/offers" element={<OffersPage />} />
  <Route path="/cart" element={<Cart />} />
  <Route path="/checkout" element={<CheckoutPage />} />
  <Route path="/orders" element={<Orders />} />
  <Route path="/my-orders" element={<MyOrders />} />
  <Route path="/order/:id" element={<OrderDetails />} />
  <Route path="/invoice/:id" element={<InvoiceViewer />} />
  <Route path="/account/security" element={<ProtectedRoute isAuthed={!!user} element={<AccountSecurity />} redirectTo="/login" />} />
  {/* Protected admin route (Arabic default) */}
  <Route path="/admin" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/login" />} />
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
  <Route path="/en/catalog" element={<CatalogPage />} />
  <Route path="/en/products" element={<ProductsPage />} />
  <Route path="/en/product/:id" element={<ProductDetailPage />} />
        <Route path="/en/stores" element={<StoresPage />} />
    <Route path="/en/offers" element={<OffersPage />} />
  <Route path="/en/cart" element={<Cart />} />
  <Route path="/en/checkout" element={<CheckoutPage />} />
  <Route path="/en/orders" element={<Orders />} />
  <Route path="/en/my-orders" element={<MyOrders />} />
  <Route path="/en/order/:id" element={<OrderDetails />} />
  <Route path="/en/invoice/:id" element={<InvoiceViewer />} />
  <Route path="/en/account/security" element={<ProtectedRoute isAuthed={!!user} element={<AccountSecurity />} redirectTo="/en/login" />} />
  {/* Protected admin route (English) */}
  <Route path="/en/admin" element={<ProtectedRoute isAuthed={!!user} userRole={userRole} requiredRoles={['admin']} element={<AdminDashboard />} redirectTo="/en/login" />} />
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
      </Routes>
      </Suspense>
      </RouteErrorBoundary>
    </LocaleGuard>
  </AppLayout>
  );
};

export default AppRoutes;

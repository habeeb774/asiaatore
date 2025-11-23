import React from 'react';
import { useLocation } from 'react-router-dom';

// Lazy load views
const OverviewView = React.lazy(() => import('../views/OverviewView'));
const ProductsView = React.lazy(() => import('../views/ProductsView'));
const OrdersView = React.lazy(() => import('../views/OrdersView'));
const BrandsView = React.lazy(() => import('../views/BrandsView'));
const MarketingView = React.lazy(() => import('../views/MarketingView'));
const SettingsView = React.lazy(() => import('../views/SettingsView'));

const AdminViewRenderer = () => {
  const location = useLocation();
  const normalizedPath = React.useMemo(() => {
    const path = location.pathname || '';
    let next = path.replace(/^\/(en|fr)(?=\/)/, '');
    if (next.length > 1 && next.endsWith('/')) {
      next = next.replace(/\/+/g, '/').replace(/\/$/, '');
    }
    return next || '/admin/overview';
  }, [location.pathname]);

  const renderView = () => {
    switch (normalizedPath) {
      case '/admin':
      case '/admin/overview':
        return <OverviewView />;
      case '/admin/products':
        return <ProductsView />;
      case '/admin/orders':
        return <OrdersView />;
      case '/admin/brands':
        return <BrandsView />;
      case '/admin/marketing':
        return <MarketingView />;
      case '/admin/settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <React.Suspense fallback={<div className="loading-view">جاري التحميل...</div>}>
      <div className="admin-view-container">
        {renderView()}
      </div>
    </React.Suspense>
  );
};

export default AdminViewRenderer;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Legacy placeholder: this page has been migrated under AdminDashboard (/admin?view=products)
// Keeping a redirect here to avoid broken links if any old bookmarks exist.
export default function ProductsManagementLegacyRedirect() {
  const loc = useLocation();
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[Deprecation] /admin/ProductsManagement has moved into /admin?view=products', loc);
  }
  return <Navigate to="/admin?view=products" replace />;
}

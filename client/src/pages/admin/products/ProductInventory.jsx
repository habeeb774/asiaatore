import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Legacy placeholder: the inventory view now lives inside AdminDashboard (/admin/products)
// Keep a redirect here to preserve old bookmarks while guiding users toward the new layout.
export default function ProductInventoryLegacyRedirect() {
  const location = useLocation();
  const localePrefixMatch = location.pathname.match(/^\/(en|fr)(?=\/)/);
  const prefix = localePrefixMatch ? localePrefixMatch[0] : '';
  const targetPath = `${prefix}/admin/products`;
  if (import.meta.env.DEV) {
    console.warn('[Deprecation] legacy inventory route is now served from', targetPath, location);
  }
  return <Navigate to={targetPath} replace />;
}

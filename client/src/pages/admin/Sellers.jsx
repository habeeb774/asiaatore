/* Legacy Admin Dashboard (tabbed) - deprecated.
   This file now redirects to the new AdminDashboard route (/admin) which uses AdminSideNav + view query.
*/
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function LegacyAdminDashboardRedirect() {
  // Redirect to the admin seller KYC review page (canonical)
  return <Navigate to="/admin/sellers/kyc" replace />;
}
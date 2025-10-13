/* Legacy Admin Dashboard (tabbed) - deprecated.
   This file now redirects to the new AdminDashboard route (/admin) which uses AdminSideNav + view query.
*/
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function LegacyAdminDashboardRedirect() {
  return <Navigate to="/admin?view=sellers" replace />;
}
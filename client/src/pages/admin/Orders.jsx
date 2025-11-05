import React from 'react';
import OrdersManagement from './OrdersManagement.jsx';

// Compatibility wrapper: legacy import path used by AppRoutes.jsx and other code
// Restored after accidental deletion to avoid breaking lazy imports.
export default function Orders() {
  return <OrdersManagement />;
}

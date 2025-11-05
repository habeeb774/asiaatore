import React from 'react';
import ProductList from '../../components/inventory/ProductList';
import AdminLayout from '../../components/admin/AdminLayout';

export default function ProductInventory() {
  return (
    <AdminLayout title="إدارة المنتجات">
      <ProductList />
    </AdminLayout>
  );
}

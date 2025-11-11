import React from 'react';
import AdminLayout from '../../components/features/admin/AdminLayout';

export default function Invoices() {
  return (
    <AdminLayout title="إدارة الفواتير">
      <div>
        <p style={{ fontSize: 13, color: '#64748b' }}>
          هذه صفحة مؤقتة لإدارة الفواتير. يمكن لاحقًا استبدالها بواجهة كاملة.
        </p>
      </div>
    </AdminLayout>
  );
}

import React from 'react';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import Seo from '../../../components/Seo';
import ReviewsManager from '../../../components/features/ReviewsManager/ReviewsManager';

export default function ReviewsAdmin() {
  return (
    <AdminLayout title="مراجعات العملاء">
      <Seo title="مراجعات العملاء" />
      <div style={{padding:24}}>
        <ReviewsManager />
      </div>
    </AdminLayout>
  );
}

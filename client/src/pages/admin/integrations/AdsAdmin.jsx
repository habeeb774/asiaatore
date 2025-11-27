import React from 'react';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import MarketingAdsContent from '../../admin/components/MarketingAdsContent';

export default function AdsAdmin() {
  return (
    <AdminLayout title="التسويق والإعلانات">
      <MarketingAdsContent initialSection="ads" />
    </AdminLayout>
  );
}

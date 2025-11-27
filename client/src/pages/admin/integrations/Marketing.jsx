import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import MarketingAdsContent from '../../admin/components/MarketingAdsContent';

export default function Marketing() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get('section');
  const initialSection = section === 'ads' ? 'ads' : 'marketing';

  return (
    <AdminLayout title="التسويق والإعلانات">
      <MarketingAdsContent initialSection={initialSection} />
    </AdminLayout>
  );
}

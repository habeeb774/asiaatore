import React from 'react'
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';

const Privacy = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'سياسة الخصوصية' : 'Privacy Policy') + ' | ' + siteName;
  return (
    <div className="container-custom px-4 py-12">
      <Seo title={title} description={locale==='ar' ? `سياسة الخصوصية - ${siteName}` : `Privacy Policy - ${siteName}`} />
      <h2 className="text-2xl font-bold mb-4">سياسة الخصوصية</h2>
      <p>نص سياسة الخصوصية...</p>
    </div>
  );
}

export default Privacy

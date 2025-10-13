import React from 'react'
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';

const Terms = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'الشروط والأحكام' : 'Terms') + ' | ' + siteName;
  return (
    <div className="container-custom px-4 py-12">
      <Seo title={title} description={locale==='ar' ? `الشروط والأحكام - ${siteName}` : `Terms - ${siteName}`} />
      <h2 className="text-2xl font-bold mb-4">الشروط والأحكام</h2>
      <p>نص الشروط والأحكام...</p>
    </div>
  );
}

export default Terms

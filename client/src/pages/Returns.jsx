import React from 'react'
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';

const Returns = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'سياسة الإسترجاع' : 'Return & Exchange Policy') + ' | ' + siteName;
  return (
    <div className="container-custom px-4 py-12">
      <Seo title={title} description={locale==='ar' ? `سياسة الإسترجاع - ${siteName}` : `Return & Exchange Policy - ${siteName}`} />
      <h2 className="text-2xl font-bold mb-4">{locale === 'ar' ? 'سياسة الإسترجاع' : 'Return & Exchange Policy'}</h2>
      <p>{locale === 'ar' ? 'نص سياسة الاسترجاع والاعادة. يمكنك تخصيص هذه الصفحة من لوحة التحكم.' : 'Placeholder returns and exchange policy. Edit this page from the admin settings to provide your store policy.'}</p>
    </div>
  );
}

export default Returns

import React from 'react'
import { useSettings } from '../stores/SettingsContext';
import { useLanguage } from '../stores/LanguageContext';
import Seo from '../components/Seo';

const Shipping = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'سياسة الشحن' : 'Shipping Policy') + ' | ' + siteName;
  return (
    <div className="container-custom px-4 py-12">
      <Seo title={title} description={locale==='ar' ? `سياسة الشحن - ${siteName}` : `Shipping Policy - ${siteName}`} />
      <h2 className="text-2xl font-bold mb-4">{locale === 'ar' ? 'سياسة الشحن' : 'Shipping Policy'}</h2>
      <p>{locale === 'ar' ? 'نص سياسة الشحن - وصف طرق الشحن والتكاليف والمهل المتوقعة.' : 'Placeholder shipping policy - describe shipping methods, costs and expected delivery times here.'}</p>
    </div>
  );
}

export default Shipping

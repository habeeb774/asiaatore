import React from 'react'
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';

const FAQ = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'الأسئلة الشائعة' : 'FAQ') + ' | ' + siteName;
  return (
    <div className="container-custom px-4 py-12">
      <Seo title={title} description={locale==='ar' ? `الأسئلة الشائعة - ${siteName}` : `FAQ - ${siteName}`} />
      <h2 className="text-2xl font-bold mb-4">الأسئلة الشائعة</h2>
      <p>قسم الأسئلة المتكررة.</p>
    </div>
  );
}

export default FAQ

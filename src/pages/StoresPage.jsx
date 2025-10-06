import React from 'react';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';

const STORES = [
  { id: 1, name: 'متجر التقنية', city: 'الرياض' },
  { id: 2, name: 'متجر الأزياء', city: 'جدة' }
];

const StoresPage = () => {
  const { setting } = useSettings() || {};
  const { locale } = useLanguage();
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store');
  const title = (locale==='ar' ? 'المتاجر' : 'Stores') + ' | ' + siteName;
  return (
    <div className="stores-page">
      <Seo title={title} description={locale==='ar' ? `فروع ومتاجر ${siteName}` : `${siteName} store locations`} />
      <h1>المتاجر</h1>
      <ul>
        {STORES.map(s => (
          <li key={s.id}>
            <strong>{s.name}</strong> - {s.city}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StoresPage;

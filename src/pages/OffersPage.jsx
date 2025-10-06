import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import ProductGrid from '../components/products/ProductGrid';
import Seo from '../components/Seo';
import api from '../api/client';
import { useSettings } from '../context/SettingsContext';

const OffersPage = () => {
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale==='ar' ? `${t('offers')} | ${siteName}` : `${siteName} | ${t('offers')}`;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.listOffers()
      .then(data => { if (active) setProducts(Array.isArray(data)? data : []); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [locale]);

  return (
    <div className="offers-page">
      <Seo title={pageTitle} description={t('offers')} />
      <h1>{t('offers')}</h1>
      {loading && <p>{locale==='ar'?'جار التحميل...':'Loading...'}</p>}
      {!loading && <ProductGrid products={products} />}
    </div>
  );
};

export default OffersPage;

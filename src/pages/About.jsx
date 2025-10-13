import React, { useMemo } from 'react';
import { useMarketing } from '../context/MarketingContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/client';
import { useSettings } from '../context/SettingsContext';
import Seo from '../components/Seo';

const FeatureSkeleton = () => (
  <div className="p-5 rounded-xl bg-white border animate-pulse flex flex-col gap-3">
    <div className="h-8 w-8 bg-gray-200 rounded" />
    <div className="h-4 w-2/3 bg-gray-200 rounded" />
    <div className="h-3 w-4/5 bg-gray-200 rounded" />
    <div className="h-3 w-3/5 bg-gray-200 rounded" />
  </div>
);

const About = () => {
  const { features = [], loading } = useMarketing() || {};
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale==='ar' ? `من نحن | ${siteName}` : `${siteName} | About Us`;
  const list = useMemo(() => features.slice().sort((a,b)=>(a.sort||0)-(b.sort||0)), [features]);
  return (
    <div className="container-custom px-4 py-12">
      <Seo title={pageTitle} description={locale==='ar' ? `تعرف على ${siteName}` : `About ${siteName}`} />
      <h1 className="text-3xl font-bold mb-4">{locale==='ar' ? 'من نحن' : 'About Us'}</h1>
      <p className="text-gray-700 mb-10">
        {locale==='ar'
          ? `${siteName}: منصة متخصصة في استيراد وتجارة المنتجات الآسيوية عالية الجودة بأسعار تنافسية.`
          : `${siteName}: a platform focused on sourcing and distributing quality Asian products at competitive pricing.`}
      </p>
      <section aria-labelledby="about-features-heading" className="mb-16">
        <h2 id="about-features-heading" className="text-2xl font-semibold mb-6">{locale==='ar' ? 'لماذا نحن' : 'Why Choose Us'}</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 6 }).map((_,i)=> <FeatureSkeleton key={i} />)}
          {!loading && list.map(f => {
            const title = f.title?.[locale] || f.title?.ar || f.title?.en;
            const body = f.body?.[locale] || f.body?.ar || f.body?.en;
            return (
              <button
                key={f.id}
                type="button"
                onClick={()=>{ try { api.marketingTrackClick('feature', f.id); } catch{} }}
                className="text-start p-5 rounded-xl bg-white border hover:shadow transition flex flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-red/40"
                aria-label={title}
              >
                <span className="text-4xl" aria-hidden>{f.icon || '★'}</span>
                <h3 className="font-semibold text-lg leading-snug">{title}</h3>
                {body && <p className="text-xs text-gray-600 leading-relaxed">{body}</p>}
              </button>
            );
          })}
          {!loading && !list.length && (
            <p className="col-span-full text-sm opacity-60">{locale==='ar' ? 'لا توجد ميزات مفعلة حالياً.' : 'No active features yet.'}</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default About;
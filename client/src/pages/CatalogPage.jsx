import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { useLanguage } from '../context/LanguageContext';
import { resolveLocalized } from '../utils/locale';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import api from '../api/client';

const CatalogPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `${t('catalog')} | ${siteName}` : `${siteName} | ${t('catalog')}`;
  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);

  // No filters here anymore; Catalog shows categories only

  // Load categories with counts for quick-pick tiles
  useEffect(() => {
    let mounted = true;
    // Prefill from cache for instant UI
    try {
      const cached = localStorage.getItem('cats_cache');
      const ts = Number(localStorage.getItem('cats_cache_ts') || 0);
      const fresh = Date.now() - ts < 60 * 60 * 1000; // 1h TTL
      if (cached && fresh) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setCats(parsed);
      }
    } catch {}
    api.listCategories({ withCounts: 1 })
      .then(r => { if (mounted && r?.categories) setCats(r.categories); })
      .catch(() => {})
      .finally(() => { if (mounted) setCatsLoading(false); });
  }, []);

  const allCats = useMemo(() => {
    const uniq = new Map();
    for (const c of cats) { const k = c.slug || c.id; if (!uniq.has(k)) uniq.set(k, c); }
    return Array.from(uniq.values())
      .sort((a,b)=> (b.productCount||0) - (a.productCount||0));
  }, [cats]);
  // No products list/pagination on this page

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: (import.meta.env.VITE_PUBLIC_DOMAIN || 'https://jomlah.app') + '/' },
      { '@type': 'ListItem', position: 2, name: t('breadcrumbCatalog'), item: (import.meta.env.VITE_PUBLIC_DOMAIN || 'https://jomlah.app') + (locale==='ar'?'/catalog':`/${locale}/catalog`) }
    ]
  };

  // No product error block; page only shows categories

  return (
    <div className="offers-page catalog-page container-custom px-4 py-8">
      <Seo title={pageTitle} description={t('catalog')} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbLd)}} />
      <h1 className="page-title">{t('catalog')}</h1>

  {/* Categories grid */}
      {catsLoading ? (
        // Skeleton for category tiles while loading
        <section className="section-padding bg-white" aria-labelledby="cats-head">
          <div className="container-custom">
            <div className="home-section-head text-center">
              <Skeleton className="h-8 w-56 mx-auto mb-2" />
              <Skeleton className="h-4 w-80 mx-auto" />
            </div>
            <div className="featured-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="block rounded-2xl bg-white shadow overflow-hidden p-0">
                    <Skeleton className="w-full" style={{aspectRatio:'4/3'}} />
                    <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : allCats.length > 0 ? (
        <section className="section-padding bg-white" aria-labelledby="cats-head">
          <div className="container-custom">
            <div className="home-section-head text-center">
              <h2 id="cats-head" className="home-section-head__title">
                {locale==='ar'?'تصفح حسب التصنيف':'Browse by Category'}
              </h2>
              <p className="home-section-head__subtitle">
                {locale==='ar'?'اختيارات سريعة لأفضل الأقسام':'Quick picks for top categories'}
              </p>
            </div>
            <div className="featured-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
              {allCats.map((c)=> (
                <div key={c.id||c.slug}>
                  <button
                    type="button"
                    onClick={() => navigate(`/products?category=${encodeURIComponent(c.slug)}&page=1`)}
                    className="block rounded-2xl bg-white shadow hover:shadow-2xl transition overflow-hidden text-left w-full"
                  >
                    <div style={{aspectRatio:'4/3', background:'#f3f4f6', display:'grid', placeItems:'center'}}>
                      {c.image
                        ? <img src={c.image} alt={resolveLocalized(c.name, locale) || c.name?.ar || c.slug} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        : <span style={{fontSize:'2rem',fontWeight:800,color:'var(--color-primary)'}}>{(resolveLocalized(c.name, locale) || c.name?.ar || c.slug).toString().slice(0,2)}</span>
                      }
                    </div>
                    <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontWeight:700}}>{resolveLocalized(c.name, locale) || c.name?.ar || c.name?.en || c.slug}</span>
                      {typeof c.productCount==='number' && <span style={{fontSize:12,opacity:.7}}>{c.productCount}</span>}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center py-12">
              <h3 className="text-xl font-bold mb-2">{locale==='ar'?'لا توجد أقسام متاحة الآن':'No categories available yet'}</h3>
              <p className="text-gray-600">{locale==='ar'?'الرجاء المحاولة لاحقًا أو إضافة أقسام من لوحة التحكم.':'Please try again later or add categories from Admin.'}</p>
            </div>
          </div>
        </section>
      )}
      {/* No product list here */}
    </div>
  );
};

export default CatalogPage;

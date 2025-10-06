import React, { useState, useMemo, useEffect } from 'react';
import ProductFilters from '../components/products/ProductFilters';
import ProductGrid from '../components/products/ProductGrid';
import { useProducts } from '../context/ProductsContext';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import api from '../api/client';

const CatalogPage = () => {
  const { products, loading, error } = useProducts();
  const { t, locale } = useLanguage();
  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `${t('catalog')} | ${siteName}` : `${siteName} | ${t('catalog')}`;
  const pageSize = 12;
  const [filters, setFilters] = useState({ category: '', sort: 'new', min: '', max: '', rating: '', discount: false, page: 1 });
  const [cats, setCats] = useState([]);

  // sync from query string on first mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patch = {};
    ['category','sort','min','max','rating','discount','page'].forEach(k => {
      if (params.has(k)) patch[k] = params.get(k);
    });
    if (patch.discount) patch.discount = patch.discount === 'true';
    if (patch.page) patch.page = +patch.page || 1;
    if (Object.keys(patch).length) setFilters(prev => ({ ...prev, ...patch }));
  }, []);

  // Load categories with counts for quick-pick tiles
  useEffect(() => {
    let mounted = true;
    api.listCategories({ withCounts: 1 })
      .then(r => { if (mounted && r?.categories) setCats(r.categories); })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const topCats = useMemo(() => {
    const uniq = new Map();
    for (const c of cats) { const k = c.slug || c.id; if (!uniq.has(k)) uniq.set(k, c); }
    return Array.from(uniq.values())
      .sort((a,b)=> (b.productCount||0) - (a.productCount||0))
      .slice(0, 8);
  }, [cats]);
  const baseCatalogPath = locale === 'en' ? '/en/catalog' : '/catalog';

  // push to query string when filters change (debounced minimal)
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => {
      if (v !== '' && v !== false && v != null) params.set(k, v);
    });
    const qs = params.toString();
    const newUrl = window.location.pathname + (qs ? `?${qs}` : '');
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const filtered = useMemo(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[CatalogPage] products len:', products.length, 'filters:', filters);
    }
    let list = [...products];
    if (filters.category) list = list.filter(p => p.category === filters.category);
    if (filters.min) list = list.filter(p => +p.price >= +filters.min);
    if (filters.max) list = list.filter(p => +p.price <= +filters.max);
    if (filters.rating) list = list.filter(p => (p.rating || 0) >= +filters.rating);
    if (filters.discount) list = list.filter(p => p.oldPrice && p.oldPrice > p.price);
    if (filters.sort === 'price-asc') list.sort((a,b) => +a.price - +b.price);
    if (filters.sort === 'price-desc') list.sort((a,b) => +b.price - +a.price);
    return list;
  }, [filters, products]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    if (filters.page !== currentPage) setFilters(f => ({ ...f, page: currentPage }));
  }, [currentPage, filters.page]);

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: (import.meta.env.VITE_PUBLIC_DOMAIN || 'https://jomlah.app') + '/' },
      { '@type': 'ListItem', position: 2, name: t('breadcrumbCatalog'), item: (import.meta.env.VITE_PUBLIC_DOMAIN || 'https://jomlah.app') + (locale==='ar'?'/catalog':`/${locale}/catalog`) }
    ]
  };

  if (error) {
    return <div style={{padding:'40px'}}><h2>حدث خطأ في تحميل المنتجات</h2><p style={{direction:'ltr'}}>{error}</p></div>;
  }

  return (
    <div className="catalog-page">
      <Seo title={pageTitle} description={t('catalog')} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(breadcrumbLd)}} />
      <h1 className="page-title">{t('catalog')}</h1>

      {/* Quick picks for top categories (same style used on Home) */}
      {topCats.length > 0 && (
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
              {topCats.map((c)=> (
                <div key={c.id||c.slug}>
                  <a href={`${baseCatalogPath}?category=${encodeURIComponent(c.slug)}`} className="block rounded-2xl bg-white shadow hover:shadow-2xl transition overflow-hidden">
                    <div style={{aspectRatio:'4/3', background:'#f3f4f6', display:'grid', placeItems:'center'}}>
                      {c.image
                        ? <img src={c.image} alt={c.name?.[locale] || c.name?.ar || c.slug} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        : <span style={{fontSize:'2rem',fontWeight:800,color:'var(--color-primary)'}}>{(c.name?.[locale] || c.name?.ar || c.slug).toString().slice(0,2)}</span>
                      }
                    </div>
                    <div style={{padding:'10px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontWeight:700}}>{locale==='ar'?(c.name?.ar||c.slug):(c.name?.en||c.slug)}</span>
                      {typeof c.productCount==='number' && <span style={{fontSize:12,opacity:.7}}>{c.productCount}</span>}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <ProductFilters state={filters} onChange={setFilters} />
      {loading && <p style={{opacity:.7}}>{locale==='ar'?'جاري تحميل البيانات...':'Loading products...'}</p>}
      {!loading && pageSlice.length === 0 && <p>{locale==='ar'?'لا توجد نتائج':'No results'}</p>}
      {!loading && pageSlice.length > 0 && <ProductGrid products={pageSlice} wide />}
      {totalPages > 1 && (
        <div className="pagination" style={{display:'flex', gap:8, justifyContent:'center', marginTop:24}}>
          <button disabled={currentPage===1} onClick={() => setFilters(f => ({...f, page: f.page-1}))}>{locale==='ar'?'السابق':'Prev'}</button>
          <span style={{fontSize:13}}>{locale==='ar'?`صفحة ${currentPage} من ${totalPages}`:`Page ${currentPage} of ${totalPages}`}</span>
          <button disabled={currentPage===totalPages} onClick={() => setFilters(f => ({...f, page: f.page+1}))}>{locale==='ar'?'التالي':'Next'}</button>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;

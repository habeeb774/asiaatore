import React, { useEffect, useState, useMemo } from 'react';
import LazyImage from '../components/common/LazyImage';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Link, useSearchParams } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import Seo from '../components/Seo';
import Breadcrumbs from '../components/common/Breadcrumbs';

const PLACEHOLDER = '/vite.svg';

const BrandSkeleton = () => (
  <div className="animate-pulse bg-white/70 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3 shadow-sm">
    <div className="bg-gray-200 h-16 w-32 rounded" />
    <div className="bg-gray-200 h-3 w-24 rounded" />
    <div className="bg-gray-200 h-3 w-12 rounded" />
  </div>
);

const Brands = () => {
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('products_desc');
  const [searchParams] = useSearchParams();
  const preselect = searchParams.get('brand') || '';

  useEffect(()=> {
    let active = true;
    (async()=>{
      setLoading(true); setError(null);
      try {
        const list = await api.brandsList();
        if (!active) return;
        setBrands(Array.isArray(list)? list: []);
      } catch (e) { if(active) setError(e.message); } finally { if(active) setLoading(false); }
    })();
    return ()=> { active=false; };
  }, []);

  const filtered = useMemo(()=> {
    let list = [...brands];
    const needle = query.trim().toLowerCase();
    if (needle) list = list.filter(b => (b.name?.ar||'').toLowerCase().includes(needle) || (b.name?.en||'').toLowerCase().includes(needle) || (b.slug||'').toLowerCase().includes(needle));
    list.sort((a,b)=> {
      switch (sort) {
        case 'name_ar': return (a.name?.ar||'').localeCompare(b.name?.ar||'');
        case 'name_en': return (a.name?.en||'').localeCompare(b.name?.en||'');
        case 'products_asc': return (a.productCount||0) - (b.productCount||0);
        case 'products_desc': default: return (b.productCount||0) - (a.productCount||0);
      }
    });
    return list;
  }, [brands, query, sort]);

  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const title = locale==='ar' ? 'العلامات التجارية' : 'Brands';
  const pageTitle = `${title} | ${siteName}`;
  const productsWord = (count)=> locale==='ar' ? `${count} منتج` : `${count} products`;

  return (
    <div className="container-custom px-4 py-10">
      <Seo title={pageTitle} description={title} />
      <Breadcrumbs items={[{ label: locale==='ar'?'الرئيسية':'Home', to: '/' }, { label: title }]} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <div className="ms-auto flex items-center gap-3 flex-wrap">
            <input
              className="border px-3 py-2 rounded-lg text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary-red/40"
              placeholder={locale==='ar' ? 'ابحث عن علامة' : 'Search brand'}
              value={query}
              onChange={e=>setQuery(e.target.value)}
            />
            <select value={sort} onChange={e=>setSort(e.target.value)} className="border px-3 py-2 rounded-lg text-sm">
              <option value="products_desc">{locale==='ar'?'الأكثر منتجات':'Most Products'}</option>
              <option value="products_asc">{locale==='ar'?'الأقل منتجات':'Fewest Products'}</option>
              <option value="name_ar">{locale==='ar'?'الاسم (عربي)':'Name (AR)'}</option>
              <option value="name_en">{locale==='ar'?'الاسم (إنجليزي)':'Name (EN)'}</option>
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading && Array.from({ length: 10 }).map((_,i)=> <BrandSkeleton key={i} />)}
          {!loading && filtered.map(b => {
            const name = locale==='ar' ? (b.name?.ar || b.slug) : (b.name?.en || b.slug);
            const active = preselect && preselect === b.slug;
            return (
              <div key={b.id} className={`group relative bg-white border rounded-xl p-4 flex flex-col items-center gap-3 shadow hover:shadow-md transition ${active?'ring-2 ring-primary-red':''}`}>
                <div className="h-16 flex items-center justify-center">
                  {b.logo ? (
                    <LazyImage src={b.logoVariants?.thumb || b.logo} alt={name} className="max-h-16 max-w-[140px] object-contain" sizes="140px" />
                  ) : (
                    <img src={PLACEHOLDER} alt="placeholder" className="opacity-40" />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-center line-clamp-2 leading-tight min-h-[2.4em]">{name}</h3>
                <div className="text-[11px] bg-gray-100 text-gray-700 px-2 py-[3px] rounded-full tracking-wide">
                  {productsWord(b.productCount||0)}
                </div>
                <Link
                  to={`/products?brand=${encodeURIComponent(b.slug)}`}
                  className="w-full mt-auto text-xs font-medium bg-primary-red text-white text-center py-2 rounded-md hover:bg-red-700 transition"
                >{locale==='ar'?'عرض المنتجات':'View products'}</Link>
              </div>
            );
          })}
        </div>

        {!loading && !filtered.length && !error && (
          <p className="text-sm opacity-70">{locale==='ar'?'لا توجد نتائج':'No results'}</p>
        )}
      </div>
    </div>
  );
};

export default Brands;

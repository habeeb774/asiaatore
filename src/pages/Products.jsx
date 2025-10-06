import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProductFilters from '../components/products/ProductFilters';
import ProductGrid from '../components/products/ProductGrid';
import { useProducts, useProductPrefetch } from '../api/products';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/i18n';

const Products = () => {
  const location = useLocation();
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'متجري') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `المنتجات | ${siteName}` : `${siteName} | Products`;

  // Server fetch params (unpaginated); pagination is handled on client
  const serverParams = useMemo(() => ({
    q: new URLSearchParams(location.search).get('q') || undefined,
    category: new URLSearchParams(location.search).get('category') || undefined,
  }), [location.search]);

  const { data, isLoading, isFetching, error } = useProducts(serverParams);
  const prefetchProduct = useProductPrefetch();

  // Match CatalogPage filter model for consistent UI/UX
  const pageSize = 12;
  const [filters, setFilters] = useState({ category: '', sort: 'new', min: '', max: '', rating: '', discount: false, page: 1 });

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
    // Support both shapes: array or { items: [] }
    const baseItems = Array.isArray(data)
      ? data
      : (Array.isArray(data?.items) ? data.items : []);
    let list = baseItems.slice();
    if (filters.category) list = list.filter(p => p.category === filters.category);
    if (filters.min) list = list.filter(p => +p.price >= +filters.min);
    if (filters.max) list = list.filter(p => +p.price <= +filters.max);
    if (filters.rating) list = list.filter(p => (p.rating || 0) >= +filters.rating);
    if (filters.discount) list = list.filter(p => p.oldPrice && p.oldPrice > p.price);
    if (filters.sort === 'price-asc') list.sort((a,b) => +a.price - +b.price);
    if (filters.sort === 'price-desc') list.sort((a,b) => +b.price - +a.price);
    return list;
  }, [filters, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const pageSlice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  useEffect(() => {
    if (filters.page !== currentPage) setFilters(f => ({ ...f, page: currentPage }));
  }, [currentPage, filters.page]);

  const makePageList = () => {
    const pages = [];
    const max = totalPages;
    const cur = currentPage;
    const windowSize = 2;
    const push = (v) => pages.push(v);
    if (max <= 7) {
      for (let i = 1; i <= max; i++) push(i);
    } else {
      push(1);
      if (cur - windowSize > 2) push('…');
      const start = Math.max(2, cur - windowSize);
      const end = Math.min(max - 1, cur + windowSize);
      for (let i = start; i <= end; i++) push(i);
      if (cur + windowSize < max - 1) push('…');
      push(max);
    }
    return pages;
  };

  if (isLoading) return <div>Loading products…</div>;
  if (error) return <div>Failed to load products.</div>;

  return (
    <div className="offers-page catalog-page container-fixed py-8">
      <Seo title={pageTitle} description={locale==='ar'?'المنتجات':'Products'} />
      {/* مسار تنقل بسيط */}
      <nav className="text-sm text-gray-500 mb-2" aria-label="breadcrumb">
        <ol className="flex gap-2">
          <li><Link to="/" className="hover:text-primary-red">{locale==='ar'?'الرئيسية':'Home'}</Link></li>
          <li aria-hidden>›</li>
          <li className="text-gray-700">{locale==='ar'?'المنتجات':'Products'}</li>
        </ol>
      </nav>
      <h1 className="page-title">{locale==='ar'?'المنتجات':'Products'}</h1>
      {/* شريط ملخص النتائج */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
        <div>{locale==='ar' ? `عرض ${Math.min(pageSlice.length, filtered.length)} من ${filtered.length}` : `Showing ${Math.min(pageSlice.length, filtered.length)} of ${filtered.length}`}</div>
        {/* Placeholder for view toggles or quick sort in future */}
      </div>
      <ProductFilters state={filters} onChange={setFilters} />
      {isLoading && (
        <div className="products-grid">
          {Array.from({ length: pageSize }).map((_, idx) => (
            <div key={idx} className="product-card p-4 animate-pulse">
              <div className="h-40 bg-slate-200 rounded-lg mb-3" />
              <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-9 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!isLoading && pageSlice.length === 0 && !error && <p>{locale==='ar'?'لا توجد نتائج':'No results'}</p>}
      {!isLoading && pageSlice.length > 0 && (
        <ProductGrid products={pageSlice} />
      )}
      {totalPages > 1 && (
        <div className="pagination flex gap-2 justify-center items-center mt-6">
          <button
            className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
            disabled={currentPage===1}
            onClick={() => setFilters(f => ({...f, page: f.page-1}))}
          >{locale==='ar'?'السابق':'Prev'}</button>
          {makePageList().map((p, i) => p === '…' ? (
            <span key={`e${i}`} className="px-2 text-gray-400">…</span>
          ) : (
            <button
              key={p}
              className={`px-3 py-1 rounded ${p===currentPage? 'btn-primary' : 'btn-outline text-sm'}`}
              onClick={() => setFilters(f => ({...f, page: p}))}
            >{p}</button>
          ))}
          <button
            className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
            disabled={currentPage===totalPages}
            onClick={() => setFilters(f => ({...f, page: f.page+1}))}
          >{locale==='ar'?'التالي':'Next'}</button>
        </div>
      )}
    </div>
  );
};

export default Products;
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ProductFilters from '../components/products/ProductFilters';
import ProductGrid from '../components/products/ProductGrid';
import ProductGridSkeleton from '../components/products/ProductGridSkeleton.jsx';
import { useProducts, useProductPrefetch } from '../api/products';
import { useLanguage } from '../context/LanguageContext';
import Seo from '../components/Seo';
import { useSettings } from '../context/SettingsContext';
import { t } from '../utils/i18n';
import Breadcrumbs from '../components/common/Breadcrumbs';

const Products = () => {
  const location = useLocation();
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};
  const siteName = locale === 'ar' ? (setting?.siteNameAr || 'شركة منفذ اسيا التجارية') : (setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `المنتجات | ${siteName}` : `${siteName} | Products`;

  // Server fetch params (unpaginated); pagination is handled on client
  const serverParams = useMemo(() => ({
    q: new URLSearchParams(location.search).get('q') || undefined,
    category: new URLSearchParams(location.search).get('category') || undefined,
  }), [location.search]);

  const { data, isLoading, isFetching, error, refetch } = useProducts(serverParams);
  const prefetchProduct = useProductPrefetch();

  // Match CatalogPage filter model for consistent UI/UX
  const pageSize = 12;
  const [filters, setFilters] = useState({ category: '', sort: 'new', min: '', max: '', rating: '', discount: false, page: 1 });

  // sync from query string whenever it changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patch = {};
    ['category','sort','min','max','rating','discount','page'].forEach(k => {
      if (params.has(k)) patch[k] = params.get(k);
    });
    if (patch.discount != null) patch.discount = String(patch.discount) === 'true';
    if (patch.page != null) patch.page = +patch.page || 1;
    // Avoid unnecessary state updates
    const next = { ...filters, ...patch };
    const same = JSON.stringify(next) === JSON.stringify(filters);
    if (!same) setFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // push to query string when filters change (debounced minimal)
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => {
      if (v !== '' && v !== false && v != null) params.set(k, v);
    });
    const qs = params.toString();
    const newUrl = window.location.pathname + (qs ? `?${qs}` : '');
    // Only update if different to avoid triggering location change loops
    if (window.location.search !== (qs ? `?${qs}` : '')) {
      window.history.replaceState({}, '', newUrl);
    }
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
    if (filters.discount) list = list.filter(p => {
      const opRaw = (p.oldPrice ?? p.originalPrice);
      const op = opRaw != null ? +opRaw : NaN;
      const price = p.price != null ? +p.price : NaN;
      return Number.isFinite(op) && Number.isFinite(price) && op > price;
    });
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

  // Defer rendering until layout to show skeletons below
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Pull-to-refresh (mobile): only when scrolled to top
  const ptrRef = useRef(null);
  const pullState = useRef({ startY: 0, pulling: false, offset: 0 });
  useEffect(() => {
    const el = ptrRef.current;
    if (!el) return;
    const threshold = 60;
    const onTouchStart = (e) => {
      if (window.scrollY > 0) return; // only at top
      pullState.current.startY = e.touches[0].clientY;
      pullState.current.pulling = true;
      pullState.current.offset = 0;
    };
    const onTouchMove = (e) => {
      if (!pullState.current.pulling) return;
      const dy = e.touches[0].clientY - pullState.current.startY;
      if (dy > 0 && window.scrollY <= 0) {
        pullState.current.offset = Math.min(100, dy * 0.6);
        el.style.transform = `translateY(${pullState.current.offset}px)`;
      }
    };
    const onTouchEnd = async () => {
      if (!pullState.current.pulling) return;
      const shouldRefresh = pullState.current.offset > threshold;
      el.style.transition = 'transform 180ms ease';
      el.style.transform = 'translateY(0)';
      setTimeout(() => { el.style.transition = ''; }, 220);
      pullState.current.pulling = false;
      pullState.current.offset = 0;
      if (shouldRefresh) {
        try { await refetch(); } catch {}
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [refetch]);

  return (
    <div ref={ptrRef} className="offers-page catalog-page container-custom px-4 py-8" style={{ willChange: 'transform', touchAction: 'pan-x pan-y' }}>
      <Seo title={pageTitle} description={locale==='ar'?'المنتجات':'Products'} />
      <Breadcrumbs items={[{ label: locale==='ar'?'الرئيسية':'Home', to: '/' }, { label: locale==='ar'?'المنتجات':'Products' }]} />
      <h1 className="page-title mb-4">{locale==='ar'?'المنتجات':'Products'}</h1>
      {/* Mobile Filters Toggle */}
      <div className="md:hidden mb-3 flex justify-between items-center">
       
        <div className="text-xs text-gray-600">
          {locale==='ar' ? `عرض ${Math.min(pageSlice.length, filtered.length)} من ${filtered.length}` : `Showing ${Math.min(pageSlice.length, filtered.length)} of ${filtered.length}`}
        </div>
      </div>

      {/* Overlay drawer for filters on mobile */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 start-0 w-[86vw] max-w-[360px] bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{locale==='ar'?'الفلاتر':'Filters'}</h3>
              <button className="text-sm" onClick={() => setMobileFiltersOpen(false)}>{locale==='ar'?'إغلاق':'Close'}</button>
            </div>
            <ProductFilters state={filters} onChange={setFilters} sidebar />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Main content */}
        <section>
          {/* Desktop compact filters toolbar (sticky under header) */}
          <div className="hidden md:block mb-3 md:sticky md:top-24 z-10">
            <ProductFilters state={filters} onChange={setFilters} />
          </div>
          {/* شريط ملخص النتائج */}
          <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
            <div>{locale==='ar' ? `عرض ${Math.min(pageSlice.length, filtered.length)} من ${filtered.length}` : `Showing ${Math.min(pageSlice.length, filtered.length)} of ${filtered.length}`}</div>
            {/* Pull-to-refresh indicator */}
            <div className="text-xs text-gray-400" aria-hidden="true">
              {isFetching ? (locale==='ar'?'تحديث...':'Refreshing...') : (locale==='ar'?'اسحب للأسفل للتحديث':'Pull down to refresh')}
            </div>
          </div>
          {isLoading && <ProductGridSkeleton count={pageSize} />}
          {error && <p className="text-red-600 text-sm">{locale==='ar'?'فشل التحميل':'Failed to load products.'}</p>}
          {!isLoading && !error && pageSlice.length === 0 && <p>{locale==='ar'?'لا توجد نتائج':'No results'}</p>}
          {!isLoading && !error && pageSlice.length > 0 && <ProductGrid products={pageSlice} />}
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
        </section>
      </div>
    </div>
  );
};

export default Products;
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
  Filter as FilterIcon,
  Sparkles,
  Layers,
  Tag,
  Zap,
  X
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import api from '../../services/api/client';
import { useLanguage } from '../../context/LanguageContext';
import ProductCard, { ProductCardSkeleton } from '../../components/shared/ProductCard';
import useCategories from '../../hooks/useCategories';

const PAGE_SIZE = 24;
const SUGGESTION_DEBOUNCE = 220;

const PRICE_OPTIONS = [
  { value: '', label: { ar: 'كل الأسعار', en: 'All prices', fr: 'Tous les prix' } },
  { value: '0-50', label: { ar: '0 - 50 ر.س', en: 'SAR 0 - 50', fr: '0 - 50 SAR' } },
  { value: '50-150', label: { ar: '50 - 150 ر.س', en: 'SAR 50 - 150', fr: '50 - 150 SAR' } },
  { value: '150-300', label: { ar: '150 - 300 ر.س', en: 'SAR 150 - 300', fr: '150 - 300 SAR' } },
  { value: '300+', label: { ar: 'أكثر من 300 ر.س', en: '300 SAR & up', fr: '300 SAR et +' } }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: { ar: 'الأكثر صلة', en: 'Most relevant', fr: 'Pertinence' } },
  { value: 'price-asc', label: { ar: 'الأقل سعراً', en: 'Price: Low → High', fr: 'Prix: bas → haut' } },
  { value: 'price-desc', label: { ar: 'الأعلى سعراً', en: 'Price: High → Low', fr: 'Prix: haut → bas' } },
  { value: 'newest', label: { ar: 'الأحدث', en: 'Newest first', fr: 'Plus récents' } }
];

const SearchResults = () => {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const rtl = locale === 'ar';

  const params = useMemo(() => new URLSearchParams(search), [search]);
  const query = params.get('q') || '';
  const urlCategory = params.get('category') || '';
  const urlPrice = params.get('price') || '';
  const urlSort = params.get('sort') || 'relevance';

  const [queryInput, setQueryInput] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [priceRange, setPriceRange] = useState(urlPrice);
  const [sort, setSort] = useState(urlSort);
  const [openFilter, setOpenFilter] = useState(null);

  const [results, setResults] = useState([]);
  const resultsRef = useRef([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const cacheRef = useRef(new Map());
  const debounceRef = useRef();
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const searchFieldRef = useRef(null);
  const suggestionsRef = useRef(null);
  const filtersRef = useRef(null);

  const { data: categoryData = [], isLoading: categoriesLoading } = useCategories({ withCounts: 1 });

  useEffect(() => { resultsRef.current = results; }, [results]);
  useEffect(() => { setQueryInput(query); }, [query]);
  useEffect(() => { setSelectedCategory(urlCategory); }, [urlCategory]);
  useEffect(() => { setPriceRange(urlPrice); }, [urlPrice]);
  useEffect(() => { setSort(urlSort); }, [urlSort]);

  const getLocalizedValue = useCallback((source) => {
    if (!source) return '';
    if (typeof source === 'string') return source;
    if (typeof source === 'object') {
      if (typeof source[locale] === 'string') return source[locale];
      const localeKeys = locale === 'ar'
        ? ['ar', 'nameAr', 'titleAr', 'labelAr']
        : locale === 'fr'
          ? ['fr', 'nameFr', 'titleFr', 'labelFr']
          : ['en', 'nameEn', 'titleEn', 'labelEn'];
      for (const key of localeKeys) {
        const value = source[key];
        if (typeof value === 'string' && value.trim()) return value;
      }
      const fallbackKeys = ['name', 'title', 'label', 'displayName', 'text'];
      for (const key of fallbackKeys) {
        const maybe = source[key];
        if (typeof maybe === 'string' && maybe.trim()) return maybe;
        if (typeof maybe === 'object') {
          const nested = maybe[locale] || maybe.en || maybe.ar || maybe.fr;
          if (typeof nested === 'string' && nested.trim()) return nested;
        }
      }
    }
    return '';
  }, [locale]);

  const getCategoryName = useCallback((category) => {
    if (!category) return rtl ? 'منتجات متنوعة' : 'Assorted picks';
    const direct = getLocalizedValue(category);
    if (direct) return direct;
    const candidates = [category.name, category.title, category.label, category.translation, category.displayName];
    for (const entry of candidates) {
      const value = getLocalizedValue(entry);
      if (value) return value;
    }
    if (typeof category.slug === 'string') return category.slug.replace(/[-_]/g, ' ');
    if (typeof category === 'object') {
      const extra = category.nameAr || category.nameEn || category.nameFr || category.categoryName;
      if (typeof extra === 'string' && extra.trim()) return extra;
    }
    return rtl ? 'منتجات متنوعة' : 'Assorted picks';
  }, [getLocalizedValue, rtl]);

  const getProductName = useCallback((product) => {
    if (!product) return '';
    const direct = getLocalizedValue(product.name);
    if (direct) return direct;
    const candidates = [product.title, product.label, product.displayName, product.nameAr, product.nameEn, product.nameFr];
    for (const entry of candidates) {
      if (typeof entry === 'string' && entry.trim()) return entry;
      if (entry && typeof entry === 'object') {
        const val = entry[locale] || entry.en || entry.ar || entry.fr;
        if (typeof val === 'string' && val.trim()) return val;
      }
    }
    if (typeof product.slug === 'string') return product.slug.replace(/[-_]/g, ' ');
    return '';
  }, [getLocalizedValue, locale]);

  const normalizedCategories = useMemo(() => {
    const base = Array.isArray(categoryData) ? categoryData : [];
    return base
      .map((cat) => ({
        id: String(cat.id ?? cat.slug ?? getCategoryName(cat)),
        slug: cat.slug || cat.id || '',
        label: getCategoryName(cat),
        count: cat.productCount || cat.count || cat._count?.products || 0
      }))
      .filter((cat) => cat.slug)
      .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label, locale === 'ar' ? 'ar' : 'en'));
  }, [categoryData, getCategoryName, locale]);

  const getCategoryDisplayFromSlug = useCallback((slug) => {
    if (!slug) return rtl ? 'كل الفئات' : 'All categories';
    const match = normalizedCategories.find((cat) => cat.slug === slug);
    if (match) return match.label;
    return slug.replace(/[-_]/g, ' ');
  }, [normalizedCategories, rtl]);

  const priceOptionLabel = useCallback((value) => {
    const match = PRICE_OPTIONS.find((opt) => opt.value === value);
    if (!match) return rtl ? 'النطاق السعري' : 'Price range';
    return match.label[locale] || match.label.en || match.label.ar || match.label.fr;
  }, [locale, rtl]);

  const sortLabel = useCallback((value) => {
    const match = SORT_OPTIONS.find((opt) => opt.value === value);
    if (!match) return rtl ? 'الترتيب' : 'Sort';
    return match.label[locale] || match.label.en || match.label.ar || match.label.fr;
  }, [locale, rtl]);

  const getCategoryLabelForProduct = useCallback((product) => {
    const category = product?.category || product?.categoryInfo || {
      nameAr: product?.categoryName,
      nameEn: product?.categoryName,
      slug: product?.categorySlug
    };
    const label = getCategoryName(category);
    if (label) return label;
    if (typeof product?.categoryName === 'string') return product.categoryName;
    return rtl ? 'منتجات متنوعة' : 'Assorted picks';
  }, [getCategoryName, rtl]);

  const normalizeProducts = useCallback((items) => (
    Array.isArray(items)
      ? items.map((item) => ({
          ...item,
          __categoryLabel: getCategoryLabelForProduct(item),
          __displayName: getProductName(item) || item?.name || item?.title
        }))
      : []
  ), [getCategoryLabelForProduct, getProductName]);

  const [priceMin, priceMax] = useMemo(() => {
    if (!urlPrice) return [undefined, undefined];
    if (urlPrice.endsWith('+')) {
      const lower = Number(urlPrice.replace('+', ''));
      return [Number.isFinite(lower) ? lower : undefined, undefined];
    }
    const [minStr, maxStr] = urlPrice.split('-');
    const minVal = Number(minStr);
    const maxVal = Number(maxStr);
    return [Number.isFinite(minVal) ? minVal : undefined, Number.isFinite(maxVal) ? maxVal : undefined];
  }, [urlPrice]);

  const buildCacheKey = useCallback((pageToFetch) => (
    JSON.stringify({
      q: query.trim(),
      category: urlCategory,
      price: urlPrice,
      sort: urlSort,
      page: pageToFetch
    })
  ), [query, urlCategory, urlPrice, urlSort]);

  const fetchSuggestions = useCallback(async (value) => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const data = await api.searchTypeahead(value.trim());
      const productSuggestions = Array.isArray(data?.products) ? data.products.slice(0, 6) : [];
      const categorySuggestions = Array.isArray(data?.categories) ? data.categories.slice(0, 6) : [];
      const normalized = [
        ...productSuggestions.map((item) => ({
          type: 'product',
          id: item.id || item.slug || item.name,
          label: getProductName(item) || item.name,
          slug: item.slug || item.id,
          price: item.price,
          image: item.image,
          category: getCategoryLabelForProduct(item)
        })),
        ...categorySuggestions.map((item) => ({
          type: 'category',
          id: `cat-${item.id || item.slug || getCategoryName(item)}`,
          label: getCategoryName(item),
          slug: item.slug || item.id
        }))
      ];
      setSuggestions(normalized);
    } catch (err) {
      console.error('[search] suggestion error', err);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [getCategoryLabelForProduct, getCategoryName, getProductName]);

  useEffect(() => {
    if (!suggestionsOpen) return undefined;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(queryInput), SUGGESTION_DEBOUNCE);
    return () => clearTimeout(debounceRef.current);
  }, [fetchSuggestions, queryInput, suggestionsOpen]);

  useEffect(() => {
    if (!suggestionsOpen) return undefined;
    const handleClick = (event) => {
      if (
        searchFieldRef.current?.contains(event.target) ||
        suggestionsRef.current?.contains(event.target)
      ) {
        return;
      }
      setSuggestionsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [suggestionsOpen]);

  useEffect(() => {
    if (!openFilter) return undefined;
    const handleClick = (event) => {
      if (filtersRef.current?.contains(event.target)) return;
      setOpenFilter(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openFilter]);

  const fetchPage = useCallback(async (pageToFetch, { append = false } = {}) => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setLoading(false);
      return;
    }

    const cacheKey = buildCacheKey(pageToFetch);
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      setResults((prev) => append ? [...prev, ...cached.items] : cached.items);
      setTotal(cached.total);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setError(null);
      return;
    }

    if (pageToFetch === 1) {
      setLoading(true);
      setError(null);
    } else {
      setFetchingMore(true);
    }

    try {
      const payload = {
        q: query.trim(),
        page: pageToFetch,
        pageSize: PAGE_SIZE,
        sort: urlSort
      };
      if (urlCategory) payload.category = urlCategory;
      if (priceMin !== undefined) payload.priceMin = priceMin;
      if (priceMax !== undefined) payload.priceMax = priceMax;

      let data;
      try {
        data = await api.searchCatalog(payload);
      } catch (err) {
        data = await api.searchProducts(payload);
      }

      const rawItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.results)
            ? data.results
            : [];

      const normalizedItems = normalizeProducts(rawItems);
      const fallbackTotal = append
        ? resultsRef.current.length + normalizedItems.length
        : normalizedItems.length;

      const totalCount = data?.total ?? data?.count ?? data?.meta?.total ?? fallbackTotal;
      const nextPageExists = data?.nextPage !== undefined && data?.nextPage !== null;
      const hasMoreValue = (typeof data?.hasMore === 'boolean')
        ? data.hasMore
        : nextPageExists
          ? true
          : normalizedItems.length === PAGE_SIZE;

      cacheRef.current.set(cacheKey, {
        items: normalizedItems,
        total: totalCount,
        hasMore: hasMoreValue,
        page: pageToFetch
      });

      setResults((prev) => append ? [...prev, ...normalizedItems] : normalizedItems);
      setTotal(totalCount);
      setPage(pageToFetch);
      setHasMore(hasMoreValue);
      setError(null);
    } catch (err) {
      console.error('[search] fetch error', err);
      if (!append) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
      }
      setError(err?.message || 'Search failed');
    } finally {
      if (pageToFetch === 1) {
        setLoading(false);
      } else {
        setFetchingMore(false);
      }
    }
  }, [buildCacheKey, normalizeProducts, priceMax, priceMin, query, urlCategory, urlSort]);

  useEffect(() => {
    cacheRef.current.clear();
    if (!query.trim()) {
      setLoading(false);
      setResults([]);
      setTotal(0);
      setHasMore(false);
      return;
    }
    fetchPage(1, { append: false });
  }, [fetchPage, query, urlCategory, urlPrice, urlSort]);

  useEffect(() => {
    if (!hasMore) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.isIntersecting && !fetchingMore && !loading) {
        fetchPage(page + 1, { append: true });
      }
    }, { rootMargin: '480px' });
    observerRef.current.observe(node);
    return () => observerRef.current?.disconnect();
  }, [fetchPage, fetchingMore, hasMore, loading, page]);

  const updateUrl = useCallback((patch = {}) => {
    const nextParams = new URLSearchParams(search);
    if (Object.prototype.hasOwnProperty.call(patch, 'q')) {
      const value = (patch.q ?? '').trim();
      if (value) nextParams.set('q', value);
      else nextParams.delete('q');
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'category')) {
      const value = patch.category;
      if (value) nextParams.set('category', value);
      else nextParams.delete('category');
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'price')) {
      const value = patch.price;
      if (value) nextParams.set('price', value);
      else nextParams.delete('price');
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'sort')) {
      const value = patch.sort;
      if (value && value !== 'relevance') nextParams.set('sort', value);
      else nextParams.delete('sort');
    }
    nextParams.delete('page');
    const nextSearch = nextParams.toString();
    navigate({ pathname, search: nextSearch ? `?${nextSearch}` : '' });
  }, [navigate, pathname, search]);

  const handleSearchSubmit = useCallback((event) => {
    event.preventDefault();
    updateUrl({ q: queryInput, category: selectedCategory, price: priceRange, sort });
    setSuggestionsOpen(false);
  }, [priceRange, queryInput, selectedCategory, sort, updateUrl]);

  const handleSuggestionClick = useCallback((suggestion) => {
    if (!suggestion) return;
    setSuggestionsOpen(false);
    if (suggestion.type === 'product' && suggestion.slug) {
      navigate(`/product/${suggestion.slug}`);
      return;
    }
    updateUrl({ q: suggestion.label, category: suggestion.slug || selectedCategory });
  }, [navigate, selectedCategory, updateUrl]);

  const handleFilterSelect = useCallback((key, value) => {
    if (key === 'category') {
      updateUrl({ category: value });
      setOpenFilter(null);
      return;
    }
    if (key === 'price') {
      updateUrl({ price: value });
      setOpenFilter(null);
      return;
    }
    if (key === 'sort') {
      updateUrl({ sort: value });
      setOpenFilter(null);
    }
  }, [updateUrl]);

  const clearFilter = useCallback((key) => {
    if (key === 'category') updateUrl({ category: '' });
    if (key === 'price') updateUrl({ price: '' });
    if (key === 'sort') updateUrl({ sort: 'relevance' });
  }, [updateUrl]);

  const clearAllFilters = useCallback(() => {
    updateUrl({ category: '', price: '', sort: 'relevance' });
  }, [updateUrl]);

  const appliedFilters = useMemo(() => {
    const chips = [];
    if (selectedCategory) {
      chips.push({ key: 'category', label: getCategoryDisplayFromSlug(selectedCategory) });
    }
    if (priceRange) {
      chips.push({ key: 'price', label: priceOptionLabel(priceRange) });
    }
    if (sort && sort !== 'relevance') {
      chips.push({ key: 'sort', label: sortLabel(sort) });
    }
    return chips;
  }, [getCategoryDisplayFromSlug, priceOptionLabel, selectedCategory, sort, sortLabel, priceRange]);

  const highlightCount = useMemo(() => (results.length > 6 ? 4 : 0), [results.length]);
  const highlightItems = useMemo(() => (
    highlightCount ? results.slice(0, highlightCount) : []
  ), [highlightCount, results]);
  const remainderItems = useMemo(() => (
    highlightCount ? results.slice(highlightCount) : results
  ), [highlightCount, results]);

  const groupedSections = useMemo(() => {
    const map = new Map();
    remainderItems.forEach((product) => {
      const label = product.__categoryLabel || getCategoryLabelForProduct(product);
      const list = map.get(label) || [];
      list.push(product);
      map.set(label, list);
    });
    return Array.from(map.entries());
  }, [getCategoryLabelForProduct, remainderItems]);

  const summaryChips = useMemo(() => ([
    { icon: Sparkles, label: rtl ? 'اختيارات مميزة' : 'Highlights', value: highlightItems.length },
    { icon: Layers, label: rtl ? 'فئات منسقة' : 'Curated categories', value: groupedSections.length },
    { icon: Tag, label: rtl ? 'نتائج كلية' : 'Total results', value: total }
  ]), [groupedSections.length, highlightItems.length, rtl, total]);

  const formatCurrency = useCallback((value) => {
    const localeMap = { ar: 'ar-SA', en: 'en-US', fr: 'fr-FR' };
    const formatter = new Intl.NumberFormat(localeMap[locale] || 'en-US', {
      style: 'currency',
      currency: 'SAR'
    });
    return formatter.format(value || 0);
  }, [locale]);

  const hasResults = results.length > 0;
  const noResults = !loading && !error && query && results.length === 0;
  const hasFilters = appliedFilters.length > 0;

  return (
    <div className="container-custom px-4 py-10">
      <Breadcrumbs
        items={[
          { label: rtl ? 'الرئيسية' : 'Home', to: rtl ? '/' : '/' },
          { label: rtl ? 'نتائج البحث' : 'Search results' }
        ]}
      />

      <motion.section
        className="relative overflow-hidden rounded-4xl bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white shadow-[0_40px_120px_-50px_rgba(15,23,42,0.65)]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      >
        <div className="absolute inset-0 opacity-70" aria-hidden>
          <div className="absolute top-[-120px] left-[-80px] h-72 w-72 rounded-full bg-emerald-500/40 blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-60px] h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        <div className="relative z-10 px-6 py-10 sm:px-10">
          <div className="mb-6 flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.35em] text-white/60">
              {rtl ? 'اكتشف عروضنا الفاخرة' : 'Discover curated luxury'}
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {rtl ? 'نتائج بحث مخصّصة لك' : 'Handpicked search results just for you'}
            </h1>
            {query && (
              <p className="text-sm text-white/70">
                {rtl ? `بحثت عن “${query}”` : `You searched for “${query}”`}
              </p>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative" dir={rtl ? 'rtl' : 'ltr'}>
            <div
              ref={searchFieldRef}
              className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 px-5 py-4 shadow-lg backdrop-blur-md focus-within:border-white/30 focus-within:ring-2 focus-within:ring-emerald-300/40"
            >
              <Search
                size={18}
                className={`text-white/70 ${rtl ? 'ml-1' : 'mr-1'}`}
              />
              <input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                onFocus={() => setSuggestionsOpen(true)}
                placeholder={rtl ? 'ابحث عن المنتجات أو العلامات...' : 'Search products, brands, or collections...'}
                className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/60 focus:outline-none"
              />
              {queryInput && (
                <button
                  type="button"
                  onClick={() => { setQueryInput(''); setSuggestions([]); }}
                  className="rounded-full border border-white/10 bg-white/10 p-2 text-white/70 transition hover:bg-white/20"
                  aria-label={rtl ? 'مسح البحث' : 'Clear search'}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-50"
              >
                {rtl ? 'ابحث الآن' : 'Search now'}
              </button>
            </div>

            <AnimatePresence>
              {suggestionsOpen && (suggestionsLoading || suggestions.length > 0) && (
                <motion.div
                  ref={suggestionsRef}
                  className="absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25 }}
                >
                  {suggestionsLoading && (
                    <div className="flex items-center gap-3 px-6 py-4 text-sm text-white/70">
                      <Loader2 size={18} className="animate-spin" />
                      {rtl ? 'جاري التحميل...' : 'Loading suggestions...'}
                    </div>
                  )}
                  {!suggestionsLoading && suggestions.length === 0 && queryInput.trim().length >= 2 && (
                    <div className="px-6 py-5 text-sm text-white/60">
                      {rtl ? 'لا توجد اقتراحات حالياً' : 'No live suggestions just yet'}
                    </div>
                  )}
                  {!suggestionsLoading && suggestions.length > 0 && (
                    <ul className="divide-y divide-white/5">
                      {suggestions.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(item)}
                            className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-white/5"
                          >
                            {item.type === 'product' ? (
                              <>
                                <div className="h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                  {item.image ? (
                                    <img src={item.image} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-white/60">
                                      <Tag size={16} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white line-clamp-1">{item.label}</p>
                                  <p className="text-xs text-white/60 line-clamp-1">
                                    {item.category}
                                  </p>
                                </div>
                                <span className="text-xs font-semibold text-emerald-300">
                                  {typeof item.price === 'number' ? formatCurrency(item.price) : ''}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-200">
                                  <Layers size={16} />
                                </div>
                                <div className="flex-1 text-sm font-semibold text-white">
                                  {item.label}
                                </div>
                                <span className="text-xs text-white/60">
                                  {rtl ? 'فئة' : 'Category'}
                                </span>
                              </>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {summaryChips.map((chip) => (
              <motion.div
                key={chip.label}
                className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/35 text-white">
                  <chip.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">{chip.label}</p>
                  <p className="text-lg font-semibold text-white">{chip.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="mt-10" ref={filtersRef}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                  onClick={() => setOpenFilter((prev) => (prev === 'category' ? null : 'category'))}
                >
                  <FilterIcon size={16} />
                  <span>{getCategoryDisplayFromSlug(selectedCategory)}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <AnimatePresence>
                  {openFilter === 'category' && (
                    <motion.div
                      className="absolute z-30 mt-2 w-72 max-h-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      <button
                        type="button"
                        onClick={() => handleFilterSelect('category', '')}
                        className={`flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-emerald-50 dark:hover:bg-slate-800 ${!selectedCategory ? 'text-emerald-600 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                      >
                        {rtl ? 'كل الفئات' : 'All categories'}
                      </button>
                      <div className="max-h-64 overflow-y-auto">
                        {categoriesLoading && (
                          <div className="px-4 py-3 text-xs text-slate-500">
                            {rtl ? 'جاري تحميل الفئات...' : 'Loading categories...'}
                          </div>
                        )}
                        {!categoriesLoading && normalizedCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleFilterSelect('category', cat.slug)}
                            className={`flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-emerald-50 dark:hover:bg-slate-800 ${selectedCategory === cat.slug ? 'text-emerald-600 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            <span className="line-clamp-1">{cat.label}</span>
                            {cat.count > 0 && (
                              <span className="text-xs text-slate-400">{cat.count}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                  onClick={() => setOpenFilter((prev) => (prev === 'price' ? null : 'price'))}
                >
                  <Tag size={16} />
                  <span>{priceOptionLabel(priceRange)}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <AnimatePresence>
                  {openFilter === 'price' && (
                    <motion.div
                      className="absolute z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      {PRICE_OPTIONS.map((option) => (
                        <button
                          key={option.value || 'all'}
                          type="button"
                          onClick={() => handleFilterSelect('price', option.value)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-emerald-50 dark:hover:bg-slate-800 ${priceRange === option.value ? 'text-emerald-600 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                          {option.label[locale] || option.label.en}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                  onClick={() => setOpenFilter((prev) => (prev === 'sort' ? null : 'sort'))}
                >
                  <SlidersHorizontal size={16} />
                  <span>{sortLabel(sort)}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                <AnimatePresence>
                  {openFilter === 'sort' && (
                    <motion.div
                      className="absolute z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-700/60 dark:bg-slate-900"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleFilterSelect('sort', option.value)}
                          className={`flex w-full items-center justify-between px-4 py-3 text-sm transition hover:bg-emerald-50 dark:hover:bg-slate-800 ${sort === option.value ? 'text-emerald-600 font-semibold' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                          {option.label[locale] || option.label.en}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {rtl ? 'إزالة كافة المرشحات' : 'Clear all filters'}
              </button>
            )}
          </div>

          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {appliedFilters.map((chip) => (
                <span
                  key={chip.key}
                  className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => clearFilter(chip.key)}
                    className="rounded-full bg-emerald-100 p-1 text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-900/70 dark:text-emerald-200 dark:hover:bg-emerald-800"
                    aria-label={rtl ? 'إزالة المرشح' : 'Remove filter'}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-800/60 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-300 mb-4 text-lg font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => fetchPage(1, { append: false })}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            {rtl ? 'إعادة المحاولة' : 'Try again'}
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )}

      {noResults && (
        <div className="mt-16 rounded-3xl border border-slate-200/80 bg-white px-6 py-16 text-center shadow-lg dark:border-slate-700/60 dark:bg-slate-900">
          <Zap size={32} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="mb-3 text-2xl font-semibold text-slate-800 dark:text-white">
            {rtl ? 'لم نعثر على نتائج' : 'No matches just yet'}
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm text-slate-500 dark:text-slate-300">
            {rtl ? 'جرّب كلمات مفتاحية مختلفة أو ضيّق نطاق البحث باستخدام المرشحات.' : 'Try different keywords or refine your filters for a more tailored discovery experience.'}
          </p>
          <button
            type="button"
            onClick={() => updateUrl({ q: '', category: '', price: '', sort: 'relevance' })}
            className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {rtl ? 'عرض كل المنتجات' : 'Browse all products'}
          </button>
        </div>
      )}

      {!loading && !error && hasResults && (
        <div className="mt-12 space-y-12">
          {highlightItems.length > 0 && (
            <section>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                  {rtl ? 'مختارات فاخرة لك' : 'Curated highlights for you'}
                </h2>
                <span className="text-sm text-slate-500 dark:text-slate-300">
                  {highlightItems.length} {rtl ? 'منتج' : 'items'}
                </span>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {highlightItems.map((product) => (
                  <ProductCard key={product.id || product.slug} product={product} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {groupedSections.map(([label, items]) => (
            <section key={label}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {label}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-300">
                  {items.length} {rtl ? 'منتج' : 'items'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id || product.slug} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" aria-hidden />

      {fetchingMore && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500 dark:text-slate-300">
          <Loader2 size={18} className="animate-spin" />
          {rtl ? 'جاري تحميل المزيد...' : 'Loading additional results...'}
        </div>
      )}

      {hasMore && !fetchingMore && (
        <div className="flex justify-center py-10">
          <button
            type="button"
            onClick={() => fetchPage(page + 1, { append: true })}
            className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {rtl ? 'تحميل المزيد' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;

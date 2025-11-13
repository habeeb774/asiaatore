// Lazy image component for better performance
const LazyImage = React.memo(({ src, alt, className, onLoad }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
      onLoad?.();
    };
    img.onerror = () => setError(true);
  }, [src, onLoad]);

  if (error) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        <Package size={20} className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden bg-gray-100 dark:bg-gray-800`}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 w-full h-full"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        loading="lazy"
      />
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

// call useLanguage inside a small safe custom hook so the component
// always calls hooks in the same order (rules-of-hooks compliance)
function useSafeLanguage() {
  try {
    return useLanguage();
  } catch (e) {
    return { locale: 'ar', t: (k) => k, setLocale: () => {} };
  }
}

export default function SearchOverlay() {
  const { locale, t } = useSafeLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ products: [], categories: [], brands: [] });
  const [fullResults, setFullResults] = useState([]);
  const [fullLoading, setFullLoading] = useState(false);
  const [showFullResults, setShowFullResults] = useState(false);
  const [fullPage, setFullPage] = useState(1);
  const [fullTotal, setFullTotal] = useState(0);
  const [popularCats, setPopularCats] = useState([]); // { category, count, items }
  const [recentProducts, setRecentProducts] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { const raw = localStorage.getItem('my_store_recent_searches'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    category: '',
    brand: '',
    minRating: '',
    sortBy: 'relevance'
  });
  // Performance optimizations
  const [searchCache, setSearchCache] = useState(new Map());
  const [imagePreloadQueue, setImagePreloadQueue] = useState(new Set());
  const inputRef = useRef(null);
  const cacheTimeoutRef = useRef(null);
  const dirRtl = locale === 'ar';
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  

  const openOverlay = useCallback(() => setOpen(true), []);
  const closeOverlay = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onFocus = () => openOverlay();
    window.addEventListener('search:focus', onFocus);
    return () => window.removeEventListener('search:focus', onFocus);
  }, [openOverlay]);

  useEffect(() => {
    if (open) {
      // small delay so overlay mounts before focusing
      const id = setTimeout(() => { try { inputRef.current?.focus(); } catch {} }, 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeOverlay(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeOverlay]);

  // Load quick suggestions when opening and no query
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        // Popular categories via catalog summary
        const catData = await api.catalogSummary().catch(() => ({ categories: [] }));
        if (!cancelled) setPopularCats(Array.isArray(catData?.categories) ? catData.categories.slice(0, 6) : []);
      } catch { /* ignore */ }
      try {
        // Recent products: newest items page 1
        const list = await api.searchProducts({ page: 1, pageSize: 8 }).catch(() => []);
        const items = Array.isArray(list) ? list : (Array.isArray(list?.items) ? list.items : []);
        if (!cancelled) setRecentProducts(items.slice(0, 8));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [open]);

  useEffect(() => {
    // reset focused index when results or open state changes
    setFocusedIndex(-1);
  }, [results, open, query]);

  const saveRecentSearch = useCallback((q) => {
    if (!q) return;
    setRecentSearches(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 8);
      try { localStorage.setItem('my_store_recent_searches', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      category: '',
      brand: '',
      minRating: '',
      sortBy: 'relevance'
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== '' && value !== 'relevance');
  }, [filters]);

  // Performance: Preload images
  const preloadImages = useCallback((products) => {
    if (!products || !Array.isArray(products)) return;

    const newImages = products
      .filter(p => p.image && !imagePreloadQueue.has(p.image))
      .map(p => p.image)
      .slice(0, 6); // Limit to 6 images

    if (newImages.length === 0) return;

    setImagePreloadQueue(prev => new Set([...prev, ...newImages]));

    newImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [imagePreloadQueue]);

  // Performance: Cache search results
  const getCachedResult = useCallback((key) => {
    const cached = searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutes cache
      return cached.data;
    }
    return null;
  }, [searchCache]);

  const setCachedResult = useCallback((key, data) => {
    setSearchCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, { data, timestamp: Date.now() });

      // Limit cache size to 20 entries
      if (newCache.size > 20) {
        const oldestKey = newCache.keys().next().value;
        newCache.delete(oldestKey);
      }

      return newCache;
    });
  }, []);

  // Performance: Clear cache periodically
  useEffect(() => {
    cacheTimeoutRef.current = setInterval(() => {
      setSearchCache(prev => {
        const now = Date.now();
        const newCache = new Map();
        for (const [key, value] of prev) {
          if (now - value.timestamp < 10 * 60 * 1000) { // Keep for 10 minutes
            newCache.set(key, value);
          }
        }
        return newCache;
      });
    }, 5 * 60 * 1000); // Clean every 5 minutes

    return () => {
      if (cacheTimeoutRef.current) {
        clearInterval(cacheTimeoutRef.current);
      }
    };
  }, []);

  const performTypeahead = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults({ products: [], categories: [] }); return; }

    const cacheKey = `typeahead_${q.trim()}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      setResults(cached);
      preloadImages([...cached.products, ...cached.categories]);
      return;
    }

    setLoading(true); setError(null);
    try {
      const data = await api.searchTypeahead(q.trim());
      const results = {
        products: Array.isArray(data?.products) ? data.products : [],
        categories: Array.isArray(data?.categories) ? data.categories : [],
        brands: Array.isArray(data?.brands) ? data.brands : []
      };
      setResults(results);
      setCachedResult(cacheKey, results);
      preloadImages([...results.products, ...results.categories, ...results.brands]);
    } catch (e) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }, [getCachedResult, setCachedResult, preloadImages]);

  // full search (used when user submits form / presses Enter with no focused suggestion)
  const performFullSearch = useCallback(async (q, page = 1, pageSize = 24) => {
    const qq = (q || '').trim();
    if (!qq) return;

    const filterKey = JSON.stringify(filters);
    const cacheKey = `full_${qq}_${page}_${pageSize}_${filterKey}`;
    const cached = getCachedResult(cacheKey);
    if (cached && page === 1) { // Only cache first page for simplicity
      setFullResults(cached.items);
      setFullTotal(cached.total);
      setFullPage(cached.page);
      preloadImages(cached.items);
      return;
    }

    setFullLoading(true); setShowFullResults(true); setError(null);
    try {
      const searchParams = { q: qq, page, pageSize };

      // Add filters to search params
      if (filters.minPrice) searchParams.minPrice = filters.minPrice;
      if (filters.maxPrice) searchParams.maxPrice = filters.maxPrice;
      if (filters.category) searchParams.category = filters.category;
      if (filters.brand) searchParams.brand = filters.brand;
      if (filters.minRating) searchParams.minRating = filters.minRating;
      if (filters.sortBy && filters.sortBy !== 'relevance') searchParams.sortBy = filters.sortBy;

      const data = await api.searchProducts(searchParams);
      // support several possible shapes from backend
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.products) ? data.products : []));
      const total = Number(data?.total || data?.count || (Array.isArray(items) ? items.length : 0));
      const pageNum = Number(data?.page || page);

      setFullResults(items);
      setFullTotal(total);
      setFullPage(pageNum);

      // Cache first page results
      if (page === 1) {
        setCachedResult(cacheKey, { items, total, page: pageNum });
      }

      preloadImages(items);
    } catch (e) {
      setError(e?.message || 'Error');
    } finally { setFullLoading(false); }
  }, [filters, getCachedResult, setCachedResult, preloadImages]);

  // Debounce query typing with improved performance
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performTypeahead(query), 250); // Reduced from 280ms
    return () => clearTimeout(debounceRef.current);
  }, [query, performTypeahead, open]);

  const hasQuery = (query || '').trim().length >= 2;
  const showSuggestions = open && !hasQuery;

  // Flatten suggestions for keyboard nav: each item -> { type, data }
  const flatSuggestions = useMemo(() => {
    const list = [];
    if (hasQuery) {
      (results.categories || []).slice(0,6).forEach(c => list.push({ type: 'category', data: c }));
      (results.brands || []).slice(0,6).forEach(b => list.push({ type: 'brand', data: b }));
      (results.products || []).slice(0,8).forEach(p => list.push({ type: 'product', data: p }));
    }
    return list;
  }, [results, hasQuery]);

  const clampIndex = (i) => {
    if (flatSuggestions.length === 0) return -1;
    if (i < 0) return flatSuggestions.length - 1;
    if (i >= flatSuggestions.length) return 0;
    return i;
  };

  // keyboard navigation on input
  const onInputKeyDown = useCallback((e) => {
    if (!hasQuery) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => clampIndex(prev + (e.key === 'ArrowDown' ? 1 : -1)));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && flatSuggestions[focusedIndex]) {
        e.preventDefault();
        const it = flatSuggestions[focusedIndex];
        if (it.type === 'product') {
          saveRecentSearch(query.trim());
          closeOverlay();
          navigate(`/products/${it.data.slug || it.data.id}`);
        } else if (it.type === 'category') {
          saveRecentSearch(query.trim());
          closeOverlay();
          navigate(`/products?category=${encodeURIComponent(it.data.slug || it.data.id || '')}`);
        } else if (it.type === 'brand') {
          saveRecentSearch(query.trim());
          closeOverlay();
          navigate(`/products?brand=${encodeURIComponent(it.data.slug || it.data.id || '')}`);
        }
      } else {
        // normal submit
      }
    }
  }, [hasQuery, focusedIndex, flatSuggestions, query, closeOverlay, navigate, saveRecentSearch]);

  const renderHighlighted = (text, q) => {
    if (!q) return text;
    try {
      const idx = (String(text || '')).toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return text;
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + q.length);
      const after = text.slice(idx + q.length);
      return (<span>{before}<span className="bg-amber-200/60 px-0.5">{match}</span>{after}</span>);
    } catch {
      return text;
    }
  };

  const onSubmit = useCallback((e) => {
    e?.preventDefault?.();
    const q = (query || '').trim();
    if (!q) return;
    saveRecentSearch(q);
    // perform full search inside the overlay instead of navigating away
    performFullSearch(q, 1, 24);
  }, [query, closeOverlay, navigate, saveRecentSearch]);

  const sectionTitle = (key, fallback) => (t?.(key) || fallback);

  const dirClass = useMemo(() => dirRtl ? 'rtl' : 'ltr', [dirRtl]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            key="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60 backdrop-blur-sm z-[1200]"
            onClick={closeOverlay}
          />

          {/* centered panel under the top bar with fade+scale */}
          <motion.div
            key="search-panel"
            dir={dirRtl ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[1201] flex items-start justify-center pt-20 sm:pt-24"
            aria-modal="true"
            role="dialog"
            aria-label={(t && (t('search') || 'Search'))}
          >
            <div className="relative w-full px-4 max-w-3xl z-[1202]">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-blue-50/30 dark:from-emerald-900/10 dark:to-blue-900/10 pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <Search size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{(t && (t('search') || 'Search'))}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {locale === 'ar' ? 'اكتشف منتجاتنا' : 'Discover our products'}
                          {hasActiveFilters && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full text-xs font-medium">
                              {locale === 'ar' ? 'فلاتر نشطة' : 'Filters Active'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-mono border">Esc</kbd>
                        <span>{locale === 'ar' ? 'للإغلاق' : 'to close'}</span>
                      </div>
                      <button 
                        onClick={closeOverlay} 
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-label={t?.('close') || 'Close'}
                      >
                        <X size={20} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <form onSubmit={onSubmit} className="relative mb-6">
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      onInputKeyDown(e);
                      // handle Enter when no suggestion focused
                      if (e.key === 'Enter') {
                        const q = (query || '').trim();
                        if (!q) return;
                        // if no focused suggestion, navigate to central search
                        if (focusedIndex < 0) {
                          e.preventDefault();
                          saveRecentSearch(q);
                          closeOverlay();
                          navigate(`/search?q=${encodeURIComponent(q)}`);
                        }
                      }
                    }}
                    placeholder={(t && (t('searchPlaceholder') || 'Search...'))}
                    className="w-full px-6 py-4 text-lg rounded-2xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 transition-all duration-200 shadow-sm"
                  />
                  <button 
                    type="submit" 
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-xl transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!query.trim()}
                  >
                    <Search size={18} />
                  </button>
                  </form>

                  {/* Advanced Filters */}
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                        showAdvancedFilters || hasActiveFilters
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Filter size={16} />
                      <span className="text-sm font-medium">
                        {locale === 'ar' ? 'فلاتر متقدمة' : 'Advanced Filters'}
                        {hasActiveFilters && <span className="ml-1 text-xs">●</span>}
                      </span>
                      {showAdvancedFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                      {showAdvancedFilters && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Price Range */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  <DollarSign size={14} />
                                  {locale === 'ar' ? 'نطاق السعر' : 'Price Range'}
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    placeholder={locale === 'ar' ? 'من' : 'Min'}
                                    value={filters.minPrice}
                                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                  <input
                                    type="number"
                                    placeholder={locale === 'ar' ? 'إلى' : 'Max'}
                                    value={filters.maxPrice}
                                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                </div>
                              </div>

                              {/* Category */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  <Tag size={14} />
                                  {locale === 'ar' ? 'الفئة' : 'Category'}
                                </label>
                                <select
                                  value={filters.category}
                                  onChange={(e) => updateFilter('category', e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                  <option value="">{locale === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                                  {popularCats.slice(0, 10).map((cat) => (
                                    <option key={cat.category} value={cat.category}>
                                      {cat.category} ({cat.count})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Brand */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  <Star size={14} />
                                  {locale === 'ar' ? 'العلامة التجارية' : 'Brand'}
                                </label>
                                <input
                                  type="text"
                                  placeholder={locale === 'ar' ? 'اسم العلامة' : 'Brand name'}
                                  value={filters.brand}
                                  onChange={(e) => updateFilter('brand', e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>

                              {/* Rating */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  <Star size={14} className="text-yellow-500" />
                                  {locale === 'ar' ? 'التقييم الأدنى' : 'Min Rating'}
                                </label>
                                <select
                                  value={filters.minRating}
                                  onChange={(e) => updateFilter('minRating', e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                  <option value="">{locale === 'ar' ? 'أي تقييم' : 'Any Rating'}</option>
                                  <option value="4">4+ {locale === 'ar' ? 'نجوم' : 'Stars'}</option>
                                  <option value="3">3+ {locale === 'ar' ? 'نجوم' : 'Stars'}</option>
                                  <option value="2">2+ {locale === 'ar' ? 'نجوم' : 'Stars'}</option>
                                  <option value="1">1+ {locale === 'ar' ? 'نجوم' : 'Stars'}</option>
                                </select>
                              </div>

                              {/* Sort By */}
                              <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  <TrendingUp size={14} />
                                  {locale === 'ar' ? 'ترتيب حسب' : 'Sort By'}
                                </label>
                                <select
                                  value={filters.sortBy}
                                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                >
                                  <option value="relevance">{locale === 'ar' ? 'الأكثر صلة' : 'Most Relevant'}</option>
                                  <option value="price_low">{locale === 'ar' ? 'السعر: من الأقل للأعلى' : 'Price: Low to High'}</option>
                                  <option value="price_high">{locale === 'ar' ? 'السعر: من الأعلى للأقل' : 'Price: High to Low'}</option>
                                  <option value="rating">{locale === 'ar' ? 'التقييم' : 'Rating'}</option>
                                  <option value="newest">{locale === 'ar' ? 'الأحدث' : 'Newest'}</option>
                                </select>
                              </div>

                              {/* Clear Filters */}
                              <div className="flex items-end">
                                <button
                                  onClick={clearFilters}
                                  disabled={!hasActiveFilters}
                                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  {locale === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                {/* Render either: full search results (after submit), typeahead (while typing), or quick suggestions (no query) */}
                {showFullResults ? (
                  <div className="mt-6">
                    {fullLoading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">{locale==='ar'? 'جاري البحث...' : 'Searching...'}</span>
                      </div>
                    )}
                    {!fullLoading && fullResults && fullResults.length === 0 && (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <div className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">{locale==='ar' ? 'لا توجد نتائج للبحث' : 'No search results'}</div>
                        <div className="text-sm text-gray-500 mb-4">{locale==='ar' ? 'جرب كلمات بحث مختلفة أو أقل تحديداً' : 'Try different or less specific search terms'}</div>
                        <button
                          onClick={() => setShowFullResults(false)}
                          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
                        >
                          {locale === 'ar' ? 'البحث مرة أخرى' : 'Search Again'}
                        </button>
                      </div>
                    )}
                    {!fullLoading && fullResults && fullResults.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {locale === 'ar' ? `عرض ${fullResults.length} من ${fullTotal} نتيجة` : `Showing ${fullResults.length} of ${fullTotal} results`}
                          </div>
                          <button
                            onClick={() => setShowFullResults(false)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                          >
                            {locale === 'ar' ? 'البحث السريع' : 'Quick Search'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {fullResults.map((p) => (
                            <button 
                              key={p.id} 
                              className="group text-start p-4 bg-white dark:bg-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 border border-gray-100 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1"
                              onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}
                            >
                              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 mb-3">
                                <LazyImage
                                  src={p.image}
                                  alt={resolveLocalized(p.name, locale) || p.name || ''}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate text-gray-900 dark:text-white mb-1">{resolveLocalized(p.name, locale) || p.name || p.title}</div>
                                <div className="text-lg font-bold text-emerald-600 mb-2">{Number(p.price||0).toFixed(2)} ر.س</div>
                                {p.category && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full inline-block">
                                    {resolveLocalized(p.category, locale) || p.category}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        {fullTotal > fullResults.length && (
                          <div className="flex items-center justify-center gap-3 pt-4">
                            <button 
                              disabled={fullPage <= 1 || fullLoading} 
                              onClick={() => { const nextPage = Math.max(1, fullPage - 1); performFullSearch(query, nextPage); }} 
                              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                              {locale==='ar' ? 'السابق' : 'Previous'}
                            </button>
                            <div className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg font-semibold">
                              {fullPage}
                            </div>
                            <button 
                              disabled={fullLoading} 
                              onClick={() => { const nextPage = fullPage + 1; performFullSearch(query, nextPage); }} 
                              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                            >
                              {locale==='ar' ? 'التالي' : 'Next'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : hasQuery ? (
                  <div className="mt-4 space-y-4">
                    {loading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{locale==='ar'? 'جاري البحث...' : 'Searching...'}</span>
                      </div>
                    )}
                    {error && (
                      <div className="text-center py-8">
                        <div className="text-red-600 mb-2">⚠️ {error}</div>
                        <button
                          onClick={() => performTypeahead(query)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
                        </button>
                      </div>
                    )}
                    {!loading && !error && (results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0) && (
                      <div className="space-y-6">
                        {/* Categories */}
                        {results.categories.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Tag size={16} className="text-blue-600" />
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{locale==='ar'?'الفئات':'Categories'}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {results.categories.slice(0,6).map((c, idx) => (
                                <button 
                                  key={c.slug || idx} 
                                  className="px-4 py-2 rounded-full text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 border border-blue-200 dark:border-blue-800"
                                  onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products?category=${encodeURIComponent(c.slug || c.id || '')}`); }}
                                >
                                  {renderHighlighted(resolveLocalized(c.name, locale) || c.nameAr || c.nameEn || c.slug, query)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Brands */}
                        {results.brands && results.brands.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Star size={16} className="text-purple-600" />
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{locale==='ar'?'العلامات التجارية':'Brands'}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {results.brands.slice(0,6).map((b, idx) => (
                                <button 
                                  key={b.id || b.slug || idx} 
                                  className="px-4 py-2 rounded-full text-sm bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-200 border border-purple-200 dark:border-purple-800"
                                  onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products?brand=${encodeURIComponent(b.slug || b.id || '')}`); }}
                                >
                                  {renderHighlighted(resolveLocalized(b.name, locale) || b.nameAr || b.nameEn || b.slug, query)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Products */}
                        {results.products.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-emerald-600" />
                              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{locale==='ar'?'منتجات':'Products'}</div>
                            </div>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
                              {results.products.slice(0, 8).map((p) => (
                                <li 
                                  key={p.id} 
                                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors duration-200 ${(flatSuggestions[focusedIndex]?.type === 'product' && flatSuggestions[focusedIndex]?.data?.id === p.id) ? 'bg-amber-50 dark:bg-amber-900/10 ring-2 ring-amber-200 dark:ring-amber-800' : ''}`} 
                                  onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}
                                >
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                    {p.image && <img src={p.image} alt={resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || ''} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold truncate text-gray-900 dark:text-white">{renderHighlighted(resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || '', query)}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-3 mt-1">
                                      <span className="font-medium text-emerald-600">{Number(p.price||0).toFixed(2)} ر.س</span>
                                      {p.category && <span className="opacity-70">{resolveLocalized(p.category, locale) || p.category}</span>}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {!loading && !error && results.products.length === 0 && results.categories.length === 0 && results.brands.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">🔍</div>
                        <div className="text-gray-600 dark:text-gray-400 mb-2">{locale==='ar'?'لا توجد نتائج':'No results found'}</div>
                        <div className="text-sm text-gray-500">{locale==='ar'?'جرب كلمات بحث مختلفة':'Try different search terms'}</div>
                      </div>
                    )}
                  </div>
                ) : showSuggestions ? (
                  <div className="mt-4 space-y-6" dir={dirClass}>
                    {/* Recent Searches */}
                    {recentSearches && recentSearches.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{locale==='ar'?'عمليات بحث حديثة':'Recent Searches'}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((r) => (
                            <button 
                              key={r} 
                              className="px-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-700"
                              onClick={() => setQuery(r)}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Popular Categories */}
                    {popularCats && popularCats.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-emerald-600" />
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{locale==='ar'?'تصنيفات شائعة':'Popular Categories'}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {popularCats.map((c) => (
                            <button 
                              key={c.category} 
                              className="px-4 py-2 rounded-full text-sm bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors duration-200 border border-emerald-200 dark:border-emerald-800"
                              onClick={() => { closeOverlay(); navigate(`/products?category=${encodeURIComponent(c.category)}`); }}
                            >
                              {c.category} {c.count != null && <span className="opacity-60">({c.count})</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Recent Products */}
                    {recentProducts && recentProducts.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-blue-600" />
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{locale==='ar'?'منتجات حديثة':'Recent Products'}</div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {recentProducts.slice(0,6).map((p) => (
                            <button 
                              key={p.id} 
                              className="group text-start p-3 bg-white dark:bg-slate-800 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-200 border border-gray-100 dark:border-slate-700 hover:shadow-md"
                              onClick={() => { closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}
                            >
                              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 mb-2">
                                {p.image && <img src={p.image} alt={resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />}
                              </div>
                              <div className="text-sm font-medium truncate text-gray-900 dark:text-white">{resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || ''}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Number(p.price||0).toFixed(2)} ر.س</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Helper */}
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
                        {locale === 'ar' ? 'اكتب للبحث عن المنتجات والفئات' : 'Type to search products and categories'}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Note: quick suggestions are shown above when no query (handled in the ternary) */}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

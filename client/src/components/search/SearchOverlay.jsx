import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from '../../lib/framerLazy';
import { X } from 'lucide-react';
import { useLanguage } from '../../stores/LanguageContext';
import { resolveLocalized } from '../../utils/locale';
import api from '../../services/api/client';
import { useNavigate } from 'react-router-dom';

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
  const inputRef = useRef(null);
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

  const performTypeahead = useCallback(async (q) => {
    if (!q || q.trim().length < 2) { setResults({ products: [], categories: [] }); return; }
    setLoading(true); setError(null);
    try {
      const data = await api.searchTypeahead(q.trim());
      setResults({
        products: Array.isArray(data?.products) ? data.products : [],
        categories: Array.isArray(data?.categories) ? data.categories : [],
        brands: Array.isArray(data?.brands) ? data.brands : []
      });
    } catch (e) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
  }, []);

  // full search (used when user submits form / presses Enter with no focused suggestion)
  const performFullSearch = useCallback(async (q, page = 1, pageSize = 24) => {
    const qq = (q || '').trim();
    if (!qq) return;
    setFullLoading(true); setShowFullResults(true); setError(null);
    try {
      const data = await api.searchProducts({ q: qq, page, pageSize });
      // support several possible shapes from backend
      const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : (Array.isArray(data?.products) ? data.products : []));
      const total = Number(data?.total || data?.count || (Array.isArray(items) ? items.length : 0));
      setFullResults(items);
      setFullTotal(total);
      setFullPage(Number(data?.page || page));
    } catch (e) {
      setError(e?.message || 'Error');
    } finally { setFullLoading(false); }
  }, []);

  // Debounce query typing
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performTypeahead(query), 280);
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
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black z-[1200]"
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
            <div className="relative w-full px-4 max-w-2xl z-[1202]">
              <div className="bg-white/95 dark:bg-slate-900/90 rounded-xl shadow-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-semibold opacity-80">{(t && (t('search') || 'Search'))}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">Esc</kbd> <span className="hidden sm:inline">{locale === 'ar' ? 'للإغلاق' : 'to close'}</span>
                    </div>
                    <button onClick={closeOverlay} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label={t?.('close') || 'Close'}>
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <form onSubmit={onSubmit} className="relative">
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                  <button type="submit" className="absolute end-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-600 disabled:opacity-50" disabled={!query.trim()}>
                    {locale==='ar' ? 'بحث' : 'Search'}
                  </button>
                </form>

                {/* Render either: full search results (after submit), typeahead (while typing), or quick suggestions (no query) */}
                {showFullResults ? (
                  <div className="mt-4">
                    {fullLoading && <div className="text-sm text-slate-500">{locale==='ar'? 'جاري البحث...' : 'Searching...'}</div>}
                    {!fullLoading && fullResults && fullResults.length === 0 && (
                      <div className="text-sm text-slate-500">{locale==='ar' ? 'لا توجد نتائج للبحث' : 'No search results'}</div>
                    )}
                    {!fullLoading && fullResults && fullResults.length > 0 && (
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {fullResults.map((p) => (
                            <button key={p.id} className="text-start p-2 bg-transparent rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}>
                              <div className="w-full flex gap-3 items-center">
                                <div className="w-16 h-16 rounded overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                  <img src={p.image} alt={resolveLocalized(p.name, locale) || p.name || ''} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold truncate">{resolveLocalized(p.name, locale) || p.name || p.title}</div>
                                  <div className="text-xs text-slate-500">{Number(p.price||0).toFixed(2)} ر.س</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                        {fullTotal > fullResults.length && (
                          <div className="mt-3 flex items-center justify-center gap-2">
                            <button disabled={fullPage <= 1 || fullLoading} onClick={() => { const nextPage = Math.max(1, fullPage - 1); performFullSearch(query, nextPage); }} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">{locale==='ar' ? 'السابق' : 'Prev'}</button>
                            <div className="text-sm opacity-80">{fullPage}</div>
                            <button disabled={fullLoading} onClick={() => { const nextPage = fullPage + 1; performFullSearch(query, nextPage); }} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">{locale==='ar' ? 'التالي' : 'Next'}</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : hasQuery ? (
                  <div className="mt-3 space-y-2">
                    {loading && <div className="text-xs text-slate-500">{locale==='ar'? 'جاري التحميل...' : 'Loading...'}</div>}
                    {error && <div className="text-xs text-red-600">{error}</div>}
                    {!loading && !error && (results.products.length > 0 || results.categories.length > 0) && (
                      <div className="grid grid-cols-1 gap-3">
                        {results.categories.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">{locale==='ar'?'الفئات':'Categories'}</div>
                            <div className="flex flex-wrap gap-2">
                              {results.categories.map((c, idx) => (
                                <button key={c.slug || idx} className="px-3 py-1.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products?category=${encodeURIComponent(c.slug || c.id || '')}`); }}>
                                  {renderHighlighted(resolveLocalized(c.name, locale) || c.nameAr || c.nameEn || c.slug, query)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.brands && results.brands.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">{locale==='ar'?'العلامات التجارية':'Brands'}</div>
                            <div className="flex flex-wrap gap-2">
                              {results.brands.slice(0,6).map((b, idx) => (
                                <button key={b.id || b.slug || idx} className="px-3 py-1.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                                  onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products?brand=${encodeURIComponent(b.slug || b.id || '')}`); }}>
                                  {renderHighlighted(resolveLocalized(b.name, locale) || b.nameAr || b.nameEn || b.slug, query)}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.products.length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">{locale==='ar'?'منتجات':'Products'}</div>
                            <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                              {results.products.slice(0, 8).map((p) => (
                                <li key={p.id} className={`p-2 flex items-center gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800 cursor-pointer ${(flatSuggestions[focusedIndex]?.type === 'product' && flatSuggestions[focusedIndex]?.data?.id === p.id) ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`} onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}>
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    {p.image && <img src={p.image} alt={resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || ''} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[12px] font-semibold truncate">{renderHighlighted(resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || '', query)}</div>
                                    <div className="text-[11px] text-slate-500 flex gap-3">
                                      <span>{Number(p.price||0).toFixed(2)} ر.س</span>
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
                    {!loading && !error && results.products.length === 0 && results.categories.length === 0 && (
                      <div className="text-xs text-slate-500">{locale==='ar'?'لا توجد نتائج':'No results'}</div>
                    )}
                  </div>
                ) : showSuggestions ? (
                  <div className="mt-3 space-y-4" dir={dirClass}>
                    {/* Recent Searches */}
                    {recentSearches && recentSearches.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">{locale==='ar'?'عمليات بحث حديثة':'Recent Searches'}</div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((r) => (
                            <button key={r} className="px-3 py-1.5 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                              onClick={() => setQuery(r)}>{r}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Popular Categories */}
                    {popularCats && popularCats.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">{locale==='ar'?'تصنيفات شائعة':'Popular Categories'}</div>
                        <div className="flex flex-wrap gap-2">
                          {popularCats.map((c) => (
                            <button key={c.category} className="px-3 py-1.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                              onClick={() => { closeOverlay(); navigate(`/products?category=${encodeURIComponent(c.category)}`); }}>
                              {c.category} {c.count != null && <span className="opacity-60">({c.count})</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Recent Products */}
                    {recentProducts && recentProducts.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">{locale==='ar'?'منتجات حديثة':'Recent Products'}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {recentProducts.slice(0,6).map((p) => (
                            <button key={p.id} className="text-start"
                              onClick={() => { closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}>
                              <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                                {p.image && <img src={p.image} alt={resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || ''} className="w-full h-full object-cover" />}
                              </div>
                              <div className="mt-1 text-[11px] font-medium truncate">{resolveLocalized(p.name, locale) || p.nameAr || p.nameEn || ''}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Helper */}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {locale === 'ar' ? 'اكتب للبحث عن المنتجات' : 'Type to search products'}
                    </div>
                  </div>
                ) : null}

                {/* Note: quick suggestions are shown above when no query (handled in the ternary) */}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

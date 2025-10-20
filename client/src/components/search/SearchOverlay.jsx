import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function SearchOverlay() {
  const { locale, t } = (function () { try { return useLanguage(); } catch { return { locale: 'ar', t: (k) => k }; } })();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ products: [], categories: [] });
  const [popularCats, setPopularCats] = useState([]); // { category, count, items }
  const [recentProducts, setRecentProducts] = useState([]);
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
        categories: Array.isArray(data?.categories) ? data.categories : []
      });
    } catch (e) {
      setError(e?.message || 'Error');
    } finally { setLoading(false); }
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

  const onSubmit = useCallback((e) => {
    e?.preventDefault?.();
    const q = (query || '').trim();
    if (!q) return;
    saveRecentSearch(q);
    closeOverlay();
    // Navigate to products with q param to reuse Products page filtering
    navigate(`/products?q=${encodeURIComponent(q)}`);
  }, [query, closeOverlay, navigate, saveRecentSearch]);

  const sectionTitle = (key, fallback) => (t?.(key) || fallback);

  const dirClass = useMemo(() => dirRtl ? 'rtl' : 'ltr', [dirRtl]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-[1200]"
            onClick={closeOverlay}
          />
          <motion.aside
            key="search-sheet"
            dir={dirRtl ? 'rtl' : 'ltr'}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="fixed bottom-0 inset-x-0 z-[1201] bg-white dark:bg-slate-900 border-t dark:border-slate-800 rounded-t-2xl shadow-[0_-20px_40px_-20px_rgba(15,23,42,0.5)]"
            style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
            aria-modal="true"
            role="dialog"
            aria-label={(t && (t('search') || 'Search'))}
          >
            <div className="p-3 flex items-center justify-between gap-2 border-b dark:border-slate-800">
              <div className="text-sm font-semibold opacity-80">{(t && (t('search') || 'Search'))}</div>
              <button onClick={closeOverlay} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label={t?.('close') || 'Close'}>
                <X size={18} />
              </button>
            </div>
            <div className="p-3">
              <form onSubmit={onSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={(t && (t('searchPlaceholder') || 'Search...'))}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
                <button type="submit" className="absolute end-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-600 disabled:opacity-50" disabled={!query.trim()}>
                  {locale==='ar' ? 'بحث' : 'Search'}
                </button>
              </form>

              {/* Typeahead Results */}
              {hasQuery && (
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
                                onClick={() => { closeOverlay(); navigate(`/products?category=${encodeURIComponent(c.slug || c.id || '')}`); }}>
                                {c.nameAr || c.nameEn || c.name?.ar || c.name?.en || c.slug}
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
                              <li key={p.id} className="p-2 flex items-center gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800 cursor-pointer" onClick={() => { saveRecentSearch(query.trim()); closeOverlay(); navigate(`/products/${p.slug || p.id}`); }}>
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                  {p.image && <img src={p.image} alt={p.nameAr || p.nameEn || p.name?.ar || p.name?.en} className="w-full h-full object-cover" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[12px] font-semibold truncate">{p.nameAr || p.nameEn || p.name?.ar || p.name?.en}</div>
                                  <div className="text-[11px] text-slate-500 flex gap-3">
                                    <span>{Number(p.price||0).toFixed(2)} ر.س</span>
                                    {p.category && <span className="opacity-70">{p.category}</span>}
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
              )}

              {/* Quick Suggestions when no query */}
              {showSuggestions && (
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
                              {p.image && <img src={p.image} alt={p.nameAr || p.nameEn || p.name?.ar || p.name?.en} className="w-full h-full object-cover" />}
                            </div>
                            <div className="mt-1 text-[11px] font-medium truncate">{p.nameAr || p.nameEn || p.name?.ar || p.name?.en}</div>
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
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

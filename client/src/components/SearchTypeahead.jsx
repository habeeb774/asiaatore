import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api/client';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../stores/LanguageContext';

/**
 * Accessible typeahead search component.
 * Features:
 * - Debounced backend calls to /api/search/typeahead
 * - Shows grouped suggestions (Products / Categories)
 * - Keyboard navigation (Up/Down/Home/End/Enter/Escape)
 * - Maintains recent searches in localStorage (max 8)
 * - RTL friendly (matches existing Arabic UI)
 */
export default function SearchTypeahead({ autoFocus = true, onClose }) {
  const { locale } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ products: [], categories: [] });
  const [recent, setRecent] = useState(() => {
    try { const raw = localStorage.getItem('my_store_recent_searches'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // flattened list index
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  const flatItems = [];
  if (results.products.length) {
    flatItems.push({ type: 'header', label: 'منتجات' });
    results.products.forEach(p => flatItems.push({ type: 'product', item: p }));
  }
  if (results.categories.length) {
    flatItems.push({ type: 'header', label: 'فئات' });
    results.categories.forEach(c => flatItems.push({ type: 'category', item: c }));
  }
  if (!results.products.length && !results.categories.length && query && !loading && !error) {
    flatItems.push({ type: 'empty', label: 'لا توجد نتائج' });
  }

  const saveRecent = useCallback((q) => {
    if (!q) return;
    setRecent(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 8);
      try { localStorage.setItem('my_store_recent_searches', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const performSearch = useCallback(async (value) => {
    if (!value || value.trim().length < 2) { setResults({ products: [], categories: [] }); return; }
    setLoading(true); setError(null);
    try {
      const data = await api.searchTypeahead(value.trim());
      setResults({
        products: Array.isArray(data.products) ? data.products : [],
        categories: Array.isArray(data.categories) ? data.categories : []
      });
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  // Debounce query changes
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, performSearch]);

  useEffect(() => { if (autoFocus) setTimeout(() => inputRef.current?.focus(), 30); }, [autoFocus]);

  const reset = () => {
    setQuery(''); setResults({ products: [], categories: [] }); setActiveIndex(-1);
  };

  const executeNavigation = (item) => {
    if (!item) return;
    if (item.type === 'product') {
      saveRecent(query);
      onClose?.();
      navigate(`/products/${item.item.slug || item.item.id}`);
    } else if (item.type === 'category') {
      saveRecent(query);
      onClose?.();
      navigate(`/categories/${item.item.slug || item.item.id}`);
    }
  };

  const onKeyDown = (e) => {
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        let next = activeIndex + 1;
        while (next < flatItems.length && flatItems[next].type === 'header') next++;
        if (next >= flatItems.length) next = flatItems.length - 1;
        setActiveIndex(next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        let prev = activeIndex - 1;
        while (prev >= 0 && flatItems[prev].type === 'header') prev--;
        if (prev < 0) prev = -1;
        setActiveIndex(prev);
        break;
      }
      case 'Home': {
        e.preventDefault();
        const first = flatItems.findIndex(i => i.type !== 'header');
        setActiveIndex(first);
        break;
      }
      case 'End': {
        e.preventDefault();
        for (let i = flatItems.length - 1; i >= 0; i--) {
          if (flatItems[i].type !== 'header') { setActiveIndex(i); break; }
        }
        break;
      }
      case 'Enter': {
        if (activeIndex >= 0 && flatItems[activeIndex]) {
          e.preventDefault();
          executeNavigation(flatItems[activeIndex]);
        } else if (query.trim()) {
          saveRecent(query.trim());
          onClose?.();
          navigate(`/products?search=${encodeURIComponent(query.trim())}`);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        onClose?.();
        break;
      }
      default: break;
    }
  };

  const showRecent = !query && recent.length > 0;

  return (
    <div className="typeahead-wrapper relative w-full" onKeyDown={onKeyDown} dir="rtl">
      <div className="typeahead-control flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 focus-within:shadow-lg focus-within:border-emerald-300 dark:focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 dark:focus-within:ring-emerald-900/50">
        <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          placeholder={locale === 'ar' ? "ابحث عن المنتجات... (اكتب حرفين على الأقل)" : "Search products... (type at least 2 characters)"}
          aria-label={locale === 'ar' ? "بحث فوري" : "Quick search"}
          className="flex-1 border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={reset}
            aria-label={locale === 'ar' ? "مسح" : "Clear"}
            className="flex-shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            <X size={16} className="text-gray-400 dark:text-gray-500" />
          </button>
        )}
      </div>
      {open && (
        <div
          className="typeahead-popover absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label={locale === 'ar' ? "اقتراحات البحث" : "Search suggestions"}
          ref={listRef}
        >
          {loading && (
            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </div>
          )}
          {error && (
            <div className="px-4 py-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg mx-2 my-2">
              {error}
            </div>
          )}
          {showRecent && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {locale === 'ar' ? 'عمليات بحث حديثة' : 'Recent searches'}
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setQuery(r); setOpen(true); performSearch(r); }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!showRecent && flatItems.map((it, idx) => {
            if (it.type === 'header') {
              return (
                <div key={idx} className="px-4 py-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600">
                  {it.label}
                </div>
              );
            }
            if (it.type === 'empty') {
              return (
                <div key={idx} className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                  {it.label}
                </div>
              );
            }
            const isActive = idx === activeIndex;
            const common = {
              key: (it.item?.id || idx),
              role:'option',
              'aria-selected': isActive,
              onMouseEnter: () => setActiveIndex(idx),
              onClick: () => executeNavigation(it)
            };
            return (
              <div
                {...common}
                className={`cursor-pointer flex items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 border-r-2 border-emerald-500' : ''
                }`}
              >
                {it.type === 'product' && (
                  <>
                    <div className="w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-sm">
                      {it.item.image ? (
                        <img
                          src={it.item.image}
                          alt={it.item.nameAr || it.item.nameEn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {it.item.nameAr || it.item.nameEn}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {(it.item.price || 0).toFixed(2)} {locale === 'ar' ? 'ر.س' : 'SAR'}
                        </span>
                        {it.item.category && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="truncate">{it.item.category}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </>
                )}
                {it.type === 'category' && (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {it.item.nameAr || it.item.nameEn}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

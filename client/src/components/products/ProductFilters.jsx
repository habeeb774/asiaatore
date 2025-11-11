import React from 'react';
import { useLanguage } from '../../stores/LanguageContext';
import { ChevronDown, RefreshCw } from 'lucide-react';

const ProductFilters = ({ state, onChange, sidebar = false }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const update = (patch) => onChange({ ...state, ...patch });
  // Keep current category (selected from page top) — do not reset it here
  const reset = () => onChange({ ...state, sort: 'new', min: '', max: '', rating: '', discount: false });

  // Exclude category from "active" since category is controlled by the top page navigation
  const hasActive = !!(state.min || state.max || state.rating || state.discount);

  const wrapperClass = sidebar
    ? 'grid grid-cols-1 gap-2 md:gap-2.5 sticky top-30'
    : 'w-full';

  return (
    <div className={"product-filters " + wrapperClass}>
      {/* Header row with Reset (sidebar mode) */}
      {sidebar && (
        <div className="flex items-center justify-between mb-0.5">
          <div className="text-xs text-slate-500">
            {isAr ? 'تصفية النتائج' : 'Filter results'}{hasActive ? (
              <span className="ms-1 inline-block rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {isAr ? 'مفعّل' : 'Active'}
              </span>
            ) : null}
          </div>
          <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800">
            <RefreshCw className="size-3" /> {isAr ? 'إعادة ضبط' : 'Reset'}
          </button>
        </div>
      )}

      {/* Category filter removed; category selection is controlled by page-level UI */}

      {/* Toolbar (compact) for non-sidebar */}
      {!sidebar && (
        <div
          role="toolbar"
          aria-label={isAr ? 'شريط تصفية المنتجات' : 'Products filter toolbar'}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/70"
        >
          {/* Sort */}
          <div className="flex items-center gap-1">
            <label htmlFor="sort" className="sr-only">{isAr ? 'الترتيب' : 'Sort'}</label>
            <select
              id="sort"
              value={state.sort}
              onChange={(e) => update({ sort: e.target.value })}
              className="h-8 min-w-[8rem] rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="new">{isAr ? 'الأحدث' : 'Newest'}</option>
              <option value="price-asc">{isAr ? 'السعر ↑' : 'Price ↑'}</option>
              <option value="price-desc">{isAr ? 'السعر ↓' : 'Price ↓'}</option>
            </select>
          </div>

          {/* Price min/max */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-600">{isAr ? 'السعر' : 'Price'}</span>
            <input
              type="number"
              min="0"
              value={state.min || ''}
              onChange={(e) => update({ min: e.target.value })}
              placeholder={isAr ? 'من' : 'Min'}
              className="h-8 w-24 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-sky-500"
              inputMode="numeric"
            />
            <span className="text-[11px] text-slate-500">{isAr ? 'إلى' : 'to'}</span>
            <input
              type="number"
              min="0"
              value={state.max || ''}
              onChange={(e) => update({ max: e.target.value })}
              placeholder={isAr ? 'أقصى' : 'Max'}
              className="h-8 w-24 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-sky-500"
              inputMode="numeric"
            />
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <label htmlFor="rating" className="sr-only">{isAr ? 'التقييم' : 'Rating'}</label>
            <select
              id="rating"
              value={state.rating || ''}
              onChange={(e) => update({ rating: e.target.value })}
              className="h-8 min-w-[7rem] rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="">{isAr ? 'الكل' : 'All'}</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {isAr ? `على الأقل ${r}` : `≥ ${r}`}
                </option>
              ))}
            </select>
          </div>

          {/* Discount */}
          <label className="ms-auto inline-flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-800">
            <span>{isAr ? 'خصم' : 'Discount'}</span>
            <span className="inline-flex items-center gap-2">
              <input
                id="discount"
                type="checkbox"
                checked={!!state.discount}
                onChange={(e) => update({ discount: e.target.checked })}
                className="peer sr-only"
              />
              <span className="block h-4 w-8 rounded-full bg-slate-300 peer-checked:bg-sky-600 transition-colors">
                <span className="block h-3.5 w-3.5 translate-x-0.5 translate-y-0.5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[14px]" />
              </span>
            </span>
          </label>

          {/* Reset */}
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw className="size-3.5" /> {isAr ? 'إعادة ضبط' : 'Reset'}
          </button>
        </div>
      )}

      {/* Original stacked filters for sidebar mode */}
      {sidebar && (
        <>
          {/* Sort */}
          <details className="group rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm open:shadow" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-800">
              <span>{isAr ? 'الترتيب' : 'Sort'}</span>
              <ChevronDown className="size-1.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2">
              <select
                id="sort"
                value={state.sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="new">{isAr ? 'الأحدث' : 'Newest'}</option>
                <option value="price-asc">{isAr ? 'السعر ↑' : 'Price ↑'}</option>
                <option value="price-desc">{isAr ? 'السعر ↓' : 'Price ↓'}</option>
              </select>
            </div>
          </details>

          {/* Price */}
          <details className="group rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm open:shadow" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-800">
              <span>{isAr ? 'السعر' : 'Price'}</span>
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500">{isAr ? 'من' : 'Min'}</label>
                <input
                  type="number"
                  min="0"
                  value={state.min || ''}
                  onChange={(e) => update({ min: e.target.value })}
                  placeholder={isAr ? 'أدنى' : 'Min'}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-500">{isAr ? 'إلى' : 'Max'}</label>
                <input
                  type="number"
                  min="0"
                  value={state.max || ''}
                  onChange={(e) => update({ max: e.target.value })}
                  placeholder={isAr ? 'أقصى' : 'Max'}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  inputMode="numeric"
                />
              </div>
            </div>
          </details>

          {/* Rating */}
          <details className="group rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm open:shadow">
            <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-slate-800">
              <span>{isAr ? 'التقييم' : 'Rating'}</span>
              <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-2">
              <select
                value={state.rating || ''}
                onChange={(e) => update({ rating: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
              >
                <option value="">{isAr ? 'الكل' : 'All'}</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {isAr ? `على الأقل ${r}` : `≥ ${r}`}
                  </option>
                ))}
              </select>
            </div>
          </details>

          {/* Discount toggle */}
          <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
            <label className="flex items-center justify-between gap-2 text-xs text-slate-800">
              <span>{isAr ? 'خصم' : 'Discount'}</span>
              <span className="inline-flex items-center gap-2">
                <input
                  id="discount"
                  type="checkbox"
                  checked={!!state.discount}
                  onChange={(e) => update({ discount: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="block h-4 w-8 rounded-full bg-slate-300 peer-checked:bg-sky-600 transition-colors">
                  <span className="block h-3.5 w-3.5 translate-x-0.5 translate-y-0.5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[14px]" />
                </span>
              </span>
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductFilters;

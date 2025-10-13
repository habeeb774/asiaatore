import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Coffee, CupSoda, Cookie, Utensils, Store as StoreIcon, Tag, Candy } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const scrollShadows = 'after:content-[" "] after:absolute after:top-0 after:right-0 after:w-8 after:h-full after:pointer-events-none after:bg-gradient-to-l after:from-white after:to-transparent';

const CategoryChips = () => {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const { locale } = useLanguage();
  const baseProductsPath = locale === 'en' ? '/en/products' : (locale === 'fr' ? '/fr/products' : '/products');
  const [showAll, setShowAll] = useState(false);
  const MAX_DEFAULT = 10;

  useEffect(() => {
    setLoading(true);
    // Try to hydrate from cache first for instant UI
    try {
      const cached = localStorage.getItem('cats_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setCats(parsed);
      }
    } catch {}
    api.listCategories({ withCounts: 1 }).then(r => {
      if (r?.categories) {
        setCats(r.categories);
        try { localStorage.setItem('cats_cache', JSON.stringify(r.categories)); } catch {}
      }
    }).catch(e => setError(e.message)).finally(()=> setLoading(false));
  }, []);

  // Deduplicate categories by slug > id > Arabic name
  const uniqueCats = useMemo(() => {
    const m = new Map();
    for (const c of cats) {
      const key = c.slug || c.id || c.name?.ar || c.name?.en || JSON.stringify(c);
      if (!m.has(key)) m.set(key, c);
    }
    const arr = Array.from(m.values());
    // Sort: categories with counts first, then name
    arr.sort((a,b)=> (b.productCount||0) - (a.productCount||0) || (a.name?.ar||'').localeCompare(b.name?.ar||'', 'ar'));
    return arr;
  }, [cats]);

  if (loading) return <div className="text-xs opacity-60 px-4 py-2">تحميل الفئات...</div>;
  if (error) return <div className="text-xs text-red-600 px-4 py-2">خطأ الفئات</div>;
  if (!uniqueCats.length) return null;
  const displayed = showAll ? uniqueCats : uniqueCats.slice(0, MAX_DEFAULT);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.8) * (dir === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative" role="navigation" aria-label="تصنيفات">
      {/* Scroll arrows */}
      <button type="button" aria-label="Scroll right" onClick={()=>scrollBy('right')} className="absolute left-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/85 shadow hover:bg-white p-1 hidden sm:inline-flex">
        <ChevronRight size={18} />
      </button>
      <button type="button" aria-label="Scroll left" onClick={()=>scrollBy('left')} className="absolute right-1 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/85 shadow hover:bg-white p-1 hidden sm:inline-flex">
        <ChevronLeft size={18} />
      </button>
      <div ref={trackRef} className={`flex gap-4 overflow-x-auto pb-2 px-2 snap-x snap-mandatory ${scrollShadows}`} dir="rtl">
        {displayed.map(c => {
          const qsCat = new URLSearchParams(location.search).get('category');
          const active = (qsCat === c.slug) || location.pathname.includes(`/category/${c.slug}`);
          const n = (c?.name?.ar || c?.name?.en || c?.slug || '').toLowerCase();
          const pickIcon = () => {
            // If backend provides an explicit icon key, map common names
            const key = (c.icon || '').toLowerCase().trim();
            switch (key) {
              case 'cup-soda':
              case 'soda':
              case 'drink':
              case 'drinks':
                return CupSoda;
              case 'coffee':
              case 'tea':
                return Coffee;
              case 'cookie':
              case 'cookies':
              case 'biscuit':
              case 'biscuits':
                return Cookie;
              case 'candy':
              case 'sugar':
                return Candy;
              case 'utensils':
              case 'pasta':
              case 'rice':
                return Utensils;
              case 'store':
              case 'supermarket':
                return StoreIcon;
              case 'tag':
                return Tag;
            }
            if (/(ماء|مشروب|مشروبات|drinks?|beverages?|water)/.test(n)) return CupSoda;
            if (/(شاي|قهوة|coffee|tea)/.test(n)) return Coffee;
            if (/(بسكويت|كوكي|كوكيز|biscuits?|cookies?)/.test(n)) return Cookie;
            if (/(سكر|sugar)/.test(n)) return Candy;
            if (/(مكرونة|معكرونة|أرز|ارز|pasta|rice)/.test(n)) return Utensils;
            if (/(صلصات|مخللات|sauces?|pickles?)/.test(n)) return Utensils;
            if (/(سوبرماركت|supermarket)/.test(n)) return StoreIcon;
            return Tag;
          };
          const Icon = pickIcon();
          return (
            <button
              key={c.id || c.slug}
              type="button"
              onClick={() => navigate(`${baseProductsPath}?category=${encodeURIComponent(c.slug)}&page=1`)}
              className={`group flex flex-col items-center justify-start gap-2 w-[120px] shrink-0 snap-start text-center`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`relative grid place-items-center rounded-full bg-gray-100 shadow-sm transition-all ${active ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-white' : ''}`}
                style={{ width: 120, height: 120 }}
                aria-hidden="true"
              >
                {c.image ? (
                  <img src={c.image} alt="" style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
                ) : (
                  <Icon size={34} className={`${active ? 'text-[var(--color-primary)]' : 'text-gray-500'}`} />
                )}
              </span>
              <span className={`font-bold leading-tight ${active ? 'text-[var(--color-primary)]' : 'text-slate-800'}`} style={{ fontSize: '.95rem' }}>
                {c.name?.ar || c.name?.en || c.slug}
              </span>
              {typeof c.productCount === 'number' && c.productCount > 0 && (
                <span className={`text-xs ${active ? 'text-slate-500' : 'text-slate-500'}`}>{c.productCount}</span>
              )}
            </button>
          );
        })}
        {uniqueCats.length > MAX_DEFAULT && (
          <button
            type="button"
            onClick={() => setShowAll(s => !s)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors flex items-center gap-2 snap-start ${showAll ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
          >
            {showAll ? (locale==='ar' ? 'إخفاء' : 'Hide') : (locale==='ar' ? 'عرض المزيد' : 'Show more')}
          </button>
        )}
      </div>
    </div>
  );
};

export default CategoryChips;

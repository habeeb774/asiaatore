import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';
import { ChevronLeft, ChevronRight, Coffee, CupSoda, Cookie, Utensils, Store as StoreIcon, Tag, Candy } from 'lucide-react';

const CategoryScroller = () => {
  const { locale } = useLanguage();
  const { pathname, search } = useLocation();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const trackRef = useRef(null);
  const [showAll, setShowAll] = useState(false);
  const MAX_DEFAULT = 12;

  useEffect(() => {
    setLoading(true);
    try {
      const cached = localStorage.getItem('cats_cache');
      const ts = Number(localStorage.getItem('cats_cache_ts') || 0);
      const fresh = Date.now() - ts < 60 * 60 * 1000; // 1h TTL
      if (cached && fresh) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setCats(parsed);
      }
    } catch {}
    api.listCategories({ withCounts: 1 }).then(r => {
      if (r?.categories) {
        setCats(r.categories);
        try {
          localStorage.setItem('cats_cache', JSON.stringify(r.categories));
          localStorage.setItem('cats_cache_ts', String(Date.now()));
        } catch {}
      }
    }).catch(e => setError(e.message)).finally(()=> setLoading(false));
  }, []);

  const uniqueCats = useMemo(() => {
    const m = new Map();
    for (const c of cats) {
      const key = c.slug || c.id || c.name?.ar || c.name?.en || JSON.stringify(c);
      if (!m.has(key)) m.set(key, c);
    }
    const arr = Array.from(m.values());
    arr.sort((a,b)=> (b.productCount||0) - (a.productCount||0) || (a.name?.ar||'').localeCompare(b.name?.ar||'', 'ar'));
    return arr;
  }, [cats]);

  const activeSlug = useMemo(() => {
    const m = new URLSearchParams(search).get('category');
    if (m) return m;
    const parts = pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => p === 'category');
    return idx >= 0 ? parts[idx+1] : null;
  }, [pathname, search]);

  const baseCatalogPath = (locale === 'en') ? '/en/catalog' : '/catalog';

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.8) * (dir === 'left' ? -1 : 1);
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="category-scroller" role="navigation" aria-label={locale==='ar'?'الأقسام':'Categories'}>
      {/* Arrows */}
      <button type="button" aria-label="Scroll right" onClick={()=>scrollBy('right')} className="absolute left-2 top-[calc(var(--header-height,72px)+10px)] z-10 rounded-full bg-white/85 shadow hover:bg-white p-1 hidden md:inline-flex">
        <ChevronRight size={18} />
      </button>
      <button type="button" aria-label="Scroll left" onClick={()=>scrollBy('left')} className="absolute right-2 top-[calc(var(--header-height,72px)+10px)] z-10 rounded-full bg-white/85 shadow hover:bg-white p-1 hidden md:inline-flex">
        <ChevronLeft size={18} />
      </button>
      <div ref={trackRef} className="category-track">
        {loading && <span className="text-xs opacity-70 px-2">…</span>}
        {error && <span className="text-xs text-red-600 px-2">خطأ</span>}
        {!loading && (showAll ? uniqueCats : uniqueCats.slice(0, MAX_DEFAULT)).map(c => {
          const active = activeSlug && activeSlug === c.slug;
          const n = (c?.name?.ar || c?.name?.en || c?.slug || '').toLowerCase();
          const pickIcon = () => {
            const key = (c.icon || '').toLowerCase().trim();
            switch (key) {
              case 'cup-soda': case 'soda': case 'drink': case 'drinks': return CupSoda;
              case 'coffee': case 'tea': return Coffee;
              case 'cookie': case 'cookies': case 'biscuit': case 'biscuits': return Cookie;
              case 'candy': case 'sugar': return Candy;
              case 'utensils': case 'pasta': case 'rice': return Utensils;
              case 'store': case 'supermarket': return StoreIcon;
              case 'tag': return Tag;
            }
            if (/(ماء|مشروب|مشروبات|drinks?|beverages?|water)/.test(n)) return CupSoda;
            if (/(شاي|قهوة|coffee|tea)/.test(n)) return Coffee;
            if (/(بسكويت|كوكي|كوكيز|biscuits?|cookies?)/.test(n)) return Cookie;
            if (/(سكر|sugar)/.test(n)) return Candy;
            if (/(مكرونة|معكرونة|أرز|ارز|pasta|rice)/.test(n)) return Utensils;
            if (/(صلصات|مخللات|sauces?|pickles?)/.test(n)) return Utensils;
            if (/(سوبرماركت|supermarket)/.test(n)) return StoreIcon;
            return null;
          };
          const Icon = pickIcon();
          return (
            <Link key={c.id || c.slug} to={`${baseCatalogPath}?category=${encodeURIComponent(c.slug)}`} className={`cat-pill ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              {Icon && <Icon size={14} className="opacity-70" />}
              <span>{locale==='ar' ? (c.name?.ar || c.slug) : (c.name?.en || c.slug)}</span>
              {typeof c.productCount === 'number' && c.productCount > 0 && <span className="count">{c.productCount}</span>}
            </Link>
          );
        })}
        {uniqueCats.length > MAX_DEFAULT && (
          <button type="button" onClick={()=>setShowAll(s=>!s)} className="cat-pill">
            {showAll ? (locale==='ar' ? 'إخفاء' : 'Hide') : (locale==='ar' ? 'عرض المزيد' : 'Show more')}
          </button>
        )}
      </div>
    </div>
  );
};
export default CategoryScroller;

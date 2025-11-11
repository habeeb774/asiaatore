import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../stores/LanguageContext';
import api from '../../services/api/client';
import { ChevronLeft, ChevronRight, Coffee, CupSoda, Cookie, Utensils, Store as StoreIcon, Tag, Candy, Apple, Beef, Milk, Sparkles, ShoppingBag, Package, Truck, Car, Home, Wrench, Droplets, Zap, Heart, Star, Gift, Percent } from 'lucide-react';

const CategoryScroller = () => {
  const { locale } = useLanguage();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const trackRef = useRef(null);
  const [showAll, setShowAll] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ down:false, startX:0, scrollLeft:0, moved:false });
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

  // Drag-to-scroll (mouse & touch)
  const onDragStart = (clientX) => {
    const el = trackRef.current; if (!el) return;
    dragState.current = { down:true, startX: clientX, scrollLeft: el.scrollLeft, moved:false };
    setDragging(true);
    el.dataset.dragging = '1';
  };
  const onDragMove = (clientX) => {
    const el = trackRef.current; if (!el) return;
    if (!dragState.current.down) return;
    const dx = clientX - dragState.current.startX;
    if (Math.abs(dx) > 4) dragState.current.moved = true;
    el.scrollLeft = dragState.current.scrollLeft - dx;
  };
  const onDragEnd = () => {
    const el = trackRef.current; if (el) { delete el.dataset.dragging; }
    dragState.current.down = false; setDragging(false);
  };
  const handleMouseDown = (e) => { if (e.button !== 0) return; onDragStart(e.clientX); };
  const handleMouseMove = (e) => { if (!dragState.current.down) return; e.preventDefault(); onDragMove(e.clientX); };
  const handleMouseUp = () => onDragEnd();
  const handleMouseLeave = () => onDragEnd();
  const handleTouchStart = (e) => { const t = e.touches?.[0]; if (!t) return; onDragStart(t.clientX); };
  const handleTouchMove = (e) => { const t = e.touches?.[0]; if (!t) return; onDragMove(t.clientX); };
  const handleTouchEnd = () => onDragEnd();
  const handleWheel = (e) => {
    const el = trackRef.current; if (!el) return;
    // Convert vertical wheel to horizontal scroll for better UX
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollBy({ left: e.deltaY, behavior: 'auto' });
      e.preventDefault();
    }
  };

  // Keyboard navigation between pills for accessibility
  const handlePillKeyDown = (e) => {
    const { key } = e;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    const container = trackRef.current;
    if (!container) return;
    const pills = Array.from(container.querySelectorAll('button.cat-pill'));
    const idx = pills.indexOf(e.currentTarget);
    if (idx < 0) return;
    e.preventDefault();
    let nextIdx = idx;
    if (key === 'ArrowLeft') nextIdx = Math.max(0, idx - 1);
    if (key === 'ArrowRight') nextIdx = Math.min(pills.length - 1, idx + 1);
    if (key === 'Home') nextIdx = 0;
    if (key === 'End') nextIdx = pills.length - 1;
    const nextEl = pills[nextIdx];
    if (nextEl) {
      nextEl.focus();
      // ensure visible
      nextEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  };

  return (
    <div className="category-scroller" role="navigation" aria-label={locale==='ar'?'الأقسام':'Categories'}>
      {/* Arrows */}
      <button type="button" aria-label="Scroll right" onClick={()=>scrollBy('right')} className="cat-arrow absolute left-2 top-[calc(var(--header-height,72px)+10px)] z-10 hidden md:inline-flex" data-dir="right">
        <ChevronRight size={18} />
      </button>
      <button type="button" aria-label="Scroll left" onClick={()=>scrollBy('left')} className="cat-arrow absolute right-2 top-[calc(var(--header-height,72px)+10px)] z-10 hidden md:inline-flex" data-dir="left">
        <ChevronLeft size={18} />
      </button>
      <div
        ref={trackRef}
        className={`category-track${dragging ? ' is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
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
              case 'apple': case 'fruit': case 'fruits': return Apple;
              case 'beef': case 'meat': case 'chicken': return Beef;
              case 'milk': case 'dairy': return Milk;
              case 'sparkles': case 'offers': case 'deals': return Sparkles;
              case 'shopping-bag': case 'bag': return ShoppingBag;
              case 'package': return Package;
              case 'truck': case 'delivery': return Truck;
              case 'car': return Car;
              case 'home': case 'household': return Home;
              case 'wrench': case 'tools': return Wrench;
              case 'droplets': case 'cleaning': case 'detergent': return Droplets;
              case 'zap': case 'energy': case 'electronics': return Zap;
              case 'heart': case 'health': return Heart;
              case 'star': case 'premium': return Star;
              case 'gift': return Gift;
              case 'percent': case 'discount': return Percent;
            }
            // Enhanced regex patterns for Arabic and English category names
            if (/(ماء|مشروب|مشروبات|drinks?|beverages?|water)/.test(n)) return CupSoda;
            if (/(شاي|قهوة|coffee|tea)/.test(n)) return Coffee;
            if (/(بسكويت|كوكي|كوكيز|biscuits?|cookies?)/.test(n)) return Cookie;
            if (/(سكر|candy|sugar)/.test(n)) return Candy;
            if (/(مكرونة|معكرونة|أرز|ارز|pasta|rice)/.test(n)) return Utensils;
            if (/(صلصات|مخللات|sauces?|pickles?)/.test(n)) return Utensils;
            if (/(سوبرماركت|supermarket)/.test(n)) return StoreIcon;
            // Food products - منتجات غذائية
            if (/(غذائي|طعام|food|foods|منتجات غذائية|خضار|فواكه|vegetables?|fruits?|meat|لحم|دجاج|chicken|beef|dairy|حليب|cheese|جبن)/.test(n)) return Apple;
            // Cleaning products - منظفات
            if (/(منظف|تنظيف|cleaning|detergent|soap|صابون|bleach|تبييض|disinfectant|مطهر)/.test(n)) return Droplets;
            // Offers - عروض
            if (/(عروض|خصومات|offers?|deals?|discounts?|promotions?|تخفيضات|sales?)/.test(n)) return Sparkles;
            // Household items
            if (/(منزلي|household|kitchen|مطبخ|bathroom|حمام|toilet|مرحاض)/.test(n)) return Home;
            // Electronics and appliances
            if (/(كهربائي|إلكتروني|electronics?|appliances?|devices?)/.test(n)) return Zap;
            // Health and beauty
            if (/(صحة|جمال|health|beauty|cosmetics?|perfume|عطر|skincare|عناية)/.test(n)) return Heart;
            // Baby products
            if (/(طفل|رضع|baby|infant|diaper|حفاضات)/.test(n)) return Heart;
            return null;
          };
          const Icon = pickIcon();
          const onPick = (slug) => {
            // Avoid triggering click after a drag interaction
            if (trackRef.current?.dataset?.dragging === '1' || dragState.current.moved) return;
            // Update current page query params in-place (no route change to catalog)
            const params = new URLSearchParams(search || '');
            params.set('category', slug);
            // Reset pagination on category change
            params.set('page', '1');
            const qs = params.toString();
            navigate(`${pathname}${qs ? `?${qs}` : ''}`, { replace: false });
          };
          return (
            <button
              key={c.id || c.slug}
              type="button"
              onClick={() => onPick(c.slug)}
              className={`cat-pill ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onKeyDown={handlePillKeyDown}
            >
              {Icon && <Icon size={14} className="opacity-70" />}
              <span>{locale==='ar' ? (c.name?.ar || c.slug) : (c.name?.en || c.slug)}</span>
              {typeof c.productCount === 'number' && c.productCount > 0 && <span className="count">{c.productCount}</span>}
            </button>
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

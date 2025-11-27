import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api/client';
import { Coffee, CupSoda, Cookie, Utensils, Store as StoreIcon, Tag, Candy, Apple, Beef, Milk, Sparkles, ShoppingBag, Package, Truck, Car, Home, Wrench, Droplets, Zap, Heart, Star, Gift, Percent } from 'lucide-react';

const CategoryScroller = () => {
  const { locale } = useLanguage();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const trackRef = useRef(null);

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

  const catCount = uniqueCats.length;

  const activeSlug = useMemo(() => {
    const m = new URLSearchParams(search).get('category');
    if (m) return m;
    const parts = pathname.split('/').filter(Boolean);
    const idx = parts.findIndex(p => p === 'category');
    return idx >= 0 ? parts[idx+1] : null;
  }, [pathname, search]);

  const rows = 1;

  const baseCycle = useMemo(() => {
    if (!catCount) return [];
    const sorted = uniqueCats.slice();
    return sorted;
  }, [uniqueCats, catCount]);

  const primaryCycle = useMemo(() => {
    if (!baseCycle.length) return [];
    const minItems = Math.max(rows * 6, baseCycle.length);
    let extended = baseCycle.slice();
    while (extended.length < minItems) {
      extended = extended.concat(baseCycle);
      if (extended.length > baseCycle.length * 6) break;
    }
    return extended;
  }, [baseCycle, rows]);

  const marqueeCats = useMemo(() => {
    if (!primaryCycle.length) return [];
    return primaryCycle.concat(primaryCycle);
  }, [primaryCycle]);
  const primaryLength = primaryCycle.length;
  const columns = Math.max(1, Math.ceil((primaryLength || 1) / rows));

  const [cycleWidth, setCycleWidth] = useState(0);
  const cycleWidthRef = useRef(0);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el || !marqueeCats.length) {
      cycleWidthRef.current = 0;
      setCycleWidth(0);
      return () => {};
    }

    const measure = () => {
      if (!el) return;
      const width = el.scrollWidth ? el.scrollWidth / 2 : 0;
      if (!width && cycleWidthRef.current !== 0) {
        cycleWidthRef.current = 0;
        setCycleWidth(0);
      } else if (width && Math.abs(width - cycleWidthRef.current) > 4) {
        cycleWidthRef.current = width;
        setCycleWidth(width);
      }
    };

    measure();

    let ro;
    try {
      if (typeof ResizeObserver === 'function') {
        ro = new ResizeObserver(() => measure());
        ro.observe(el);
      } else {
        const id = setInterval(measure, 5000);
        ro = { disconnect: () => clearInterval(id) };
      }
    } catch {
      const id = setInterval(measure, 5000);
      ro = { disconnect: () => clearInterval(id) };
    }

    return () => {
      try { ro?.disconnect?.(); } catch {}
    };
  }, [marqueeCats.length]);

  const marqueeDuration = useMemo(() => {
    if (cycleWidth > 0) {
      const seconds = Math.min(80, Math.max(24, cycleWidth / 70));
      return `${seconds}s`;
    }
    const seconds = Math.min(70, Math.max(22, columns * 3.5));
    return `${seconds}s`;
  }, [columns, cycleWidth]);

  const trackStyle = useMemo(() => ({
    '--category-rows': rows,
    '--category-marquee-duration': marqueeDuration,
    '--category-columns': columns,
    ...(cycleWidth > 0 ? { '--category-marquee-distance': `${cycleWidth}px` } : {}),
  }), [rows, marqueeDuration, columns, cycleWidth]);

  // Keyboard navigation between pills for accessibility
  const handlePillKeyDown = (e) => {
    const { key } = e;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    const container = trackRef.current;
    if (!container) return;
    const pills = Array.from(container.querySelectorAll('button.cat-pill[data-cycle="primary"]'));
    if (!pills.length) return;
    const slug = e.currentTarget?.dataset?.slug;
    let idx = pills.indexOf(e.currentTarget);
    if (idx < 0 && slug) {
      idx = pills.findIndex((btn) => btn.dataset.slug === slug);
    }
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
      <div
        ref={trackRef}
        className="category-track"
        style={trackStyle}
        data-animate={marqueeCats.length > primaryLength && cycleWidth > 0 ? 'true' : undefined}
        data-rows={rows}
      >
        {loading && !marqueeCats.length && <span className="category-track__status">{locale === 'ar' ? 'جاري التحميل…' : 'Loading…'}</span>}
        {error && !marqueeCats.length && <span className="category-track__status category-track__status--error">{locale === 'ar' ? 'تعذّر تحميل الفئات' : 'Failed to load categories'}</span>}
        {!loading && marqueeCats.map((c, idx) => {
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
            if (!slug) return;
            // Update current page query params in-place (no route change to catalog)
            const params = new URLSearchParams(search || '');
            params.set('category', slug);
            // Reset pagination on category change
            params.set('page', '1');
            const qs = params.toString();
            navigate(`${pathname}${qs ? `?${qs}` : ''}`, { replace: false });
          };
          const isClone = idx >= primaryLength;
          const slug = c.slug || c.id || `${idx}`;
          return (
            <button
              key={`${slug}-${idx}`}
              type="button"
              onClick={() => onPick(c.slug)}
              className={`cat-pill ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onKeyDown={handlePillKeyDown}
              data-cycle={isClone ? 'clone' : 'primary'}
              data-slug={slug}
              tabIndex={isClone ? -1 : undefined}
              aria-hidden={isClone ? true : undefined}
            >
              {Icon && <Icon size={14} className="opacity-70" />}
              <span>{locale==='ar' ? (c.name?.ar || c.slug) : (c.name?.en || c.slug)}</span>
              {typeof c.productCount === 'number' && c.productCount > 0 && <span className="count">{c.productCount}</span>}
            </button>
          );
        })}
        {!loading && !marqueeCats.length && !error && (
          <span className="category-track__status">{locale === 'ar' ? 'لا توجد فئات متاحة' : 'No categories available'}</span>
        )}
      </div>
    </div>
  );
};
export default CategoryScroller;

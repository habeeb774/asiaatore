import React, { useEffect, useMemo, useRef, useState } from 'react';
import useCategories from '../hooks/useCategories';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Coffee, CupSoda, Cookie, Utensils, Store as StoreIcon, Tag, Candy, Apple, Beef, Milk, Sparkles, ShoppingBag, Package, Truck, Car, Home, Wrench, Droplets, Zap, Heart, Star, Gift, Percent } from 'lucide-react';
import { useLanguage } from '../stores/LanguageContext';
import { Chip } from './ui/Chip';

const scrollShadows = 'after:content-[" "] after:absolute after:top-0 after:right-0 after:w-8 after:h-full after:pointer-events-none after:bg-gradient-to-l after:from-white after:to-transparent';

const CategoryChips = () => {
  const [cats, setCats] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const { locale } = useLanguage();
  const baseProductsPath = locale === 'en' ? '/en/products' : (locale === 'fr' ? '/fr/products' : '/products');
  const [showAll, setShowAll] = useState(false);
  const MAX_DEFAULT = 10;

  // Use React Query hook for categories with caching
  const { data: categories = [], isLoading: loading, error } = useCategories({ withCounts: 1 });

  // Sync categories to local state and cache in localStorage
  useEffect(() => {
    if (Array.isArray(categories) && categories.length > 0) {
      setCats(categories);
      try { localStorage.setItem('cats_cache', JSON.stringify(categories)); } catch {}
    }
  }, [categories]);

  // Try to hydrate from cache first for instant UI
  useEffect(() => {
    try {
      const cached = localStorage.getItem('cats_cache');
      if (cached && !cats.length) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setCats(parsed);
      }
    } catch {}
  }, [cats.length]);

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
      <div ref={trackRef} className={`flex gap-3 overflow-x-auto pb-2 px-2 snap-x snap-mandatory mobile-gutters hide-scrollbar ${scrollShadows}`} dir="rtl">
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
              case 'apple':
              case 'fruit':
              case 'fruits':
                return Apple;
              case 'beef':
              case 'meat':
              case 'chicken':
                return Beef;
              case 'milk':
              case 'dairy':
                return Milk;
              case 'sparkles':
              case 'offers':
              case 'deals':
                return Sparkles;
              case 'shopping-bag':
              case 'bag':
                return ShoppingBag;
              case 'package':
                return Package;
              case 'truck':
              case 'delivery':
                return Truck;
              case 'car':
                return Car;
              case 'home':
              case 'household':
                return Home;
              case 'wrench':
              case 'tools':
                return Wrench;
              case 'droplets':
              case 'cleaning':
              case 'detergent':
                return Droplets;
              case 'zap':
              case 'energy':
              case 'electronics':
                return Zap;
              case 'heart':
              case 'health':
                return Heart;
              case 'star':
              case 'premium':
                return Star;
              case 'gift':
                return Gift;
              case 'percent':
              case 'discount':
                return Percent;
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
            // Default fallback
            return Tag;
          };
          const Icon = pickIcon();
          const label = c.name?.ar || c.name?.en || c.slug;
          return (
            <Chip
              key={c.id || c.slug}
              className="snap-start shrink-0"
              variant={active ? 'primary' : 'outline'}
              size="lg"
              selected={active}
              onClick={() => navigate(`${baseProductsPath}?category=${encodeURIComponent(c.slug)}&page=1`)}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden="true" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                {c.image ? (
                  <img src={c.image} alt="" style={{ width: 20, height: 20, objectFit:'contain' }} />
                ) : (
                  <Icon size={18} />
                )}
                <span>{label}</span>
                {typeof c.productCount === 'number' && c.productCount > 0 && (
                  <span style={{ fontSize: '.72rem', opacity: .75 }}>({c.productCount})</span>
                )}
              </span>
            </Chip>
          );
        })}
        {uniqueCats.length > MAX_DEFAULT && (
          <Chip
            type="button"
            onClick={() => setShowAll(s => !s)}
            className="snap-start shrink-0"
            variant={showAll ? 'soft' : 'outline'}
            size="md"
          >
            {showAll ? (locale==='ar' ? 'إخفاء' : 'Hide') : (locale==='ar' ? 'عرض المزيد' : 'Show more')}
          </Chip>
        )}
      </div>
    </div>
  );
};

export default CategoryChips;

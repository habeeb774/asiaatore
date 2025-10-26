import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { resolveLocalized } from '../../utils/locale';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import SafeImage from '../common/SafeImage';

const fallbackStyle = { width: 80, height: 48, background: '#f3f4f6', borderRadius: 10 };

export default function BrandsStrip({ title = 'Popular Brands', max = 14 }) {
  const [brands, setBrands] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const listRef = React.useRef(null);
  const { locale } = useLanguage();

  React.useEffect(() => {
    let active = true;
    setLoading(true); setErr(null);
    api.brandsList().then((list) => {
      if (!active) return;
      setBrands(Array.isArray(list) ? list.slice(0, max) : []);
    }).catch((e) => {
      if (!active) return;
      setErr(e?.message || 'Failed to load brands');
    }).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [max]);

  // Frontend graceful fallback when DB is unavailable or API fails
  const fallbackBrands = React.useMemo(() => [
    { id: 'fb-1', slug: 'asia-store', name: { en: 'Asia Store', ar: 'متجر آسيا' }, logo: '/logo.svg' },
    { id: 'fb-2', slug: 'tokyo-mart', name: { en: 'Tokyo Mart', ar: 'طوكيو مارت' }, logo: '/logo.svg' },
    { id: 'fb-3', slug: 'manfaz-asia', name: { en: 'Manfaz Asia', ar: 'منفذ آسيا' }, logo: '/logo.svg' },
    { id: 'fb-4', slug: 'sakura-foods', name: { en: 'Sakura Foods', ar: 'ساكورا فودز' }, logo: '/logo.svg' },
    { id: 'fb-5', slug: 'green-tea', name: { en: 'Green Tea', ar: 'الشاي الأخضر' }, logo: '/logo.svg' },
    { id: 'fb-6', slug: 'orient-delights', name: { en: 'Orient Delights', ar: 'لذائذ الشرق' }, logo: '/logo.svg' }
  ], []);
  const showing = (!loading && Array.isArray(brands) && brands.length > 0) ? brands : fallbackBrands;

  return (
    <section className="section-padding bg-white" aria-labelledby="brands-head">
      <div className="container-fixed">
        <div className="home-section-head text-center">
          <h2 id="brands-head" className="home-section-head__title">{title}</h2>
          <p className="home-section-head__subtitle">Trusted partners and labels</p>
        </div>
        <div className="relative overflow-x-auto mobile-gutters brands-strip scroll-fade-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex gap-2">
            <button aria-label="Previous brands" className="p-2 rounded-full bg-white shadow-lg" onClick={() => { const el = listRef.current; if (el) el.scrollBy({ left: -Math.round(el.clientWidth * 0.6), behavior: 'smooth' }); }}>‹</button>
          </div>
          <ul ref={listRef} role="list" className="brands-strip__list hide-scrollbar items-center py-2 min-w-[600px] flex gap-4">
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="brands-strip__item shimmer" style={{...fallbackStyle}} />
            ))}
            {!loading && showing.map((b) => (
              <li key={b.id} role="listitem" className="brands-strip__item shrink-0 snap-start">
                <Link to={`/brands/slug/${encodeURIComponent(b.slug || 'brand')}`} className="inline-flex items-center justify-center border rounded-xl bg-white hover:shadow transition" style={{ width: 112, height: 64 }}>
                  {b.logoVariants?.thumb || b.logo ? (
                    <SafeImage
                      src={b.logoVariants?.thumb || b.logo}
                      alt={resolveLocalized(b.name, locale) || b.name?.en || b.name?.ar || b.slug || ''}
                      className="max-w-[92%] max-h-[80%] object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-xs opacity-70 px-2 text-center truncate" title={resolveLocalized(b.name, locale) || b.name?.en || b.name?.ar || b.slug || ''}>
                      {resolveLocalized(b.name, locale) || b.name?.en || b.name?.ar || b.slug || 'Brand'}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {!loading && !err && brands.length === 0 && (
              <li className="text-sm opacity-70">—</li>
            )}
          </ul>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex gap-2">
            <button aria-label="Next brands" className="p-2 rounded-full bg-white shadow-lg" onClick={() => { const el = listRef.current; if (el) el.scrollBy({ left: Math.round(el.clientWidth * 0.6), behavior: 'smooth' }); }}>›</button>
          </div>
        </div>
      </div>
    </section>
  );
}

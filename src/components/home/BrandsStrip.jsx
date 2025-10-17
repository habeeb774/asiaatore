import React from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const fallbackStyle = { width: 80, height: 48, background: '#f3f4f6', borderRadius: 10 };

export default function BrandsStrip({ title = 'Popular Brands', max = 14 }) {
  const [brands, setBrands] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);

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
      <div className="container-custom">
        <div className="home-section-head text-center">
          <h2 id="brands-head" className="home-section-head__title">{title}</h2>
          <p className="home-section-head__subtitle">Trusted partners and labels</p>
        </div>
  <div className="relative overflow-x-auto mobile-gutters brands-strip scroll-fade-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          <ul className="brands-strip__list hide-scrollbar items-center py-2 min-w-[600px]">
            {loading && Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="brands-strip__item shimmer" style={{...fallbackStyle}} />
            ))}
            {!loading && showing.map((b) => (
              <li key={b.id} className="brands-strip__item shrink-0 snap-start">
                <Link to={`/brands/slug/${encodeURIComponent(b.slug || 'brand')}`} className="inline-flex items-center justify-center border rounded-xl bg-white hover:shadow transition" style={{ width: 112, height: 64 }}>
                  {b.logoVariants?.thumb || b.logo ? (
                    <img
                      src={b.logoVariants?.thumb || b.logo}
                      alt={b.name?.en || b.name?.ar || b.slug || ''}
                      loading="lazy"
                      style={{ maxWidth: '92%', maxHeight: '80%', objectFit: 'contain' }}
                      onError={(e)=>{ e.currentTarget.style.display='none'; }}
                    />
                  ) : (
                    <span className="text-xs opacity-70 px-2 text-center truncate" title={b.name?.en || b.name?.ar || b.slug || ''}>
                      {b.name?.en || b.name?.ar || b.slug || 'Brand'}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {!loading && !err && brands.length === 0 && (
              <li className="text-sm opacity-70">—</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

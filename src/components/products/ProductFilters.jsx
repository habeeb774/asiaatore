import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';

const ProductFilters = ({ state, onChange }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const update = (patch) => onChange({ ...state, ...patch });
  const reset = () => onChange({ category: '', sort: 'new', min: '', max: '', rating: '', discount: false });

  // Load categories dynamically (withCounts)
  const [cats, setCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catError, setCatError] = useState('');

  useEffect(() => {
    let mounted = true;
    const cacheKey = 'pf_cats_cache_v1';
    const ttlMs = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (cached.expires > now && Array.isArray(cached.data)) {
          setCats(cached.data);
        }
      }
    } catch {}
    setLoadingCats(true);
    api.listCategories({ withCounts: 1 }).then(res => {
      const list = res.categories || [];
      // Deduplicate by slug and sort by count desc then name
      const map = new Map();
      for (const c of list) {
        if (!c?.slug) continue;
        if (!map.has(c.slug)) map.set(c.slug, c);
      }
      const uniq = Array.from(map.values())
        .sort((a,b) => (b.productCount||0) - (a.productCount||0) || String(a.name?.ar||a.slug).localeCompare(String(b.name?.ar||b.slug), 'ar'));
      // Hide categories with zero products in this UI
      const nonEmpty = uniq.filter(c => (c.productCount||0) > 0);
      if (mounted) setCats(nonEmpty);
      try { localStorage.setItem(cacheKey, JSON.stringify({ data: nonEmpty, expires: now + ttlMs })); } catch {}
    }).catch(err => {
      if (mounted) setCatError(err.message || 'failed');
    }).finally(() => { if (mounted) setLoadingCats(false); });
    return () => { mounted = false; };
  }, []);

  const catOptions = useMemo(() => {
    return cats.map(c => ({ value: c.slug, label: isAr ? (c.name?.ar || c.slug) : (c.name?.en || c.slug) }));
  }, [cats, isAr]);

  return (
    <div className="product-filters" style={{display:'flex', flexWrap:'wrap', gap:'12px', alignItems:'flex-end'}}>
      <div className="filter-group">
        <label htmlFor="cat">{isAr ? 'التصنيف' : 'Category'}</label>
        <select id="cat" value={state.category} onChange={e => update({ category: e.target.value })}>
          <option value="">{isAr ? 'الكل' : 'All'}</option>
          {catOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {loadingCats && <div style={{fontSize:12,color:'#888'}}>{isAr?'...جاري التحميل':'Loading...'}</div>}
        {catError && <div role="status" style={{fontSize:12,color:'#a00'}}>{isAr?'فشل تحميل التصنيفات':'Failed to load categories'}</div>}
      </div>
      <div className="filter-group">
        <label htmlFor="sort">{isAr ? 'ترتيب' : 'Sort'}</label>
        <select id="sort" value={state.sort} onChange={e => update({ sort: e.target.value })}>
          <option value="new">{isAr ? 'الأحدث' : 'Newest'}</option>
          <option value="price-asc">{isAr ? 'السعر ↑' : 'Price ↑'}</option>
            <option value="price-desc">{isAr ? 'السعر ↓' : 'Price ↓'}</option>
        </select>
      </div>
      <div className="filter-group">
        <label>{isAr ? 'السعر من' : 'Price Min'}</label>
        <input type="number" min="0" value={state.min || ''} onChange={e => update({ min: e.target.value })} placeholder={isAr?'أدنى':'Min'} style={{width:100}} />
      </div>
      <div className="filter-group">
        <label>{isAr ? 'إلى' : 'To'}</label>
        <input type="number" min="0" value={state.max || ''} onChange={e => update({ max: e.target.value })} placeholder={isAr?'أقصى':'Max'} style={{width:100}} />
      </div>
      <div className="filter-group">
        <label>{isAr ? 'التقييم' : 'Rating'}</label>
        <select value={state.rating || ''} onChange={e => update({ rating: e.target.value })}>
          <option value="">{isAr ? 'الكل' : 'All'}</option>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{isAr ? `على الأقل ${r}` : `≥ ${r}`}</option>)}
        </select>
      </div>
      <div className="filter-group" style={{display:'flex', flexDirection:'column'}}>
        <label>{isAr ? 'خصم' : 'Discount'}</label>
        <input type="checkbox" checked={!!state.discount} onChange={e => update({ discount: e.target.checked })} />
      </div>
      <button type="button" onClick={reset} style={{padding:'6px 14px', borderRadius:8, border:'1px solid #ccc', background:'#f8f8f8', cursor:'pointer'}}>{isAr ? 'إعادة ضبط' : 'Reset'}</button>
    </div>
  );
};

export default ProductFilters;

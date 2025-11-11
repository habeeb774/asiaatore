import React, { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api/client';
import { Button } from '../../ui';

// Lightweight modal product picker for admin discount selection
// Props:
// - open: boolean
// - onClose: () => void
// - onSelect: (product) => void
// - title?: string
// - onlyEligible?: boolean (default true: price>0 && !oldPrice)
// - query?: string (controlled search)
// - onQueryChange?: (value:string) => void
// - allowToggleEligible?: boolean (default true) show a checkbox to switch eligible/all
// - onToggleEligible?: (nextOnlyEligible:boolean) => void
const ProductPicker = ({ open, onClose, onSelect, title = 'اختر منتج', onlyEligible = true, query, onQueryChange, allowToggleEligible = true, onToggleEligible }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError(null);
    api.listProducts().then(list => {
      if (!active) return;
      setAllProducts(Array.isArray(list) ? list : []);
    }).catch(e => {
      if (!active) return;
      setError(e.message || 'فشل تحميل المنتجات');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (onlyEligible) list = list.filter(p => !p.oldPrice && (p.price||0) > 0);
    const needle = ((query ?? q) || '').trim().toLowerCase();
    if (needle) list = list.filter(p => (p.name?.ar||p.name?.en||p.name||'').toLowerCase().includes(needle) || String(p.id).includes(needle));
    return list.slice(0, 300);
  }, [allProducts, q, query, onlyEligible]);

  if (!open) return null;

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <div style={modal}>
        <div style={header}>
          <div style={{fontWeight:700}}>{title}</div>
          <Button onClick={onClose} variant="ghost" size="sm" aria-label="إغلاق">✕</Button>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8,flexWrap:'wrap'}}>
          <input
            autoFocus
            placeholder="بحث بالاسم أو المعرّف"
            value={query ?? q}
            onChange={e=> (onQueryChange ? onQueryChange(e.target.value) : setQ(e.target.value))}
            style={searchInput}
          />
          <span style={{fontSize:'.7rem',color:'#64748b'}}>{filtered.length} نتيجة</span>
          {allowToggleEligible && (
            <label style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:'.8rem',marginInlineStart:'auto'}}>
              <input
                type="checkbox"
                checked={!onlyEligible}
                onChange={(e)=> onToggleEligible ? onToggleEligible(!e.target.checked) : void 0}
              />
              عرض كل المنتجات
            </label>
          )}
        </div>
        {loading && <div style={hint}>...تحميل</div>}
        {error && <div style={errorText}>خطأ: {error}</div>}
        <div style={listWrap}>
          {filtered.map(p => (
            <div key={p.id} style={row}>
              <img
                src={p.image || p.imageVariants?.thumb || '/logo.svg'}
                alt=""
                style={thumb}
                onError={e=>{ e.currentTarget.src='/logo.svg'; }}
              />
              <div style={{display:'flex',flexDirection:'column',gap:2,flex:1,minWidth:0}}>
                <div style={{fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name?.ar || p.name?.en || p.name || p.id}</div>
                <div style={{fontSize:'.7rem',opacity:.8,display:'flex',gap:8,flexWrap:'wrap'}}>
                  <span>السعر: {p.price ?? '—'}</span>
                  <span>المخزون: {p.stock ?? '—'}</span>
                  {p.category && <span>التصنيف: {p.category}</span>}
                </div>
              </div>
              <Button onClick={()=>{ onSelect?.(p); onClose?.(); }} size="sm" variant="primary">اختيار</Button>
            </div>
          ))}
          {!loading && !error && !filtered.length && (
            <div style={hint}>لا نتائج مطابقة</div>
          )}
        </div>
      </div>
    </div>
  );
};

const overlay = { position:'fixed', inset:0, background:'rgba(15,23,42,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 50 };
const modal = { background:'#fff', width:'min(780px, 96vw)', maxHeight:'86vh', borderRadius:14, boxShadow:'0 10px 40px rgba(0,0,0,.2)', padding:'12px', display:'flex', flexDirection:'column' };
const header = { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, paddingBottom:8, borderBottom:'1px solid #e2e8f0' };
// closeBtn replaced by shared Button
const searchInput = { padding:'.55rem .75rem', border:'1px solid #e2e8f0', borderRadius:10, minWidth: 220, fontSize:'.8rem', background:'#fff', flex:1 };
const listWrap = { display:'grid', gap:8, overflowY:'auto', padding:'4px', border:'1px solid #e2e8f0', borderRadius:10, maxHeight:'60vh' };
const row = { display:'flex', alignItems:'center', gap:10, padding:8, border:'1px solid #e2e8f0', borderRadius:10 };
const thumb = { width:48, height:48, objectFit:'cover', borderRadius:8, border:'1px solid #e2e8f0' };
// pickBtn replaced by shared Button
const hint = { fontSize:'.75rem', color:'#64748b', padding:'6px 2px' };
const errorText = { fontSize:'.75rem', color:'#b91c1c', padding:'6px 2px' };

export default ProductPicker;

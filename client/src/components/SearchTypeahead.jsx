import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/client';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Accessible typeahead search component.
 * Features:
 * - Debounced backend calls to /api/search/typeahead
 * - Shows grouped suggestions (Products / Categories)
 * - Keyboard navigation (Up/Down/Home/End/Enter/Escape)
 * - Maintains recent searches in localStorage (max 8)
 * - RTL friendly (matches existing Arabic UI)
 */
export default function SearchTypeahead({ autoFocus = true, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ products: [], categories: [] });
  const [recent, setRecent] = useState(() => {
    try { const raw = localStorage.getItem('my_store_recent_searches'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // flattened list index
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  const flatItems = [];
  if (results.products.length) {
    flatItems.push({ type: 'header', label: 'منتجات' });
    results.products.forEach(p => flatItems.push({ type: 'product', item: p }));
  }
  if (results.categories.length) {
    flatItems.push({ type: 'header', label: 'فئات' });
    results.categories.forEach(c => flatItems.push({ type: 'category', item: c }));
  }
  if (!results.products.length && !results.categories.length && query && !loading && !error) {
    flatItems.push({ type: 'empty', label: 'لا توجد نتائج' });
  }

  const saveRecent = useCallback((q) => {
    if (!q) return;
    setRecent(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 8);
      try { localStorage.setItem('my_store_recent_searches', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const performSearch = useCallback(async (value) => {
    if (!value || value.trim().length < 2) { setResults({ products: [], categories: [] }); return; }
    setLoading(true); setError(null);
    try {
      const data = await api.searchTypeahead(value.trim());
      setResults({
        products: Array.isArray(data.products) ? data.products : [],
        categories: Array.isArray(data.categories) ? data.categories : []
      });
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, []);

  // Debounce query changes
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 280);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, performSearch]);

  useEffect(() => { if (autoFocus) setTimeout(() => inputRef.current?.focus(), 30); }, [autoFocus]);

  const reset = () => {
    setQuery(''); setResults({ products: [], categories: [] }); setActiveIndex(-1);
  };

  const executeNavigation = (item) => {
    if (!item) return;
    if (item.type === 'product') {
      saveRecent(query);
      onClose?.();
      navigate(`/products/${item.item.slug || item.item.id}`);
    } else if (item.type === 'category') {
      saveRecent(query);
      onClose?.();
      navigate(`/categories/${item.item.slug || item.item.id}`);
    }
  };

  const onKeyDown = (e) => {
    if (!open) return;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        let next = activeIndex + 1;
        while (next < flatItems.length && flatItems[next].type === 'header') next++;
        if (next >= flatItems.length) next = flatItems.length - 1;
        setActiveIndex(next);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        let prev = activeIndex - 1;
        while (prev >= 0 && flatItems[prev].type === 'header') prev--;
        if (prev < 0) prev = -1;
        setActiveIndex(prev);
        break;
      }
      case 'Home': {
        e.preventDefault();
        const first = flatItems.findIndex(i => i.type !== 'header');
        setActiveIndex(first);
        break;
      }
      case 'End': {
        e.preventDefault();
        for (let i = flatItems.length - 1; i >= 0; i--) {
          if (flatItems[i].type !== 'header') { setActiveIndex(i); break; }
        }
        break;
      }
      case 'Enter': {
        if (activeIndex >= 0 && flatItems[activeIndex]) {
          e.preventDefault();
          executeNavigation(flatItems[activeIndex]);
        } else if (query.trim()) {
          saveRecent(query.trim());
          onClose?.();
          navigate(`/products?search=${encodeURIComponent(query.trim())}`);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        onClose?.();
        break;
      }
      default: break;
    }
  };

  const showRecent = !query && recent.length > 0;

  return (
    <div className="typeahead-wrapper" style={{ position: 'relative', width: '100%' }} onKeyDown={onKeyDown} dir="rtl">
      <div className="typeahead-control" style={{ display:'flex', gap:6, alignItems:'center' }}>
        <Search size={16} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          placeholder="ابحث... (اكتب حرفين على الأقل)"
          aria-label="بحث فوري"
          style={{ flex:1, border:'none', outline:'none', background:'transparent' }}
        />
        {query && (
          <button type="button" onClick={reset} aria-label="مسح" style={{ background:'transparent', border:0, cursor:'pointer' }}>
            <X size={14} />
          </button>
        )}
      </div>
      {open && (
        <div
          className="typeahead-popover"
          role="listbox"
          aria-label="اقتراحات البحث"
          style={{
            position:'absolute', top:'100%', insetInlineStart:0, insetInlineEnd:0, marginTop:4,
            background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:'8px 0',
            boxShadow:'0 8px 24px -6px rgba(0,0,0,.15)', zIndex:1200, maxHeight:360, overflowY:'auto'
          }}
          ref={listRef}
        >
          {loading && <div className="px-3 py-2" style={{ fontSize:'.65rem', color:'#475569' }}>جاري التحميل...</div>}
          {error && <div className="px-3 py-2" style={{ fontSize:'.65rem', color:'#dc2626' }}>{error}</div>}
          {showRecent && (
            <div style={{ padding:'4px 14px 10px' }}>
              <div style={{ fontSize:'.55rem', fontWeight:600, color:'#64748b', marginBottom:4 }}>عمليات بحث حديثة</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {recent.map(r => (
                  <button key={r} type="button" onClick={() => { setQuery(r); setOpen(true); performSearch(r); }}
                    style={{ background:'#f1f5f9', border:0, borderRadius:20, padding:'6px 10px', fontSize:'.55rem', cursor:'pointer' }}>{r}</button>
                ))}
              </div>
            </div>
          )}
          {!showRecent && flatItems.map((it, idx) => {
            if (it.type === 'header') {
              return <div key={idx} style={{ padding:'6px 14px', fontSize:'.55rem', fontWeight:700, opacity:.7 }}>{it.label}</div>;
            }
            if (it.type === 'empty') {
              return <div key={idx} style={{ padding:'8px 14px', fontSize:'.6rem', color:'#64748b' }}>{it.label}</div>;
            }
            const isActive = idx === activeIndex;
            const common = {
              key: (it.item?.id || idx),
              role:'option',
              'aria-selected': isActive,
              onMouseEnter: () => setActiveIndex(idx),
              onClick: () => executeNavigation(it)
            };
            return (
              <div
                {...common}
                style={{
                  cursor:'pointer', display:'flex', alignItems:'center', gap:10,
                  padding:'8px 14px', background:isActive ? '#f1f5f9' : 'transparent'
                }}
              >
                {it.type === 'product' && (
                  <>
                    <div style={{ width:42, height:42, flexShrink:0, borderRadius:10, overflow:'hidden', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {it.item.image && <img src={it.item.image} alt={it.item.nameAr || it.item.nameEn} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'.65rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.item.nameAr || it.item.nameEn}</div>
                      <div style={{ fontSize:'.55rem', color:'#475569', display:'flex', gap:8 }}>
                        <span>{(it.item.price || 0).toFixed(2)} ر.س</span>
                        {it.item.category && <span style={{ opacity:.7 }}>{it.item.category}</span>}
                      </div>
                    </div>
                  </>
                )}
                {it.type === 'category' && (
                  <div style={{ fontSize:'.62rem', fontWeight:500 }}>{it.item.nameAr || it.item.nameEn}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import LazyImage from '../common/LazyImage';
import { resolveLocalized } from '../../utils/locale';

const QuickViewModal = ({ product, onClose }) => {
  const { locale, t } = useLanguage();
  const { addToCart, cartItems, maxPerItem } = useCart() || { addToCart: () => {}, cartItems: [], maxPerItem: 10 };
  const navigate = useNavigate();
  const location = useLocation();
  const [btnState, setBtnState] = useState('idle'); // idle | added | max
  const current = cartItems?.find(i => i.id === product?.id);
  const currentQty = current?.quantity || 0;
  const reachedMax = currentQty >= (maxPerItem || 10);
  useEffect(()=> { if (reachedMax) setBtnState('max'); }, [reachedMax]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Variant / options support
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const optionGroups = useMemo(() => {
    if (Array.isArray(product?.options) && product.options.length) return product.options;
    if (variants && variants.length) {
      const keys = Object.keys(variants[0].attributes || {});
      return keys.map(k => ({ name: k, values: Array.from(new Set(variants.map(v => v.attributes?.[k] ?? ''))) }));
    }
    return [];
  }, [product?.options, variants]);

  const [selectedOptions, setSelectedOptions] = useState(() => {
    if (variants && variants.length && variants[0].attributes) return { ...variants[0].attributes };
    const initial = {};
    (product?.options || []).forEach(g => { initial[g.name] = g.values?.[0] ?? ''; });
    return initial;
  });

  const selectedVariant = useMemo(() => {
    if (!variants || !variants.length) return null;
    return variants.find(v => {
      const attrs = v.attributes || {};
      return Object.keys(selectedOptions).every(k => String(attrs[k] ?? '') === String(selectedOptions[k] ?? ''));
    }) || variants[0];
  }, [variants, selectedOptions]);

  const currentPrice = selectedVariant?.price ?? product?.price;
  const currentOldPrice = selectedVariant?.oldPrice ?? product?.oldPrice;
  const outOfStock = (selectedVariant?.stock ?? product?.stock) !== undefined && (selectedVariant?.stock ?? product?.stock) <= 0;
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const name = resolveLocalized(product?.name ?? product?.title, locale) || (typeof product?.name === 'string' ? product.name : product?.title) || '';
  const hasDiscount = product?.oldPrice && product?.oldPrice > product?.price;
  const discountPercent = hasDiscount ? Math.round( (1 - (product?.price / product?.oldPrice)) * 100 ) : null;

  return createPortal(
    <div className="quick-view-overlay" role="dialog" aria-modal="true">
      <div className="quick-view-window">
        <button className="qv-close" onClick={onClose} aria-label={t('close')}>×</button>
        <div className="qv-body">
          <div className="qv-media" style={{position:'relative'}}>
            <LazyImage src={product.image} alt={name} sizes="(max-width: 768px) 90vw, 420px" />
            {hasDiscount && <span style={{position:'absolute',top:10,right:10,background:'#69be3c',color:'#fff',padding:'6px 10px',borderRadius:10,fontSize:12,fontWeight:600}}>-{discountPercent}%</span>}
            {outOfStock && <span style={{position:'absolute',top:10,left:10,background:'rgba(0,0,0,.7)',color:'#fff',padding:'6px 10px',borderRadius:10,fontSize:12}}>{locale==='ar'?'غير متوفر':'Out of stock'}</span>}
          </div>
            <div className="qv-info">
              <h2>{name}</h2>
              <p>{resolveLocalized(product?.short ?? product?.shortDescription ?? product?.description, locale)}</p>

              {/* Options / variants */}
              {optionGroups && optionGroups.length > 0 && (
                <div className="qv-options" style={{marginTop:8}}>
                  {optionGroups.map((g) => (
                    <div key={g.name} style={{marginBottom:8}}>
                      <div style={{fontSize:12,opacity:.8,marginBottom:6}}>{resolveLocalized(g.name, locale) || g.name}</div>
                      <div className="flex gap-2 flex-wrap">
                        {(g.values || []).map((val) => {
                          const vLabel = resolveLocalized(val, locale) || String(val);
                          const active = String(selectedOptions[g.name]) === String(val);
                          return (
                            <button key={val} className={`px-3 py-1 rounded-full ${active? 'bg-emerald-600 text-white':'bg-slate-100 dark:bg-slate-800'}`}
                              onClick={() => setSelectedOptions(prev => ({ ...prev, [g.name]: val }))}>
                              {vLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="qv-price" style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="new" style={{fontWeight:700,fontSize:18,color:'#69be3c'}}>{Number(currentPrice||0).toFixed(2)} {locale==='ar'?'ر.س':'SAR'}</span>
                {currentOldPrice && <span className="old" style={{textDecoration:'line-through',color:'#64748b'}}>{Number(currentOldPrice).toFixed(2)}</span>}
                {hasDiscount && discountPercent && <span style={{background:'#fde68a',color:'#92400e',padding:'4px 8px',borderRadius:8,fontSize:12}}>-{discountPercent}%</span>}
              </div>

              <div style={{fontSize:12,color:'#475569',marginTop:6}}>
                {selectedVariant?.sku && <span style={{marginRight:10}}>SKU: {selectedVariant.sku}</span>}
                <span>{outOfStock ? (locale==='ar'?'غير متوفر':'Out of stock') : (locale==='ar'?'متوفر':'In stock')}{(selectedVariant?.stock ?? product.stock) != null ? ` · ${selectedVariant?.stock ?? product.stock}` : ''}</span>
              </div>

              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginTop:12}}>
                {/* quantity selector */}
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <button className="qv-qty-btn" onClick={() => setQty(q => Math.max(1, q-1))} disabled={qty<=1}>-</button>
                  <div style={{minWidth:36,textAlign:'center'}}>{qty}</div>
                  <button className="qv-qty-btn" onClick={() => setQty(q => Math.min(q+1, (selectedVariant?.stock ?? product.stock) || maxPerItem || 99))} disabled={qty>=(selectedVariant?.stock ?? product.stock) || qty>=(maxPerItem||99)}>+</button>
                </div>

                <button
                  className={`add-btn ${btnState==='added'?'added':''} ${btnState==='max'?'at-max':''}`}
                  disabled={outOfStock || reachedMax}
                  style={outOfStock||reachedMax?{opacity:.6,cursor:'not-allowed'}:null}
                  onClick={() => {
                    if (outOfStock || reachedMax) return;
                    const payload = selectedVariant ? { ...product, variantId: selectedVariant.id } : product;
                    const res = addToCart(payload, qty);
                    if (res?.ok) {
                      const willMax = (currentQty + qty) >= (maxPerItem||10);
                      setBtnState(willMax?'max':'added');
                      setTimeout(()=> setBtnState(willMax?'max':'idle'), 1300);
                    } else if (res?.reason === 'AUTH_REQUIRED') {
                      const from = location.pathname + (location.search || '');
                      navigate('/login', { state: { from } });
                    }
                  }}
                >
                  {outOfStock ? (locale==='ar'?'غير متوفر':'Out of stock') : reachedMax ? (locale==='ar'?'الحد الأقصى':'Max') : btnState==='added' ? (locale==='ar'?'✓ تمت الإضافة':'✓ Added') : (t && t('addToCart') )}
                </button>
                {currentQty > 0 && <span style={{fontSize:12,color:'#475569'}}>({locale==='ar'?'في السلة':'In cart'}: {currentQty})</span>}
                <button onClick={onClose} className="btn-secondary" style={{fontSize:12}}>{locale==='ar'?'إغلاق':'Close'}</button>
              </div>
            </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickViewModal;
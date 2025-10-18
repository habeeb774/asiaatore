import React, { useEffect, useState } from 'react';
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

  if (!product) return null;
  const name = resolveLocalized(product?.name ?? product?.title, locale) || (typeof product?.name === 'string' ? product.name : product?.title) || '';
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount ? Math.round( (1 - (product.price / product.oldPrice)) * 100 ) : null;
  const outOfStock = product.stock !== undefined && product.stock <= 0;

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
              <div className="qv-price" style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="new" style={{fontWeight:700,fontSize:18,color:'#69be3c'}}>{product.price} {locale==='ar'?'ر.س':'SAR'}</span>
                {product.oldPrice && <span className="old" style={{textDecoration:'line-through',color:'#64748b'}}>{product.oldPrice}</span>}
                {hasDiscount && <span style={{background:'#fde68a',color:'#92400e',padding:'4px 8px',borderRadius:8,fontSize:12}}>-{discountPercent}%</span>}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                <button
                  className={`add-btn ${btnState==='added'?'added':''} ${btnState==='max'?'at-max':''}`}
                  disabled={outOfStock || reachedMax}
                  style={outOfStock||reachedMax?{opacity:.6,cursor:'not-allowed'}:null}
                  onClick={() => {
                    if (outOfStock || reachedMax) return;
                    const res = addToCart(product, 1);
                    if (res?.ok) {
                      const willMax = (currentQty + 1) >= (maxPerItem||10);
                      setBtnState(willMax?'max':'added');
                      setTimeout(()=> setBtnState(willMax?'max':'idle'), 1300);
                    } else if (res?.reason === 'AUTH_REQUIRED') {
                      const from = location.pathname + (location.search || '');
                      navigate('/login', { state: { from } });
                    }
                  }}
                >
                  {outOfStock ? (locale==='ar'?'غير متوفر':'Out of stock') : reachedMax ? (locale==='ar'?'الحد الأقصى':'Max') : btnState==='added' ? (locale==='ar'?'✓ تمت الإضافة':'✓ Added') : t('addToCart')}
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
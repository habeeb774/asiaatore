import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api/client';
import { useAuth } from '../contexts/AuthContext';

/** ProductReviews
 * Props: productId
 * Shows approved reviews and allows logged-in user to submit a new review (pending moderation).
 */
export default function ProductReviews({ productId }) {
  const { user } = useAuth() || {};
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true); setError(null);
    try {
      const data = await api.reviewsListForProduct(productId);
      setReviews(Array.isArray(data) ? data : (data.reviews || []));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { load(); }, [productId, load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true); setError(null);
    try {
      await api.reviewCreate(productId, form);
      setForm({ rating: 5, title: '', body: '' });
      setJustSubmitted(true);
      setTimeout(()=> setJustSubmitted(false), 8829);
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  };

  return (
    <div className="product-reviews" dir="rtl" style={{ marginTop:'2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
        <h3 style={{ fontSize:'1rem', margin: 0 }}>آراء العملاء</h3>
        <Link 
          to={`/product/${productId}/reviews`}
          style={{ fontSize: '.7rem', color: '#3b82f6', textDecoration: 'none' }}
        >
          عرض جميع المراجعات →
        </Link>
      </div>
      {loading && <div style={{ fontSize:'.7rem', color:'#64748b' }}>جاري التحميل...</div>}
      {error && <div style={{ fontSize:'.65rem', color:'#dc2626' }}>{error}</div>}
      {!loading && !reviews.length && <div style={{ fontSize:'.65rem', color:'#475569' }}>لا توجد مراجعات بعد.</div>}
      <ul style={{ listStyle:'none', margin:0, padding:5, display:'flex', flexDirection:'column', gap:10 }}>
        {reviews.map(r => (
          <li key={r.id} style={{ background:'#f8fafc', padding:'10px 14px', borderRadius:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <strong style={{ fontSize:'.7rem' }}>{r.title || 'مراجعة'}</strong>
              <span style={{ fontSize:'.6rem', color:'#334155' }}>{'★'.repeat(r.rating)}{'☆'.repeat(Math.max(0,5-r.rating))}</span>
            </div>
            {r.body && <p style={{ margin:0, fontSize:'.6rem', lineHeight:1.5 }}>{r.body}</p>}
            <div style={{ fontSize:'.5rem', marginTop:6, color:'#64748b' }}>{new Date(r.createdAt).toLocaleDateString()}</div>
          </li>
        ))}
      </ul>
      {user ? (
        <form onSubmit={submit} style={{ marginTop:'1.25rem', display:'grid', gap:8, background:'#fff', padding:'14px 16px', border:'1px solid #e2e8f0', borderRadius:14 }}>
          <h4 style={{ margin:0, fontSize:'.75rem' }}>أضف مراجعة</h4>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label style={{ fontSize:'.55rem' }}>التقييم:</label>
            <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: +e.target.value }))} style={{ fontSize:'.6rem' }}>
              {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <input
            required
            placeholder="عنوان (اختياري)"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ fontSize:'.6rem', padding:'8px 10px', borderRadius:10, border:'1px solid #e2e8f0' }}
          />
          <textarea
            required
            placeholder="نص المراجعة"
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            rows={4}
            style={{ fontSize:'.6rem', padding:'8px 10px', borderRadius:10, border:'1px solid #e2e8f0', resize:'vertical' }}
          />
          <button type="submit" disabled={submitting} style={{ fontSize:'.6rem', fontWeight:600, background:'linear-gradient(90deg,#69be3c,#f6ad55)', color:'#fff', border:0, padding:'8px 14px', borderRadius:10, cursor:'pointer' }}>
            {submitting ? 'جاري الإرسال...' : 'إرسال'}
          </button>
          {justSubmitted && <div style={{ fontSize:'.55rem', color:'#16a34a' }}>تم الإرسال وتنتظر الموافقة 💬</div>}
        </form>
      ) : (
        <div style={{ fontSize:'.6rem', marginTop:'1rem', color:'#475569' }}>سجّل دخولك لإضافة مراجعة.</div>
      )}
    </div>
  );
}

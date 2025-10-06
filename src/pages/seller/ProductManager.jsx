import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeName } from '../../utils/locale';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';

const STORAGE_KEY = 'my_store_seller_products';

const ProductManager = () => {
  const { user } = useAuth() || {};
  const sellerId = user?.id || 'seller-guest';
  const store = useStore();

  // local fallback state (used when StoreContext is not available)
  const [localProducts, setLocalProducts] = useState([]);
  const [form, setForm] = useState({ name: '', price: 0, images: [], videos: [], description: '', type: 'physical', downloadUrl: '' });
  const [editing, setEditing] = useState(null); // product id being edited
  const [newImage, setNewImage] = useState('');
  const [newVideo, setNewVideo] = useState('');

  // derive products: prefer store if available
  const { locale } = useLanguage ? useLanguage() : { locale: 'ar' };
  const products = store ? (store.products || []).filter(p => p.sellerId === sellerId) : localProducts;
  const resolveName = (n) => localizeName({ name: n }, locale);

  // load fallback from localStorage if no store
  useEffect(() => {
    if (store) {
      // migrate any existing local store map for this seller into StoreContext
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const map = raw ? JSON.parse(raw) : {};
        const list = map[sellerId] || [];
        if (Array.isArray(list) && list.length > 0) {
          // if store doesn't already have seller items, add them
          const exists = (store.products || []).some(p => p.sellerId === sellerId);
          if (!exists) {
            list.forEach(p => store.addProduct({ ...p, sellerId }));
            // clear the local map for this seller
            delete map[sellerId];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
          }
        }
      } catch {}
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      setLocalProducts(map[sellerId] || []);
    } catch {
      setLocalProducts([]);
    }
  }, [sellerId, store]);

  const persistLocal = (next) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[sellerId] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      setLocalProducts(next);
    } catch {}
  };

  const resetForm = () => { setForm({ name: '', price: 0, images: [], videos: [], description: '', type: 'physical', downloadUrl: '' }); setNewImage(''); setNewVideo('') }

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const newP = { id: `p_${Date.now()}`, name: form.name, price: Number(form.price) || 0, images: form.images, videos: form.videos, description: form.description, sellerId, type: form.type, downloadUrl: form.downloadUrl };
    if (store) {
      store.addProduct(newP);
    } else {
      const next = [newP, ...localProducts];
      persistLocal(next);
    }
    resetForm();
  };

  const handleDelete = (id) => {
    if (store) {
      store.removeProduct(id);
    } else {
      const next = localProducts.filter(p => p.id !== id);
      persistLocal(next);
    }
    if (editing === id) setEditing(null);
  };

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name || '', price: p.price || 0, images: p.images || (p.image ? [p.image] : []), videos: p.videos || [], description: p.description || '', type: p.type || 'physical', downloadUrl: p.downloadUrl || '' });
    setNewImage('');
    setNewVideo('');
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    if (store) {
      store.updateProduct(editing, { name: form.name, price: Number(form.price) || 0, images: form.images, videos: form.videos, description: form.description, type: form.type, downloadUrl: form.downloadUrl });
    } else {
      const next = localProducts.map(p => p.id === editing ? { ...p, name: form.name, price: Number(form.price) || 0, images: form.images, videos: form.videos, description: form.description, type: form.type, downloadUrl: form.downloadUrl } : p);
      persistLocal(next);
    }
    setEditing(null);
    resetForm();
  };

  return (
    <div className="container-custom px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">إدارة منتجات البائع</h2>

      <div className="mb-6 max-w-md">
        <input className="w-full mb-2 border px-3 py-2" placeholder="اسم المنتج" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
        <input className="w-full mb-2 border px-3 py-2" placeholder="السعر" type="number" value={form.price} onChange={(e)=>setForm({...form, price:e.target.value})} />
        {/* Images gallery inputs */}
        <label className="block text-sm mb-1">صور المنتج (روابط)</label>
        <div className="mb-2">
          {(form.images || []).map((src, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <img src={src} alt={`img-${i}`} style={{width:72,height:56,objectFit:'cover',borderRadius:6}} />
              <input className="flex-1 border px-3 py-2" value={src} onChange={(e)=>{ const next = [...form.images]; next[i]=e.target.value; setForm({...form, images: next}) }} />
              <button className="text-red-600" onClick={()=>{ const next = form.images.filter((_,idx)=>idx!==i); setForm({...form, images: next}) }}>حذف</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="flex-1 border px-3 py-2" placeholder="أدخل رابط صورة واضغط إضافة" value={newImage} onChange={(e)=>setNewImage(e.target.value)} />
            <button className="btn-secondary" onClick={()=>{ if(newImage.trim()){ setForm({...form, images:[...(form.images||[]), newImage.trim()]}); setNewImage('') } }}>إضافة</button>
          </div>
        </div>

        {/* Videos inputs */}
        <label className="block text-sm mb-1">فيديوهات المنتج (روابط)</label>
        <div className="mb-2">
          {(form.videos || []).map((src, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input className="flex-1 border px-3 py-2" value={src} onChange={(e)=>{ const next = [...form.videos]; next[i]=e.target.value; setForm({...form, videos: next}) }} />
              <button className="text-red-600" onClick={()=>{ const next = form.videos.filter((_,idx)=>idx!==i); setForm({...form, videos: next}) }}>حذف</button>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="flex-1 border px-3 py-2" placeholder="أدخل رابط فيديو واضغط إضافة" value={newVideo} onChange={(e)=>setNewVideo(e.target.value)} />
            <button className="btn-secondary" onClick={()=>{ if(newVideo.trim()){ setForm({...form, videos:[...(form.videos||[]), newVideo.trim()]}); setNewVideo('') } }}>إضافة</button>
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-sm mb-1">نوع المنتج</label>
          <select className="w-full border px-3 py-2 mb-2" value={form.type} onChange={(e)=>setForm({...form, type: e.target.value})}>
            <option value="physical">منتج مادي</option>
            <option value="digital">منتج رقمي (تحميل)</option>
          </select>
          {form.type === 'digital' && (
            <input className="w-full border px-3 py-2" placeholder="رابط التحميل/الملف" value={form.downloadUrl} onChange={(e)=>setForm({...form, downloadUrl: e.target.value})} />
          )}
        </div>

        <textarea className="w-full mb-2 border px-3 py-2" placeholder="الوصف" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />

        {!editing ? (
          <button className="btn-primary" onClick={handleAdd}>إضافة منتج</button>
        ) : (
          <div style={{display:'flex',gap:8}}>
            <button className="btn-primary" onClick={handleSaveEdit}>حفظ التعديلات</button>
            <button className="btn-secondary" onClick={()=>{ setEditing(null); resetForm(); }}>إلغاء</button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {products && products.map(p => (
          <div key={p.id} className="p-3 border rounded flex items-center justify-between">
            <div className="flex items-center gap-4">
              {((p.images && p.images.length>0) ? <img src={p.images[0]} alt={resolveName(p.name)} className="w-16 h-16 object-cover rounded" /> : (p.image ? <img src={p.image} alt={resolveName(p.name)} className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-gray-200" />))}
              <div>
                <div className="font-semibold">{resolveName(p.name)}</div>
                <div className="text-sm text-gray-600">{p.price} ر.س</div>
              </div>
            </div>
            <div>
              <button className="text-blue-600 mr-3" onClick={() => startEdit(p)}>تعديل</button>
              <button className="text-red-600" onClick={() => handleDelete(p.id)}>حذف</button>
            </div>
          </div>
        ))}
        {(!products || products.length === 0) && <div className="text-gray-600">لا توجد منتجات لديك</div>}
      </div>
    </div>
  );
};

export default ProductManager;

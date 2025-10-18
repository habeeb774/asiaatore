import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { localizeName } from '../../utils/locale';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import api from '../../api/client';
import useCategories from '../../hooks/useCategories';

const STORAGE_KEY = 'my_store_seller_products';

const ProductManager = ({ embedded = false }) => {
  const { user } = useAuth() || {};
  const sellerId = user?.id || 'seller-guest';
  const store = useStore();

  // local fallback state (used when StoreContext is not available)
  const [localProducts, setLocalProducts] = useState([]);
  const [form, setForm] = useState({ name: '', nameAr: '', nameEn: '', price: 0, categoryId: '', categorySlug: '', images: [], videos: [], description: '', type: 'physical', downloadUrl: '' });
  const [editing, setEditing] = useState(null); // product id being edited
  const [newImage, setNewImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [newVideo, setNewVideo] = useState('');

  // derive products: prefer store if available
  // Language hook must be unconditional; guard locale usage
  const lang = useLanguage();
  const locale = lang?.locale || 'ar';
  const [serverEnabled, setServerEnabled] = useState(false);
  const [serverProducts, setServerProducts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const { categories: cats } = useCategories({ withCounts: 1, ttl: 60_000 });
  const products = useMemo(() => {
    if (serverEnabled) return serverProducts;
    return store ? (store.products || []).filter(p => p.sellerId === sellerId) : localProducts;
  }, [serverEnabled, serverProducts, store, sellerId, localProducts]);
  const displayName = (p) => {
    if (p?.nameAr || p?.nameEn) {
      return locale === 'ar' ? (p.nameAr || p.nameEn || '') : (p.nameEn || p.nameAr || '');
    }
    // fallback: try object form {name:{ar,en}} then plain name
    return localizeName(p || {}, locale) || p?.name || '';
  };

  // load fallback from localStorage if no store
  useEffect(() => {
    if (store && !serverEnabled) {
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

    if (serverEnabled) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      setLocalProducts(map[sellerId] || []);
    } catch {
      setLocalProducts([]);
    }
  }, [sellerId, store, serverEnabled]);

  // Attempt to use backend seller endpoints if available
  useEffect(() => {
    let mounted = true;
    async function tryLoad() {
      if (!user || (user.role !== 'seller' && user.role !== 'admin')) { setServerEnabled(false); return; }
      setBusy(true); setErr(null);
      try {
        const res = await api.sellerProductsList({ pageSize: 100 });
        if (!mounted) return;
        const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
        setServerProducts(items);
        setServerEnabled(true);
      } catch (e) {
        // fall back silently
        if (!mounted) return;
        setServerEnabled(false);
      } finally {
        if (mounted) setBusy(false);
      }
    }
    tryLoad();
    return () => { mounted = false; };
  }, [user?.id, user?.role]);

  // Categories now provided by useCategories hook

  const persistLocal = (next) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[sellerId] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
      setLocalProducts(next);
    } catch {}
  };

  const resetForm = () => { setForm({ name: '', nameAr: '', nameEn: '', price: 0, categoryId: '', categorySlug: '', images: [], videos: [], description: '', type: 'physical', downloadUrl: '' }); setNewImage(''); setNewVideo('') }

  const reloadServer = async () => {
    try {
      const res = await api.sellerProductsList({ pageSize: 100 });
      const items = Array.isArray(res?.items) ? res.items : (Array.isArray(res) ? res : []);
      setServerProducts(items);
    } catch {}
  };

  const handleAdd = async () => {
    const effectiveNameAr = (form.nameAr || form.name || '').trim();
    const effectiveNameEn = (form.nameEn || form.name || '').trim();
    if (!effectiveNameAr || !effectiveNameEn) { setErr('الاسم العربي والإنجليزي مطلوبان'); return; }
    if (serverEnabled) {
      setBusy(true); setErr(null);
      try {
        const selectedCat = cats.find(c => String(c.id) === String(form.categoryId));
        const payload = {
          nameAr: effectiveNameAr,
          nameEn: effectiveNameEn,
          price: Number(form.price) || 0,
          categoryId: form.categoryId || undefined,
          category: selectedCat?.slug || 'supermarket',
          image: (form.images && form.images[0]) || undefined
        };
        const created = await api.sellerProductCreate(payload);
        if (created?.id && (form.images?.length || 0) > 1) {
          await api.sellerProductAddImages(created.id, form.images.slice(0, 8));
        }
        await reloadServer();
        resetForm();
      } catch (e) {
        setErr(e?.message || 'فشل إنشاء المنتج');
      } finally { setBusy(false); }
      return;
    }
    // Fallback local/store
    const newP = { id: `p_${Date.now()}`, name: effectiveNameAr || effectiveNameEn, price: Number(form.price) || 0, images: form.images, videos: form.videos, description: form.description, sellerId, type: form.type, downloadUrl: form.downloadUrl };
    if (store) {
      store.addProduct(newP);
    } else {
      const next = [newP, ...localProducts];
      persistLocal(next);
    }
    resetForm();
  };

  const handleDelete = async (id) => {
    if (serverEnabled) {
      setBusy(true); setErr(null);
      try { await api.sellerProductDelete(id); await reloadServer(); } catch (e) { setErr(e?.message || 'فشل الحذف'); } finally { setBusy(false); }
      if (editing === id) setEditing(null);
      return;
    }
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
    const selectedCat = cats.find(c => String(c.id) === String(p.categoryId));
    setForm({
      name: p.name || '',
      nameAr: p.nameAr || p.name || '',
      nameEn: p.nameEn || p.name || '',
      price: p.price || 0,
      categoryId: p.categoryId || (selectedCat?.id || ''),
      categorySlug: p.category || selectedCat?.slug || '',
      images: p.images || (p.image ? [p.image] : []),
      videos: p.videos || [],
      description: p.description || '',
      type: p.type || 'physical',
      downloadUrl: p.downloadUrl || ''
    });
    setNewImage('');
    setNewVideo('');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (serverEnabled) {
      setBusy(true); setErr(null);
      try {
        const selectedCat = cats.find(c => String(c.id) === String(form.categoryId));
        await api.sellerProductUpdate(editing, {
          nameAr: (form.nameAr || form.name || '').trim(),
          nameEn: (form.nameEn || form.name || '').trim(),
          price: Number(form.price) || 0,
          categoryId: form.categoryId || undefined,
          category: selectedCat?.slug || undefined,
          image: (form.images && form.images[0]) || undefined
        });
        if (form.images?.length > 1) await api.sellerProductAddImages(editing, form.images.slice(0, 8));
        await reloadServer();
      } catch (e) {
        setErr(e?.message || 'فشل حفظ التعديلات');
      } finally {
        setBusy(false);
      }
      setEditing(null);
      resetForm();
      return;
    }
    // fallback local/store
    if (store) {
      store.updateProduct(editing, { name: (form.nameAr || form.nameEn || form.name), price: Number(form.price) || 0, images: form.images, videos: form.videos, description: form.description, type: form.type, downloadUrl: form.downloadUrl });
    } else {
      const next = localProducts.map(p => p.id === editing ? { ...p, name: (form.nameAr || form.nameEn || form.name), price: Number(form.price) || 0, images: form.images, videos: form.videos, description: form.description, type: form.type, downloadUrl: form.downloadUrl } : p);
      persistLocal(next);
    }
    setEditing(null);
    resetForm();
  };

  return (
    <div className={embedded ? '' : 'container-custom px-4 py-8'}>
      {!embedded && <h2 className="text-2xl font-bold mb-4">إدارة منتجات البائع</h2>}

      <div className="mb-6 max-w-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <input className="w-full border px-3 py-2" placeholder="اسم المنتج (عربي)" value={form.nameAr} onChange={(e)=>setForm({...form, nameAr:e.target.value})} />
          <input className="w-full border px-3 py-2" placeholder="Product Name (English)" value={form.nameEn} onChange={(e)=>setForm({...form, nameEn:e.target.value})} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <input className="w-full border px-3 py-2" placeholder="السعر" type="number" value={form.price} onChange={(e)=>setForm({...form, price:e.target.value})} />
          <select className="w-full border px-3 py-2" value={form.categoryId} onChange={(e)=>{
            const id = e.target.value; const selectedCat = cats.find(c=>String(c.id)===String(id));
            setForm({...form, categoryId: id, categorySlug: selectedCat?.slug || ''});
          }}>
            <option value="">— اختر القسم —</option>
            {cats.map(c => (
              <option key={c.id} value={c.id}>{locale==='ar' ? (c.name?.ar || c.slug) : (c.name?.en || c.slug)}</option>
            ))}
          </select>
        </div>
        {/* Images gallery inputs */}
        <label className="block text-sm mb-1">صور المنتج (روابط)</label>
        <div className="mb-2">
          {/* Optional: upload a file when connected to server */}
          {serverEnabled && editing && (
            <div className="mb-2 flex items-center gap-2">
              <input type="file" accept="image/*" onChange={async (e)=>{
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setUploading(true); setErr(null);
                  const res = await api.sellerProductUploadImage(editing, file);
                  if (res?.url) {
                    const next = [res.url, ...(form.images||[])];
                    setForm({...form, images: next});
                    await reloadServer();
                  }
                } catch (ex) {
                  setErr(ex?.message || 'فشل رفع الصورة');
                } finally { setUploading(false); }
              }} />
              {uploading && <span className="text-xs text-gray-500">يرفع...</span>}
            </div>
          )}
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
        {busy && <div className="text-sm text-gray-500">جاري التنفيذ...</div>}
        {err && <div className="text-sm text-red-600">{String(err)}</div>}
        {products && products.map(p => (
          <div key={p.id} className="p-3 border rounded flex items-center justify-between">
            <div className="flex items-center gap-4">
              {((p.images && p.images.length>0) ? <img src={p.images[0]} alt={displayName(p)} className="w-16 h-16 object-cover rounded" /> : (p.image ? <img src={p.image} alt={displayName(p)} className="w-16 h-16 object-cover rounded" /> : <div className="w-16 h-16 bg-gray-200" />))}
              <div>
                <div className="font-semibold">{displayName(p)}</div>
                <div className="text-sm text-gray-600">{p.price} ر.س</div>
              </div>
            </div>
            <div>
              <button className="text-blue-600 mr-3" onClick={() => startEdit(p)}>تعديل</button>
              <button className="text-red-600" onClick={() => handleDelete(p.id)}>حذف</button>
            </div>
          </div>
        ))}
        {(!products || products.length === 0) && (
          <div className="p-4 border rounded bg-white text-sm">
            <div className="mb-2">لا توجد منتجات لديك</div>
            <button className="btn-primary" onClick={() => {
              const demo = {
                id: `p_${Date.now()}`,
                name: 'منتج تجريبي',
                price: 25,
                images: ['/vite.svg'],
                description: 'وصف مختصر للمنتج التجريبي',
                sellerId,
              };
              if (store) store.addProduct(demo); else persistLocal([demo, ...(localProducts||[])]);
            }}>إنشاء منتج تجريبي سريع</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManager;

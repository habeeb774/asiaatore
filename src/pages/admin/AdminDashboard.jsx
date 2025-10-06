import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import api from '../../api/client';
import { adminApi } from '../../api/admin';
import { Edit3, Trash2, Plus, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const AdminDashboard = () => {
  const { user } = useAuth() || {};
  const isAdmin = user?.role === 'admin';

  const {
    products: adminProducts, users, orders,
    addProduct, updateProduct, deleteProduct,
    addUser, updateUser, deleteUser,
    addOrder, updateOrder, deleteOrder
  } = useAdmin();

  // Local shadow list for API-backed products (to avoid breaking existing context usage)
  const [apiProducts, setApiProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [prodError, setProdError] = useState(null);

  const effectiveProducts = apiProducts.length ? apiProducts : adminProducts;

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const view = params.get('view') || 'overview';
  // New: remote data for admin specifics
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteAudit, setRemoteAudit] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  // Removed remoteStats (panel did not contain counts) – derive counts locally
  const [auditReload, setAuditReload] = useState(0);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [errorRemote, setErrorRemote] = useState(null);

  const setView = v => {
    params.set('view', v);
    navigate(`/admin?${params.toString()}`, { replace: true });
  };

  const [productForm, setProductForm] = useState({ id: null, nameAr: '', nameEn: '', price: '', stock: '', status: 'active', category: 'general', oldPrice: '', image: '' });
  const [productImageFile, setProductImageFile] = useState(null);
  const [imageMode, setImageMode] = useState('file'); // 'file' | 'url'
  const fileInputRef = useRef(null);
  // New stats
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, avgOrderValueToday: 0, pendingBankCount: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [sort, setSort] = useState('created_desc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [audit, setAudit] = useState([]);
  const quickAdminLogin = async () => {
    try {
      const resp = await api.authLogin('admin@example.com', 'Admin123!');
      if (resp?.token) {
        try { localStorage.setItem('my_store_token', resp.token); } catch {}
        alert('تم تسجيل الدخول كمدير (dev). أعد المحاولة.');
      }
    } catch (e) {
      alert('فشل تسجيل الدخول التلقائي: ' + e.message);
    }
  };
  const [userForm, setUserForm] = useState({ id: null, name: '', role: 'user', active: true });
  const [orderForm, setOrderForm] = useState({ id: null, total: '', status: 'pending', customer: '', items: 1 });
  const [filter, setFilter] = useState('');
  const f = filter.toLowerCase();

  const filteredProducts = useMemo(() => {
    let list = effectiveProducts.map(p => ({...p, _flatName: (p.name?.ar || p.name?.en || p.name || '').toLowerCase()}));
    if (f) list = list.filter(p => p._flatName.includes(f));
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter);
    list = [...list].sort((a,b) => {
      switch (sort) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'stock_asc': return a.stock - b.stock;
        case 'stock_desc': return b.stock - a.stock;
        case 'created_asc': return a.id.localeCompare(b.id);
        case 'created_desc':
        default: return b.id.localeCompare(a.id);
      }
    });
    return list;
  }, [effectiveProducts, f, categoryFilter, sort]);
  // ------- Tier Pricing (per product) -------
  const [openTierProductId, setOpenTierProductId] = useState(null); // which product row expanded
  const [tiersByProduct, setTiersByProduct] = useState({}); // productId -> list
  const [tierLoading, setTierLoading] = useState(false);
  const [tierError, setTierError] = useState(null);
  const emptyTierForm = { id:null, minQty:'', price:'', packagingType:'unit', noteAr:'', noteEn:'' };
  const [tierForm, setTierForm] = useState(emptyTierForm);
  const packagingOptions = ['unit','carton','bundle'];
  const loadTiers = async (productId) => {
    setTierLoading(true); setTierError(null);
    try {
      const list = await api.tierList(productId);
      setTiersByProduct(m => ({ ...m, [productId]: list }));
    } catch (e) { setTierError(e.message); } finally { setTierLoading(false); }
  };
  const toggleTiers = (productId) => {
    setTierError(null);
    setTierForm(emptyTierForm);
    if (openTierProductId === productId) { setOpenTierProductId(null); return; }
    setOpenTierProductId(productId);
    if (!tiersByProduct[productId]) loadTiers(productId);
  };
  const submitTier = async (e) => {
    e.preventDefault();
    if (!openTierProductId) return;
    setTierLoading(true); setTierError(null);
    try {
      if (tierForm.id) {
        const updated = await api.tierUpdate(tierForm.id, {
          minQty: +tierForm.minQty,
            price: +tierForm.price,
            packagingType: tierForm.packagingType,
            noteAr: tierForm.noteAr || null,
            noteEn: tierForm.noteEn || null
        });
        setTiersByProduct(m => ({ ...m, [openTierProductId]: (m[openTierProductId]||[]).map(t => t.id===updated.id ? updated : t) }));
      } else {
        const created = await api.tierCreate(openTierProductId, {
          minQty: +tierForm.minQty,
          price: +tierForm.price,
          packagingType: tierForm.packagingType,
          noteAr: tierForm.noteAr || null,
          noteEn: tierForm.noteEn || null
        });
        setTiersByProduct(m => ({ ...m, [openTierProductId]: [ ...(m[openTierProductId]||[]), created ].sort((a,b)=>a.minQty-b.minQty) }));
      }
      setTierForm(emptyTierForm);
    } catch (e) {
      // Handle duplicate error code message pattern from client API
      setTierError(e.message.includes('DUPLICATE_TIER') ? 'شريحة مكررة لنفس الحد الأدنى ونوع التغليف' : e.message);
    } finally { setTierLoading(false); }
  };
  const editTier = (tier) => {
    setTierForm({ id:tier.id, minQty:tier.minQty, price:tier.price, packagingType:tier.packagingType, noteAr:tier.note?.ar||'', noteEn:tier.note?.en||'' });
  };
  const deleteTier = async (tier) => {
    if (!window.confirm('حذف الشريحة؟')) return;
    setTierLoading(true); setTierError(null);
    try {
      await api.tierDelete(tier.id);
      setTiersByProduct(m => ({ ...m, [openTierProductId]: (m[openTierProductId]||[]).filter(t => t.id !== tier.id) }));
    } catch (e) { setTierError(e.message); } finally { setTierLoading(false); }
  };
  const effectiveUsers = remoteUsers.length ? remoteUsers : users;
  const filteredUsers = useMemo(
    () => effectiveUsers.filter(u => (u.name||'').toLowerCase().includes(f) || (u.role||'').includes(f)),
    [effectiveUsers, f]
  );
  // Orders filters (advanced)
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [orderMethodFilter, setOrderMethodFilter] = useState('');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  // Expanded address row controller for admin orders table
  const [openAddrOrder, setOpenAddrOrder] = useState(null);
  // Store settings state
  const [storeSettings, setStoreSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsLogoFile, setSettingsLogoFile] = useState(null);
  // Use SettingsContext directly (must follow hooks rules)
  const settingsCtx = useSettings();
  useEffect(() => {
    if (settingsCtx?.setting) setStoreSettings(settingsCtx.setting);
  }, [settingsCtx?.setting]);
  // Categories for product form (dynamic list)
  const [catList, setCatList] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState(null);
  // Brands management state
  const [brands, setBrands] = useState([]);
  const [brandIssues, setBrandIssues] = useState(null);
  const [brandForm, setBrandForm] = useState({ id:null, slug:'', nameAr:'', nameEn:'', descriptionAr:'', descriptionEn:'', logo:'' });
  const [brandLogoFile, setBrandLogoFile] = useState(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState(null);
  const [brandFilter, setBrandFilter] = useState('');
  const [brandSort, setBrandSort] = useState('created_desc');
  // Brand maintenance UI state
  const [brandIssueView, setBrandIssueView] = useState(''); // '', 'duplicates', 'noLogo', 'zeroProducts', 'missingVariants'
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeSourceIds, setMergeSourceIds] = useState([]);
  const [mergeFilter, setMergeFilter] = useState('');
  // Marketing management state
  const [marketingFeatures, setMarketingFeatures] = useState([]);
  const [marketingBanners, setMarketingBanners] = useState([]);
  const [marketingAppLinks, setMarketingAppLinks] = useState([]);
  const [featureForm, setFeatureForm] = useState({ id:null, titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', icon:'', sort:0, active:true });
  const [bannerForm, setBannerForm] = useState({ id:null, location:'homepage', titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', image:'', linkUrl:'', sort:0, active:true });
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [appLinkForm, setAppLinkForm] = useState({ id:null, platform:'web', url:'', labelAr:'', labelEn:'', active:true });
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingError, setMarketingError] = useState(null);
  const [featureFilter, setFeatureFilter] = useState('');
  const [bannerFilter, setBannerFilter] = useState('');
  const [appLinkFilter, setAppLinkFilter] = useState('');
  const [featureSort, setFeatureSort] = useState('sort_asc');
  const [bannerSort, setBannerSort] = useState('sort_asc');
  const [appLinkSort, setAppLinkSort] = useState('platform_asc');
  const [marketingMetrics,setMarketingMetrics] = useState(null);
  const [marketingMetricsDays,setMarketingMetricsDays] = useState(30);
  const loadMarketingMetrics = async(d=marketingMetricsDays)=>{ try { const m = await api.marketingMetrics(d); setMarketingMetrics(m); } catch(e){ console.error('metrics',e); } };
  useEffect(()=> { if (view==='marketing' && marketingMetrics==null) loadMarketingMetrics(); }, [view]);
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (f && !( (o.id+'').toLowerCase().includes(f) || (o.status||'').includes(f) || (''+o.total).includes(f) )) return false;
      if (orderStatusFilter && o.status !== orderStatusFilter) return false;
      if (orderMethodFilter && o.paymentMethod !== orderMethodFilter) return false;
      if (orderDateFrom) {
        const d = new Date(orderDateFrom);
        if (!isNaN(d) && new Date(o.createdAt) < d) return false;
      }
      if (orderDateTo) {
        const d = new Date(orderDateTo);
        if (!isNaN(d)) {
          // include entire day
          d.setHours(23,59,59,999);
          if (new Date(o.createdAt) > d) return false;
        }
      }
      return true;
    });
  }, [orders, f, orderStatusFilter, orderMethodFilter, orderDateFrom, orderDateTo]);

  // ------- Brands Handlers -------
  const loadBrands = async () => {
    setBrandLoading(true); setBrandError(null);
    try { const list = await api.brandsList(); setBrands(list); } catch (e) { setBrandError(e.message); } finally { setBrandLoading(false); }
  };
  const scanBrandIssues = async () => {
    setBrandLoading(true); setBrandError(null);
    try {
      const res = await fetch('/api/brands/maintenance/scan', { headers: authHeadersMaybe() });
      if (!res.ok) throw new Error('فشل الفحص');
      const data = await res.json();
      setBrandIssues(data.issues || {});
    } catch (e) { setBrandError(e.message); } finally { setBrandLoading(false); }
  };
  const regenBrandLogos = async (brandId) => {
    setBrandLoading(true); setBrandError(null);
    try {
      const res = await fetch('/api/brands/maintenance/regen-logos', { method:'POST', headers: { ...authHeadersMaybe(), 'Content-Type':'application/json' }, body: JSON.stringify(brandId? { brandId } : {}) });
      if (!res.ok) throw new Error('فشل إعادة توليد الصور');
      await scanBrandIssues();
      alert('تمت إعادة توليد صور الشعارات');
    } catch (e) { setBrandError(e.message); } finally { setBrandLoading(false); }
  };
  const mergeBrands = async (targetId, sourceIds) => {
    setBrandLoading(true); setBrandError(null);
    try {
      const res = await fetch('/api/brands/maintenance/merge', { method:'POST', headers: { ...authHeadersMaybe(), 'Content-Type':'application/json' }, body: JSON.stringify({ targetId, sourceIds }) });
      if (!res.ok) throw new Error('فشل الدمج');
      await loadBrands();
      await scanBrandIssues();
      alert('تم الدمج بنجاح');
    } catch (e) { setBrandError(e.message); } finally { setBrandLoading(false); }
  };
  const submitBrand = async (e) => {
    e.preventDefault();
    setBrandLoading(true); setBrandError(null);
    try {
      const useFormData = !!brandLogoFile;
      let payload;
      if (useFormData) {
        payload = new FormData();
        if (brandForm.slug) payload.append('slug', brandForm.slug);
        payload.append('nameAr', brandForm.nameAr);
        payload.append('nameEn', brandForm.nameEn);
        if (brandForm.descriptionAr) payload.append('descriptionAr', brandForm.descriptionAr);
        if (brandForm.descriptionEn) payload.append('descriptionEn', brandForm.descriptionEn);
        if (brandLogoFile) payload.append('logo', brandLogoFile);
      } else {
        payload = {
          slug: brandForm.slug || undefined,
          nameAr: brandForm.nameAr, nameEn: brandForm.nameEn,
          descriptionAr: brandForm.descriptionAr || null,
          descriptionEn: brandForm.descriptionEn || null,
          logo: brandForm.logo || null
        };
      }
      if (brandForm.id) {
        const updated = useFormData ? await fetch(`/api/brands/${brandForm.id}`, { method:'PUT', body: payload, headers: authHeadersMaybe() }).then(r=>r.json()) : await api.brandUpdate(brandForm.id, payload);
        if (updated?.id) setBrands(bs => bs.map(b => b.id === updated.id ? updated : b));
      } else {
        const created = useFormData ? await fetch('/api/brands', { method:'POST', body: payload, headers: authHeadersMaybe() }).then(r=>r.json()) : await api.brandCreate(payload);
        if (created?.id) setBrands(bs => [created, ...bs]);
      }
      setBrandForm({ id:null, slug:'', nameAr:'', nameEn:'', descriptionAr:'', descriptionEn:'', logo:'' }); setBrandLogoFile(null);
    } catch (e) { setBrandError(e.message); } finally { setBrandLoading(false); }
  };
  const deleteBrand = async (id) => {
    const choice = window.prompt('حذف العلامة؟ اكتب: none لإلغاء ربط المنتجات (force)، أو brand:<TARGET_ID> لإعادة ربط المنتجات لعلامة أخرى، أو اتركه فارغ للحذف المباشر إذا لا توجد منتجات.');
    let url = `/api/brands/${id}`;
    if (choice && choice.startsWith('brand:')) {
      const targetId = choice.split(':')[1];
      url += `?reassignTo=${encodeURIComponent(targetId)}`;
    } else if (choice === 'none') {
      url += `?force=1`;
    }
    try {
      const res = await fetch(url, { method:'DELETE', headers: authHeadersMaybe() });
      if (!res.ok) throw new Error('فشل الحذف');
      setBrands(bs => bs.filter(b => b.id !== id));
    } catch (e) { alert('فشل الحذف: '+e.message); }
  };

  // ------- Marketing Handlers -------
  const loadMarketing = async () => {
    setMarketingLoading(true); setMarketingError(null);
    try {
      const [features, banners, appLinks] = await Promise.all([
        api.marketingFeatures(),
        api.marketingBanners(),
        api.marketingAppLinks()
      ]);
      setMarketingFeatures(features); setMarketingBanners(banners); setMarketingAppLinks(appLinks);
    } catch (e) { setMarketingError(e.message); } finally { setMarketingLoading(false); }
  };
  const submitFeature = async (e) => {
    e.preventDefault(); setMarketingLoading(true); setMarketingError(null);
    try {
      if (featureForm.id) {
        const updated = await api.marketingFeatureUpdate(featureForm.id, {
          titleAr: featureForm.titleAr, titleEn: featureForm.titleEn,
          bodyAr: featureForm.bodyAr || null, bodyEn: featureForm.bodyEn || null,
          icon: featureForm.icon || null, sort: featureForm.sort, active: featureForm.active
        });
        setMarketingFeatures(fs => fs.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await api.marketingFeatureCreate({
          titleAr: featureForm.titleAr, titleEn: featureForm.titleEn,
          bodyAr: featureForm.bodyAr || null, bodyEn: featureForm.bodyEn || null,
          icon: featureForm.icon || null, sort: featureForm.sort, active: featureForm.active
        });
        setMarketingFeatures(fs => [created, ...fs]);
      }
      setFeatureForm({ id:null, titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', icon:'', sort:0, active:true });
    } catch (e) { setMarketingError(e.message); } finally { setMarketingLoading(false); }
  };
  const deleteFeature = async (id) => {
    if (!window.confirm('حذف الميزة؟')) return;
    try { await api.marketingFeatureDelete(id); setMarketingFeatures(fs => fs.filter(f => f.id !== id)); } catch (e) { alert('فشل الحذف: '+e.message); }
  };
  const submitBanner = async (e) => {
    e.preventDefault(); setMarketingLoading(true); setMarketingError(null);
    try {
      const useFormData = !!bannerImageFile;
      let payload;
      if (useFormData) {
        payload = new FormData();
        payload.append('location', bannerForm.location);
        if (bannerForm.titleAr) payload.append('titleAr', bannerForm.titleAr);
        if (bannerForm.titleEn) payload.append('titleEn', bannerForm.titleEn);
        if (bannerForm.bodyAr) payload.append('bodyAr', bannerForm.bodyAr);
        if (bannerForm.bodyEn) payload.append('bodyEn', bannerForm.bodyEn);
        if (bannerForm.linkUrl) payload.append('linkUrl', bannerForm.linkUrl);
        payload.append('sort', bannerForm.sort);
        payload.append('active', bannerForm.active ? '1':'0');
        if (bannerImageFile) payload.append('image', bannerImageFile);
      } else {
        payload = {
          location: bannerForm.location,
          titleAr: bannerForm.titleAr || null, titleEn: bannerForm.titleEn || null,
          bodyAr: bannerForm.bodyAr || null, bodyEn: bannerForm.bodyEn || null,
          image: bannerForm.image || null, linkUrl: bannerForm.linkUrl || null,
          sort: bannerForm.sort, active: bannerForm.active
        };
      }
      if (bannerForm.id) {
        const updated = useFormData ? await fetch(`/api/marketing/banners/${bannerForm.id}`, { method:'PATCH', body: payload, headers: authHeadersMaybe() }).then(r=>r.json()) : await api.marketingBannerUpdate(bannerForm.id, payload);
        if (updated?.id) setMarketingBanners(bs => bs.map(b => b.id === updated.id ? updated : b));
      } else {
        const created = useFormData ? await fetch('/api/marketing/banners', { method:'POST', body: payload, headers: authHeadersMaybe() }).then(r=>r.json()) : await api.marketingBannerCreate(payload);
        if (created?.id) setMarketingBanners(bs => [created, ...bs]);
      }
      setBannerForm({ id:null, location:'homepage', titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', image:'', linkUrl:'', sort:0, active:true }); setBannerImageFile(null);
    } catch (e) { setMarketingError(e.message); } finally { setMarketingLoading(false); }
  };
  const deleteBanner = async (id) => {
    if (!window.confirm('حذف البانر؟')) return; try { await api.marketingBannerDelete(id); setMarketingBanners(bs => bs.filter(b => b.id !== id)); } catch (e) { alert('فشل الحذف: '+e.message); }
  };
  const submitAppLink = async (e) => {
    e.preventDefault(); setMarketingLoading(true); setMarketingError(null);
    try {
      if (appLinkForm.id) {
        const updated = await api.marketingAppLinkUpdate(appLinkForm.id, {
          platform: appLinkForm.platform, url: appLinkForm.url,
          labelAr: appLinkForm.labelAr || null, labelEn: appLinkForm.labelEn || null,
          active: appLinkForm.active
        });
        setMarketingAppLinks(as => as.map(a => a.id === updated.id ? updated : a));
      } else {
        const created = await api.marketingAppLinkCreate({
          platform: appLinkForm.platform, url: appLinkForm.url,
          labelAr: appLinkForm.labelAr || null, labelEn: appLinkForm.labelEn || null,
          active: appLinkForm.active
        });
        setMarketingAppLinks(as => [created, ...as]);
      }
      setAppLinkForm({ id:null, platform:'web', url:'', labelAr:'', labelEn:'', active:true });
    } catch (e) { setMarketingError(e.message); } finally { setMarketingLoading(false); }
  };
  const deleteAppLink = async (id) => {
    if (!window.confirm('حذف الرابط؟')) return; try { await api.marketingAppLinkDelete(id); setMarketingAppLinks(as => as.filter(a => a.id !== id)); } catch (e) { alert('فشل الحذف: '+e.message); }
  };

  // Auto load brands / marketing when entering tabs
  useEffect(()=> { if (view==='brands' && !brands.length) loadBrands(); }, [view]);
  useEffect(()=> { if (view==='marketing' && !marketingFeatures.length && !marketingBanners.length) loadMarketing(); }, [view]);
  useEffect(()=> { if (view==='settings' && !storeSettings) loadSettings(); }, [view]);

  // Auth header helper for manual fetch with FormData (avoid setting content-type manually)
  function authHeadersMaybe(){
    try { const t = localStorage.getItem('my_store_token'); if (t) return { Authorization: 'Bearer '+t }; } catch {}
    return {};
  }

  // Derived filtered/sorted brand list
  const visibleBrands = useMemo(()=> {
    let list = [...brands];
    // Filter by maintenance issue view
    const issueSets = (()=>{
      const empty = { duplicates: new Set(), noLogo: new Set(), zeroProducts: new Set(), missingVariants: new Set() };
      if (!brandIssues) return empty;
      const sets = { ...empty };
      // duplicate groups contain { ids: [] }
      for (const g of (brandIssues.duplicateNames||[])) {
        for (const id of (g.ids||[])) sets.duplicates.add(id);
      }
      for (const b of (brandIssues.noLogo||[])) sets.noLogo.add(b.id);
      for (const b of (brandIssues.zeroProducts||[])) sets.zeroProducts.add(b.id);
      for (const m of (brandIssues.missingLogoVariants||[])) sets.missingVariants.add(m.id);
      return sets;
    })();
    if (brandIssueView) {
      const set = issueSets[brandIssueView] || new Set();
      list = list.filter(b => set.has(b.id));
    }
    if (brandFilter) {
      const needle = brandFilter.toLowerCase();
      list = list.filter(b => (b.name?.ar||'').toLowerCase().includes(needle) || (b.name?.en||'').toLowerCase().includes(needle) || (b.slug||'').toLowerCase().includes(needle));
    }
    list.sort((a,b)=>{
      switch (brandSort) {
        case 'name_ar': return (a.name?.ar||'').localeCompare(b.name?.ar||'');
        case 'name_en': return (a.name?.en||'').localeCompare(b.name?.en||'');
        case 'products_desc': return (b.productCount||0) - (a.productCount||0);
        case 'products_asc': return (a.productCount||0) - (b.productCount||0);
        case 'created_asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created_desc':
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [brands, brandFilter, brandSort]);

  const visibleFeatures = useMemo(()=> {
    let list = [...marketingFeatures];
    if (featureFilter) {
      const n = featureFilter.toLowerCase();
      list = list.filter(f => (f.title?.ar||'').toLowerCase().includes(n) || (f.title?.en||'').toLowerCase().includes(n));
    }
    list.sort((a,b)=>{
      switch (featureSort) {
        case 'title_ar': return (a.title?.ar||'').localeCompare(b.title?.ar||'');
        case 'title_en': return (a.title?.en||'').localeCompare(b.title?.en||'');
        case 'sort_desc': return (b.sort||0) - (a.sort||0);
        case 'sort_asc':
        default: return (a.sort||0) - (b.sort||0);
      }
    });
    return list;
  }, [marketingFeatures, featureFilter, featureSort]);

  const visibleBanners = useMemo(()=> {
    let list = [...marketingBanners];
    if (bannerFilter) { const n = bannerFilter.toLowerCase(); list = list.filter(b => (b.title?.ar||'').toLowerCase().includes(n) || (b.title?.en||'').toLowerCase().includes(n) || (b.location||'').toLowerCase().includes(n)); }
    list.sort((a,b)=>{
      switch (bannerSort) {
        case 'location': return (a.location||'').localeCompare(b.location||'');
        case 'sort_desc': return (b.sort||0) - (a.sort||0);
        case 'sort_asc':
        default: return (a.sort||0) - (b.sort||0);
      }
    });
    return list;
  }, [marketingBanners, bannerFilter, bannerSort]);

  const visibleAppLinks = useMemo(()=> {
    let list = [...marketingAppLinks];
    if (appLinkFilter) { const n = appLinkFilter.toLowerCase(); list = list.filter(a => (a.platform||'').toLowerCase().includes(n) || (a.url||'').toLowerCase().includes(n)); }
    list.sort((a,b)=>{
      switch (appLinkSort) {
        case 'platform_desc': return (b.platform||'').localeCompare(a.platform||'');
        case 'platform_asc':
        default: return (a.platform||'').localeCompare(b.platform||'');
      }
    });
    return list;
  }, [marketingAppLinks, appLinkFilter, appLinkSort]);

  const resetForms = () => {
    setProductForm({ id: null, nameAr: '', nameEn: '', price: '', stock: '', status: 'active', category: 'general', oldPrice: '', image: '' });
    setProductImageFile(null);
    setUserForm({ id: null, name: '', role: 'user', active: true });
    setOrderForm({ id: null, total: '', status: 'pending', customer: '', items: 1 });
  };

  // ------- Store Settings Handlers -------
  const loadSettings = async () => {
    if (settingsCtx?.setting) { setStoreSettings(settingsCtx.setting); return; }
    setSettingsLoading(true); setSettingsError(null);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json().catch(()=>null);
      if (data?.setting) setStoreSettings(data.setting);
    } catch (e) { setSettingsError(e.message); } finally { setSettingsLoading(false); }
  };
  const uploadStoreLogo = async () => {
    if (!settingsLogoFile) return;
    setSettingsLoading(true); setSettingsError(null);
    try {
      if (settingsCtx?.uploadLogo) {
        const newLogo = await settingsCtx.uploadLogo(settingsLogoFile);
        if (settingsCtx?.setting) setStoreSettings(settingsCtx.setting);
      } else {
        const fd = new FormData(); fd.append('logo', settingsLogoFile);
        const res = await fetch('/api/settings/logo', { method:'POST', headers: authHeadersMaybe(), body: fd });
        if (!res.ok) throw new Error('فشل رفع الشعار');
        const data = await res.json();
        if (data?.setting) setStoreSettings(data.setting);
      }
      setSettingsLogoFile(null);
      alert('تم رفع الشعار بنجاح');
    } catch (e) { setSettingsError(e.message); } finally { setSettingsLoading(false); }
  };

  const submitProduct = async e => {
    e.preventDefault();
  const useFormData = imageMode === 'file' && !!productImageFile; // only switch to multipart if a file chosen
    let payload;
    if (useFormData) {
      payload = new FormData();
      payload.append('nameAr', productForm.nameAr || productForm.nameEn || 'منتج');
      payload.append('nameEn', productForm.nameEn || productForm.nameAr || 'Product');
      payload.append('price', productForm.price || '0');
      payload.append('stock', productForm.stock || '0');
      payload.append('status', productForm.status || 'active');
      if (productForm.slug) payload.append('slug', productForm.slug);
      payload.append('category', productForm.category || 'general');
      if (productForm.oldPrice) payload.append('oldPrice', productForm.oldPrice);
      if (productImageFile) payload.append('image', productImageFile);
    } else {
      payload = {
        name: { ar: productForm.nameAr || productForm.nameEn || 'منتج', en: productForm.nameEn || productForm.nameAr || 'Product' },
        price: +productForm.price,
        stock: +productForm.stock,
        status: productForm.status,
        slug: productForm.slug,
        category: productForm.category || 'general',
        oldPrice: productForm.oldPrice ? +productForm.oldPrice : undefined,
        image: imageMode === 'url' ? (productForm.image || undefined) : (productForm.image || undefined)
      };
    }
    try {
      setLoadingProducts(true);
      if (productForm.id && apiProducts.length) {
        const updated = useFormData
          ? await api.updateProductForm(productForm.id, payload)
          : await api.updateProduct(productForm.id, payload);
        setApiProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        setAudit(a => [{ ts: Date.now(), action: 'update_product', id: updated.id }, ...a].slice(0,200));
      } else if (apiProducts.length) {
        const created = useFormData
          ? await api.createProductForm(payload)
          : await api.createProduct(payload);
        setApiProducts(prev => [created, ...prev]);
        setAudit(a => [{ ts: Date.now(), action: 'create_product', id: created.id }, ...a].slice(0,200));
      } else {
        // fallback to old context behavior
        if (productForm.id) {
          updateProduct(productForm.id, payload);
          setAudit(a => [{ ts: Date.now(), action: 'update_product_local', id: productForm.id }, ...a].slice(0,200));
        } else {
          addProduct(payload);
          setAudit(a => [{ ts: Date.now(), action: 'create_product_local' }, ...a].slice(0,200));
        }
      }
      resetForms();
    } catch (err) {
      const msg = err?.message || '';
      let friendly = msg;
      if (msg.includes('UNSUPPORTED_FILE_TYPE')) friendly = 'صيغة صورة غير مدعومة. المسموح: JPG/PNG/WEBP';
      else if (msg.includes('FILE_TOO_LARGE')) friendly = 'حجم الملف أكبر من الحد (4MB)';
      else if (msg.includes('UPLOAD_ERROR')) friendly = 'فشل رفع الصورة. جرّب ملفاً آخر';
      else if (msg.includes('FORBIDDEN')) friendly = 'تحتاج صلاحيات مدير. استخدم زر "تسجيل مدير (dev)" أو سجّل دخول كمدير.';
      setProdError(friendly);
    } finally {
      setLoadingProducts(false);
    }
  };

  const submitUser = e => {
    e.preventDefault();
    if (userForm.id) {
      updateUser(userForm.id, userForm);
    } else {
      addUser(userForm);
    }
    resetForms();
  };

  const submitOrder = e => {
    e.preventDefault();
    if (orderForm.id) {
      updateOrder(orderForm.id, {
        total: +orderForm.total,
        status: orderForm.status,
        customer: orderForm.customer,
        items: +orderForm.items
      });
    } else {
      addOrder(orderForm);
    }
    resetForms();
  };

  const Stat = ({ label, value }) => (
    <div style={statBox}>
      <div style={statValue}>{value}</div>
      <div style={statLabel}>{label}</div>
    </div>
  );

  // Fetch products from API on mount (non-blocking). If it fails, fallback stays (context products)
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingProducts(true); setProdError(null);
      try {
        const list = await api.listProducts();
        if (active && Array.isArray(list)) setApiProducts(list);
      } catch (e) {
        if (active) setProdError(e.message);
      } finally {
        if (active) setLoadingProducts(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Load categories when entering products tab (with short TTL cache)
  useEffect(() => {
    if (view !== 'products') return;
    let mounted = true;
    const cacheKey = 'admin_cat_cache_v1';
    const ttl = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.expires > now && Array.isArray(cached.data)) {
          setCatList(cached.data);
        }
      }
    } catch {}
    setCatLoading(true); setCatError(null);
    api.listCategories({ withCounts: 1 }).then(res => {
      const list = Array.isArray(res?.categories) ? res.categories : [];
      // dedupe by slug, sort by productCount desc then Arabic name
      const map = new Map();
      for (const c of list) { if (c?.slug && !map.has(c.slug)) map.set(c.slug, c); }
      const uniq = Array.from(map.values()).sort((a,b) => (b.productCount||0) - (a.productCount||0) || String(a.name?.ar||a.name?.en||a.slug).localeCompare(String(b.name?.ar||b.name?.en||b.slug), 'ar'));
      if (mounted) setCatList(uniq);
      try { localStorage.setItem(cacheKey, JSON.stringify({ data: uniq, expires: now + ttl })); } catch {}
    }).catch(err => { if (mounted) setCatError(err.message||'فشل تحميل التصنيفات'); }).finally(() => { if (mounted) setCatLoading(false); });
    return () => { mounted = false; };
  }, [view]);

  const catOptions = useMemo(() => catList.map(c => ({ value: c.slug, label: c.name?.ar || c.name?.en || c.slug })), [catList]);

  // Fetch users + panel stats + initial audit logs (page 1) when entering related views
  useEffect(() => {
    let active = true;
    (async () => {
      if (!['users','overview','audit'].includes(view)) return; // only fetch when needed
      setLoadingRemote(true); setErrorRemote(null);
      try {
        const tasks = [];
        if (view === 'users' || view === 'overview') tasks.push(adminApi.listUsers().catch(e => ({ error:e })));
  // (Optional panel endpoint skipped – not needed for counts now)
        if (view === 'audit') tasks.push(adminApi.listAudit({ page: auditPage }).catch(e => ({ error:e })));
        if (view === 'overview') tasks.push(adminApi.statsOverview().catch(e => ({ error:e })));
        const results = await Promise.all(tasks);
        let idx = 0;
        if (view === 'users' || view === 'overview') {
          const r = results[idx++];
            if (!r?.error && r?.users) setRemoteUsers(r.users);
        }
        // Skip remoteStats handling (removed)
        if (view === 'audit') {
          const a = results[idx++];
          if (!a?.error && a?.logs) {
            setRemoteAudit(a.logs);
            setAuditTotalPages(a.totalPages || 1);
          }
        }
        if (view === 'overview') {
          const s = results[results.length - 1];
          if (!s?.error && s?.stats) setStats(s.stats);
        }
      } catch (e) {
        if (active) setErrorRemote(e.message);
      } finally {
        if (active) setLoadingRemote(false);
      }
    })();
    return () => { active = false; };
  }, [view, auditPage, auditReload]);

  const refreshAudit = () => { setAuditReload(x => x + 1); };

  if (!isAdmin) {
    return (
      <div style={{direction:'rtl',padding:'2rem',maxWidth:520,margin:'2rem auto',background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,boxShadow:'0 6px 28px -8px rgba(0,0,0,.12)'}}>
        <h2 style={{marginTop:0,fontSize:'1.1rem'}}>🚫 صلاحيات غير كافية</h2>
        <p style={{fontSize:'.75rem',lineHeight:1.7,color:'#475569'}}>لا تملك صلاحية الوصول إلى لوحة المدير. إذا كنت تعتقد أن هذا خطأ، تواصل مع المدير الرئيسي.</p>
        <a href="/" style={{display:'inline-block',marginTop:12,fontSize:'.7rem',fontWeight:600,color:'#69be3c',textDecoration:'none'}}>العودة للرئيسية</a>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <h1 style={title}>لوحة التحكم</h1>

      <div style={tabsBar}>
        {{
          overview: 'نظرة عامة',
          products: 'المنتجات',
          users: 'المستخدمون',
          orders: 'الطلبات',
          audit: 'السجلات',
          brands: 'العلامات',
          marketing: 'التسويق',
          settings: 'الإعدادات'
        }[view]}
        <div style={{ marginInlineStart: 'auto' }}>
          <input
            placeholder="بحث..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={searchInput}
          />
          {/* Dev helper: quick admin login if 403 occurs during create */}
          <button type="button" onClick={quickAdminLogin} style={{...ghostBtn, marginInlineStart: 6}}>تسجيل مدير (dev)</button>
        </div>
      </div>

      {/* Tab buttons */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:'.75rem'}}>
        {[
          ['overview','نظرة عامة'],
          ['products','المنتجات'],
          ['users','المستخدمون'],
          ['orders','الطلبات'],
          ['audit','السجلات'],
          ['reviews','المراجعات'],
          ['brands','العلامات'],
          ['marketing','التسويق'],
          ['settings','الإعدادات'],
          ['cats','التصنيفات']
        ].map(([id,label]) => (
          <button key={id} onClick={()=>setView(id)} style={view===id?tabBtnActive:tabBtn}>{label}</button>
        ))}
      </div>

      {/* Overview */}
      {view === 'overview' && (
        <div style={grid3}>
          <Stat label="طلبات اليوم" value={stats.todayOrders} />
          <Stat label="إيراد اليوم" value={stats.todayRevenue.toFixed(2)} />
          <Stat label="متوسط السلة (اليوم)" value={stats.avgOrderValueToday.toFixed(2)} />
          <div style={statBox}>
            <div style={statValue}>{stats.pendingBankCount}</div>
            <div style={statLabel}>تحويلات بنكية معلقة</div>
            <div style={{marginTop:6}}>
              <a href="/admin/bank-transfers" style={{fontSize:'.7rem',textDecoration:'none',color:'#69be3c'}}>مراجعة الآن →</a>
            </div>
          </div>
          <Stat label="إجمالي المنتجات" value={effectiveProducts.length} />
          <Stat label="المستخدمون" value={remoteUsers.length || users.length} />
          <Stat label="كل الطلبات (محلي)" value={orders.length} />
          <div style={{gridColumn:'1/-1'}}>
            <h3 style={subTitle}>سجل النشاط</h3>
            <ul style={{listStyle:'none',margin:0,padding:0,maxHeight:200,overflow:'auto',fontSize:'.65rem',direction:'ltr'}}>
              {audit.slice(0,12).map(a => (
                <li key={a.ts+''+a.action}>{new Date(a.ts).toLocaleTimeString()} - {a.action} {a.id||''}</li>
              ))}
              {!audit.length && <li>لا يوجد نشاط بعد.</li>}
            </ul>
            {loadingRemote && <div style={{fontSize:'.6rem',color:'#64748b'}}>...تحميل</div>}
            {errorRemote && <div style={{fontSize:'.6rem',color:'#b91c1c'}}>خطأ: {errorRemote}</div>}
          </div>
        </div>
      )}

      {/* Products */}
      {view === 'products' && (
        <div style={sectionWrap}>
          <form onSubmit={submitProduct} style={formRow}>
            <h3 style={subTitle}>{productForm.id ? 'تعديل منتج' : 'إضافة منتج'}</h3>
            <div style={formGrid}>
              <input placeholder="الاسم (AR)" value={productForm.nameAr} onChange={e=>setProductForm(f=>({...f,nameAr:e.target.value}))} />
              <input placeholder="Name (EN)" value={productForm.nameEn} onChange={e=>setProductForm(f=>({...f,nameEn:e.target.value}))} />
              <input
                type="number"
                placeholder="السعر"
                required
                value={productForm.price}
                onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
              />
              <input
                type="number"
                placeholder="المخزون"
                required
                value={productForm.stock}
                onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))}
              />
              <input placeholder="السعر السابق" type="number" value={productForm.oldPrice} onChange={e=>setProductForm(f=>({...f,oldPrice:e.target.value}))} />
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                <select
                  value={productForm.category}
                  onChange={e=>setProductForm(f=>({...f,category:e.target.value}))}
                >
                  <option value="">اختر التصنيف</option>
                  {catOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {catLoading && <span style={{fontSize:'.6rem',color:'#64748b'}}>...تحميل التصنيفات</span>}
                {catError && <span style={{fontSize:'.6rem',color:'#b91c1c'}}>خطأ: {catError}</span>}
              </div>
              {/* Image input mode toggle */}
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                <div style={{fontSize:'.7rem',fontWeight:600}}>صورة المنتج:</div>
                <div style={{display:'inline-flex',background:'#f1f5f9',borderRadius:8,overflow:'hidden'}}>
                  <button type="button" onClick={()=>{ setImageMode('file'); setProductForm(f=>({...f,image:''})); }} style={{...iconBtn, width:'auto', padding:'.3rem .6rem', background: imageMode==='file' ? '#69be3c' : '#e2e8f0', color: imageMode==='file' ? '#fff' : '#0f172a'}}>رفع ملف</button>
                  <button type="button" onClick={()=>{ setImageMode('url'); setProductImageFile(null); }} style={{...iconBtn, width:'auto', padding:'.3rem .6rem', background: imageMode==='url' ? '#69be3c' : '#e2e8f0', color: imageMode==='url' ? '#fff' : '#0f172a'}}>رابط صورة</button>
                </div>
              </div>
              {imageMode === 'file' && (
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e=>{
                      const file = e.target.files?.[0];
                      setProductImageFile(file||null);
                    }}
                    style={{display:'none'}}
                  />
                  <button type="button" onClick={()=>fileInputRef.current?.click()} style={primaryBtn}>اختر صورة من جهازك</button>
                  {productImageFile && <span style={{fontSize:'.65rem',color:'#475569'}}>{productImageFile.name}</span>}
                </div>
              )}
              <div style={{fontSize:'.6rem',color:'#64748b'}}>المسموح: JPG/PNG/WEBP · الحد الأقصى: 4MB</div>
              {imageMode === 'url' && (
                <input placeholder="رابط الصورة (https://...)" value={productForm.image} onChange={e=>setProductForm(f=>({...f,image:e.target.value}))} />
              )}
              { (productImageFile || productForm.id || productForm.image) && (
                <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-start'}}>
                  <span style={{fontSize:'.55rem',opacity:.7}}>معاينة الصورة</span>
                  <img
                    alt="preview"
                    src={
                      productImageFile
                        ? URL.createObjectURL(productImageFile)
                        : (productForm.image
                            || apiProducts.find(p=>p.id===productForm.id)?.imageVariants?.thumb
                            || apiProducts.find(p=>p.id===productForm.id)?.image
                            || '/vite.svg')
                    }
                    style={{width:90,height:90,objectFit:'cover',borderRadius:8,border:'1px solid #e2e8f0'}} />
                  {productImageFile && <button type="button" onClick={()=>setProductImageFile(null)} style={{...ghostBtn,fontSize:'.55rem',padding:'.3rem .5rem'}}>إزالة</button>}
                </div>
              ) }
              <select
                value={productForm.status}
                onChange={e => setProductForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="active">نشط</option>
                <option value="draft">مسودة</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
            <div style={actionsRow}>
              <button type="submit" style={primaryBtn}>
                <Save size={16} /> {productForm.id ? 'حفظ' : 'إضافة'}
              </button>
              {productForm.id && (
                <button type="button" style={ghostBtn} onClick={resetForms}>
                  <X size={16} /> إلغاء
                </button>
              )}
            </div>
          </form>
          <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
            <select value={sort} onChange={e=>setSort(e.target.value)} style={searchInput}>
              <option value="created_desc">الأحدث</option>
              <option value="created_asc">الأقدم</option>
              <option value="price_desc">الأعلى سعراً</option>
              <option value="price_asc">الأقل سعراً</option>
              <option value="stock_desc">أعلى مخزون</option>
              <option value="stock_asc">أقل مخزون</option>
            </select>
            <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} style={searchInput}>
              <option value="">كل التصنيفات</option>
              {catOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {catLoading && <span style={{fontSize:'.65rem',color:'#64748b'}}>...تحميل التصنيفات</span>}
            {catError && <span style={{fontSize:'.65rem',color:'#b91c1c'}}>خطأ: {catError}</span>}
          </div>
          <table style={table}>
            <thead>
              <tr>
                <th>الاسم</th><th>التصنيف</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th>شرائح</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const open = openTierProductId === p.id;
                const tiers = tiersByProduct[p.id] || [];
                const lowestTier = tiers.length ? tiers[0] : null;
                return (
                  <React.Fragment key={p.id}>
                    <tr>
                      <td>{p.name?.ar || p.name?.en || p.name}</td>
                      <td>{p.category}</td>
                      <td>{p.price}</td>
                      <td style={p.stock < 5 ? {color:'#b91c1c',fontWeight:600}:{}}>{p.stock}</td>
                      <td>{p.status}</td>
                      <td>
                        <button onClick={()=>toggleTiers(p.id)} style={{...iconBtn, width:'auto', padding:'0 .5rem', background: open ? '#69be3c' : iconBtn.background, color: open? '#fff': iconBtn.color, fontSize:'.6rem'}}>
                          {open ? 'إخفاء' : 'إدارة'}
                        </button>
                        {tiers.length>0 && <div style={{fontSize:'.55rem',marginTop:4,opacity:.7}}>{tiers.length} شريحة{lowestTier? ` (من ${lowestTier.price})`:''}</div>}
                      </td>
                      <td style={tdActions}>
                        <button
                          onClick={() => setProductForm({
                            id: p.id,
                            nameAr: p.name?.ar || '',
                            nameEn: p.name?.en || '',
                            price: p.price,
                            stock: p.stock,
                            status: p.status,
                            category: p.category || 'general',
                            oldPrice: p.oldPrice || '',
                            image: p.image || ''
                          })}
                          title="تعديل"
                          style={iconBtn}
                        ><Edit3 size={16} /></button>
                        <button
                          onClick={async () => {
                            if (apiProducts.length) {
                              try {
                                await api.deleteProduct(p.id);
                                setApiProducts(prev => prev.filter(x => x.id !== p.id));
                                setAudit(a => [{ ts: Date.now(), action: 'delete_product', id: p.id }, ...a].slice(0,200));
                              } catch (e) { setProdError(e.message); }
                            } else {
                              deleteProduct(p.id);
                              setAudit(a => [{ ts: Date.now(), action: 'delete_product_local', id: p.id }, ...a].slice(0,200));
                            }
                          }}
                          title="حذف"
                          style={iconBtnDanger}
                        ><Trash2 size={16} /></button>
                      </td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={7} style={{background:'#f8fafc', padding:'1rem .75rem'}}>
                          <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                            <form onSubmit={submitTier} style={{display:'flex',flexWrap:'wrap',gap:6,alignItems:'flex-end'}}>
                              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                                <label style={tierLabel}>الحد الأدنى</label>
                                <input required type="number" value={tierForm.minQty} onChange={e=>setTierForm(f=>({...f,minQty:e.target.value}))} style={tierInput} />
                              </div>
                              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                                <label style={tierLabel}>السعر</label>
                                <input required type="number" step="0.01" value={tierForm.price} onChange={e=>setTierForm(f=>({...f,price:e.target.value}))} style={tierInput} />
                              </div>
                              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                                <label style={tierLabel}>التغليف</label>
                                <select value={tierForm.packagingType} onChange={e=>setTierForm(f=>({...f,packagingType:e.target.value}))} style={tierInput}>
                                  {packagingOptions.map(o=> <option key={o} value={o}>{o}</option>)}
                                </select>
                              </div>
                              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                                <label style={tierLabel}>ملاحظة AR</label>
                                <input value={tierForm.noteAr} onChange={e=>setTierForm(f=>({...f,noteAr:e.target.value}))} style={tierInput} />
                              </div>
                              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                                <label style={tierLabel}>Note EN</label>
                                <input value={tierForm.noteEn} onChange={e=>setTierForm(f=>({...f,noteEn:e.target.value}))} style={tierInput} />
                              </div>
                              <div style={{display:'flex',gap:6}}>
                                <button type="submit" style={{...primaryBtn, fontSize:'.6rem'}}>{tierForm.id? 'تحديث':'إضافة'}</button>
                                {tierForm.id && <button type="button" style={{...ghostBtn,fontSize:'.6rem'}} onClick={()=>setTierForm(emptyTierForm)}>إلغاء</button>}
                              </div>
                            </form>
                            <div style={{overflowX:'auto'}}>
                              <table style={{...table, boxShadow:'none', margin:0}}>
                                <thead>
                                  <tr><th>MinQty</th><th>Price</th><th>Packaging</th><th>Note</th><th>إجراءات</th></tr>
                                </thead>
                                <tbody>
                                  {tiers.map(t => (
                                    <tr key={t.id}>
                                      <td>{t.minQty}</td>
                                      <td>{t.price}</td>
                                      <td>{t.packagingType}</td>
                                      <td style={{fontSize:'.6rem'}}>{t.note?.ar || t.note?.en || '—'}</td>
                                      <td style={tdActions}>
                                        <button style={iconBtn} title="تعديل" onClick={()=>editTier(t)}><Edit3 size={14} /></button>
                                        <button style={iconBtnDanger} title="حذف" onClick={()=>deleteTier(t)}>✕</button>
                                      </td>
                                    </tr>
                                  ))}
                                  {!tiers.length && !tierLoading && (
                                    <tr><td colSpan={5} style={emptyCell}>لا توجد شرائح</td></tr>
                                  )}
                                </tbody>
                              </table>
                              {tierLoading && <div style={{fontSize:'.6rem',marginTop:4}}>...تحميل</div>}
                              {tierError && <div style={{fontSize:'.6rem',color:'#b91c1c',marginTop:4}}>خطأ: {tierError}</div>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {!filteredProducts.length && (
                <tr><td colSpan={5} style={emptyCell}>لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
          {loadingProducts && <div style={{fontSize:'.7rem',opacity:.7}}>جاري الحفظ...</div>}
          {prodError && <div style={{fontSize:'.7rem',color:'#b91c1c'}}>خطأ: {prodError}</div>}
        </div>
      )}

      {/* Orders Management (bank review) */}
      {view === 'orders' && (
        <div style={sectionWrap}>
          <h3 style={subTitle}>الطلبات (تحويل بنكي / عام)</h3>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
            <select value={orderStatusFilter} onChange={e=>setOrderStatusFilter(e.target.value)} style={searchInput}>
              <option value="">كل الحالات</option>
              {['pending','processing','pending_bank_review','paid','shipped','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={orderMethodFilter} onChange={e=>setOrderMethodFilter(e.target.value)} style={searchInput}>
              <option value="">كل الطرق</option>
              {['paypal','bank','cod','stc'].map(m=> <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="date" value={orderDateFrom} onChange={e=>setOrderDateFrom(e.target.value)} style={searchInput} />
            <input type="date" value={orderDateTo} onChange={e=>setOrderDateTo(e.target.value)} style={searchInput} />
            <button style={primaryBtn} type="button" onClick={()=>{setOrderStatusFilter('');setOrderMethodFilter('');setOrderDateFrom('');setOrderDateTo('');}}>مسح الفلاتر</button>
            <button style={primaryBtn} type="button" onClick={async ()=> {
              try {
                const csv = await adminApi.exportOrdersCsv({ status: orderStatusFilter, paymentMethod: orderMethodFilter, from: orderDateFrom, to: orderDateTo });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click(); URL.revokeObjectURL(url);
              } catch (e) { alert('فشل تصدير CSV: ' + e.message); }
            }}>تصدير CSV</button>
            <button style={primaryBtn} type="button" onClick={async ()=> {
              try {
                const blob = await adminApi.exportOrdersXlsx({ status: orderStatusFilter, paymentMethod: orderMethodFilter, from: orderDateFrom, to: orderDateTo });
                const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'orders.xlsx'; a.click(); URL.revokeObjectURL(url);
              } catch (e) { alert('فشل تصدير Excel: ' + e.message); }
            }}>تصدير Excel</button>
          </div>
          <table style={table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>المستخدم</th>
                <th>الحالة</th>
                <th>المبلغ</th>
                <th>طريقة</th>
                <th>العنوان</th>
                <th>مرجع</th>
                <th>إيصال</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice(0,200).map(o => {
                const bankMeta = o.paymentMeta?.bank || {};
                const addr = o.paymentMeta?.address || {};
                const addrText = [addr.country, addr.city, addr.area].filter(Boolean).join(' - ') + (addr.line1? `\n${addr.line1}`:'') + (addr.phone? `\n📞 ${addr.phone}`:'');
                return (
                  <React.Fragment key={o.id}>
                  <tr>
                    <td style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis'}}>{o.id}</td>
                    <td>{o.userId}</td>
                    <td>{o.status}</td>
                    <td>{o.grandTotal?.toFixed ? o.grandTotal.toFixed(2) : o.grandTotal} {o.currency}</td>
                    <td>{o.paymentMethod || '-'}</td>
                    <td title={addrText || '-'} style={{fontSize:'.6rem',maxWidth:180,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                      {addr.city || addr.area || addr.line1 ? (
                        <span>
                          {(addr.city || addr.area) ? `${addr.city||''}${addr.city&&addr.area?' - ':''}${addr.area||''}` : (addr.line1 || '')}
                          {addr.city||addr.area ? (addr.line1 ? `, ${addr.line1}`:'') : ''}
                          {addr.phone ? ` · ${addr.phone}` : ''}
                        </span>
                      ) : '—'}
                      {(addr.city||addr.area||addr.line1) && (
                        <button
                          type="button"
                          title="نسخ العنوان"
                          onClick={() => { try { navigator.clipboard.writeText(addrText); } catch {} }}
                          style={{...iconBtn, width:22, height:22, marginInlineStart:6}}
                        >📋</button>
                      )}
                    </td>
                    <td>{bankMeta.reference || '-'}</td>
                    <td>
                      {bankMeta.receiptUrl ? (
                        <a href={bankMeta.receiptUrl} target="_blank" rel="noopener" style={{fontSize:'.6rem',color:'#075985'}}>عرض</a>
                      ) : '-' }
                    </td>
                    <td style={tdActions}>
                      {o.paymentMethod === 'bank' && o.status === 'pending_bank_review' && (
                        <button
                          style={iconBtn}
                          onClick={async ()=> {
                            try {
                              const ref = bankMeta.reference;
                              const res = await fetch('/api/pay/bank/confirm', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ orderId:o.id, reference: ref }) });
                              if (!res.ok) throw new Error('فشل التأكيد');
                              await refresh();
                            } catch (e) { alert(e.message); }
                          }}
                        >تأكيد دفع</button>
                      )}
                      {(addr.city||addr.area||addr.line1) && (
                        <button
                          style={{...iconBtn, width:'auto', padding:'0 .5rem', fontSize:'.6rem'}}
                          onClick={()=> setOpenAddrOrder(prev => prev===o.id ? null : o.id)}
                          title={openAddrOrder===o.id? 'إخفاء العنوان' : 'عرض العنوان'}
                        >{openAddrOrder===o.id? 'إخفاء' : 'عرض'}</button>
                      )}
                      <a href={`/order/${o.id}`} style={{fontSize:'.6rem',textDecoration:'none',color:'#69be3c'}}>عرض</a>
                    </td>
                  </tr>
                  {openAddrOrder === o.id && (
                    <tr>
                      <td colSpan={9} style={{background:'#f8fafc'}}>
                        <div style={{display:'flex',justifyContent:'space-between',gap:8,alignItems:'flex-start',padding:'.75rem 1rem'}}>
                          <div style={{fontSize:'.7rem',whiteSpace:'pre-wrap',lineHeight:1.8}}>
                            <div style={{fontWeight:700,marginBottom:4}}>عنوان الشحن</div>
                            {addr.name && <div>{addr.name}</div>}
                            {addr.email && <div style={{opacity:.8}}>{addr.email}</div>}
                            <div>{[addr.country, addr.city, addr.area].filter(Boolean).join(' - ')}</div>
                            {addr.line1 && <div>{addr.line1}</div>}
                            {addr.phone && <div>📞 {addr.phone}</div>}
                          </div>
                          <div style={{display:'flex',gap:6}}>
                            <button type="button" onClick={()=>{ try { navigator.clipboard.writeText(addrText); } catch {} }} style={{...iconBtn, width:'auto', padding:'0 .6rem', fontSize:'.65rem'}}>نسخ</button>
                            {(addr.line1 || addr.city || addr.country) && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr.line1||''} ${addr.city||''} ${addr.country||''}`.trim())}`}
                                target="_blank" rel="noopener"
                                style={{...iconBtn, width:'auto', padding:'0 .6rem', fontSize:'.65rem', textDecoration:'none'}}
                              >خرائط</a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
              {!orders.length && <tr><td colSpan={8} style={emptyCell}>لا توجد طلبات</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Users */}
      {view === 'users' && (
        <div style={sectionWrap}>
          <form onSubmit={submitUser} style={formRow}>
            <h3 style={subTitle}>{userForm.id ? 'تعديل مستخدم' : 'إضافة مستخدم'}</h3>
            <div style={formGrid}>
              <input
                placeholder="الاسم"
                required
                value={userForm.name}
                onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))}
              />
              <select
                value={userForm.role}
                onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="user">مستخدم</option>
                <option value="seller">بائع</option>
                <option value="admin">مدير</option>
              </select>
              <select
                value={userForm.active ? '1' : '0'}
                onChange={e => setUserForm(f => ({ ...f, active: e.target.value === '1' }))}
              >
                <option value="1">مفعل</option>
                <option value="0">موقوف</option>
              </select>
            </div>
            <div style={actionsRow}>
              <button type="submit" style={primaryBtn}>
                <Save size={16} /> {userForm.id ? 'حفظ' : 'إضافة'}
              </button>
              {userForm.id && (
                <button type="button" style={ghostBtn} onClick={resetForms}>
                  <X size={16} /> إلغاء
                </button>
              )}
            </div>
          </form>
          <table style={table}>
            <thead>
              <tr>
                <th>الاسم</th><th>الدور</th><th>الحالة</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.name || u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.active === false ? 'موقوف' : 'مفعل'}</td>
                  <td style={tdActions}>
                    <button onClick={() => setUserForm(u)} style={iconBtn} title="تعديل"><Edit3 size={16} /></button>
                    <button onClick={async () => {
                      if (!window.confirm('حذف المستخدم؟')) return;
                      try {
                        if (remoteUsers.length) {
                          await adminApi.deleteUser(u.id);
                          setRemoteUsers(prev => prev.filter(x => x.id !== u.id));
                        } else {
                          deleteUser(u.id);
                        }
                      } catch (e) { alert('فشل الحذف: ' + e.message); }
                    }} style={iconBtnDanger} title="حذف"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr><td colSpan={4} style={emptyCell}>لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Categories Management */}
      {view === 'cats' && (
        <CategoriesAdmin />
      )}

      {/* Audit Logs */}
      {view === 'audit' && (
        <div style={sectionWrap}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            <h3 style={subTitle}>سجلات التدقيق</h3>
            <button type="button" onClick={()=>refreshAudit()} style={primaryBtn}>تحديث</button>
            <span style={{fontSize:'.6rem',color:'#475569'}}>{loadingRemote? '...تحميل' : ''}</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={table}>
              <thead>
                <tr>
                  <th>الوقت</th><th>الإجراء</th><th>الكيان</th><th>المعرف</th><th>المستخدم</th>
                </tr>
              </thead>
              <tbody>
                {remoteAudit.map(l => (
                  <tr key={l.id}>
                    <td>{new Date(l.createdAt).toLocaleTimeString()}</td>
                    <td>{l.action}</td>
                    <td>{l.entity}</td>
                    <td>{l.entityId}</td>
                    <td>{l.userId || '—'}</td>
                  </tr>
                ))}
                {!remoteAudit.length && !loadingRemote && (
                  <tr><td colSpan={5} style={emptyCell}>لا توجد سجلات</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {auditTotalPages > 1 && (
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <button disabled={auditPage===1} onClick={()=>setAuditPage(p=>Math.max(1,p-1))} style={auditPage===1?ghostBtn:primaryBtn}>السابق</button>
              <span style={{alignSelf:'center',fontSize:'.65rem'}}>صفحة {auditPage} / {auditTotalPages}</span>
              <button disabled={auditPage===auditTotalPages} onClick={()=>setAuditPage(p=>Math.min(auditTotalPages,p+1))} style={auditPage===auditTotalPages?ghostBtn:primaryBtn}>التالي</button>
            </div>
          )}
          {errorRemote && <div style={{fontSize:'.65rem',color:'#b91c1c'}}>خطأ: {errorRemote}</div>}
        </div>
      )}

      {/* Reviews Moderation */}
      {view === 'reviews' && (
        <ReviewsModeration />
      )}

      {/* Orders */}
      {view === 'orders' && (
        <div style={sectionWrap}>
          <form onSubmit={submitOrder} style={formRow}>
            <h3 style={subTitle}>{orderForm.id ? 'تعديل طلب' : 'إضافة طلب يدوي'}</h3>
            <div style={formGrid}>
              <input
                placeholder="العميل"
                required
                value={orderForm.customer}
                onChange={e => setOrderForm(f => ({ ...f, customer: e.target.value }))}
              />
              <input
                type="number"
                placeholder="الإجمالي"
                required
                value={orderForm.total}
                onChange={e => setOrderForm(f => ({ ...f, total: e.target.value }))}
              />
              <input
                type="number"
                placeholder="عدد العناصر"
                required
                value={orderForm.items}
                onChange={e => setOrderForm(f => ({ ...f, items: e.target.value }))}
              />
              <select
                value={orderForm.status}
                onChange={e => setOrderForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value="pending">معلق</option>
                <option value="paid">مدفوع</option>
                <option value="shipped">تم الشحن</option>
                <option value="completed">مكتمل</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>
            <div style={actionsRow}>
              <button type="submit" style={primaryBtn}>
                <Save size={16} /> {orderForm.id ? 'حفظ' : 'إضافة'}
              </button>
              {orderForm.id && (
                <button type="button" style={ghostBtn} onClick={resetForms}>
                  <X size={16} /> إلغاء
                </button>
              )}
            </div>
          </form>
          <table style={table}>
            <thead>
              <tr>
                <th>المعرف</th><th>العميل</th><th>الإجمالي</th><th>العناصر</th><th>الحالة</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.customer}</td>
                  <td>{o.total}</td>
                  <td>{o.items}</td>
                  <td>{o.status}</td>
                  <td style={tdActions}>
                    <button onClick={() => setOrderForm(o)} style={iconBtn} title="تعديل"><Edit3 size={16} /></button>
                    <button onClick={() => deleteOrder(o.id)} style={iconBtnDanger} title="حذف"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {!filteredOrders.length && (
                <tr><td colSpan={6} style={emptyCell}>لا توجد نتائج</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Settings */}
      {view === 'settings' && (
        <div style={sectionWrap}>
          <h3 style={subTitle}>الإعدادات العامة</h3>
          {settingsLoading && <div style={{fontSize:'.7rem',color:'#64748b'}}>...تحميل</div>}
          {settingsError && <div style={{fontSize:'.7rem',color:'#b91c1c'}}>خطأ: {settingsError}</div>}
          <div style={{display:'grid',gap:'1rem'}}>
            <div style={{background:'#fff',padding:'1rem',borderRadius:12,boxShadow:'0 4px 14px -6px rgba(0,0,0,.08)'}}>
              <h4 style={{marginTop:0}}>شعار الموقع</h4>
              <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                {storeSettings?.logo ? (
                  <img src={storeSettings.logo} alt="Site Logo" style={{height:48,objectFit:'contain',border:'1px solid #e5e7eb',borderRadius:8,padding:4,background:'#fff'}} />
                ) : (
                  <div style={{fontSize:'.7rem',opacity:.7}}>لا يوجد شعار حالياً</div>
                )}
                <input type="file" accept="image/*" onChange={e=> setSettingsLogoFile(e.target.files?.[0]||null)} />
                {settingsLogoFile && <span style={{fontSize:'.65rem'}}>{settingsLogoFile.name}</span>}
                <button type="button" style={primaryBtn} disabled={!settingsLogoFile || settingsLoading} onClick={uploadStoreLogo}>رفع الشعار</button>
                <button type="button" style={ghostBtn} onClick={loadSettings}>تحديث</button>
              </div>
              <p style={mutedP}>الملفات المسموحة: صور حتى 2MB. يتم إنشاء نسخة WebP محسنة تلقائياً.</p>
            </div>
            <div style={{background:'#fff',padding:'1rem',borderRadius:12,boxShadow:'0 4px 14px -6px rgba(0,0,0,.08)'}}>
              <h4 style={{marginTop:0}}>معلومات</h4>
              <ul style={ulClean}>
                <li>إصدار الواجهة: 1.0.0</li>
                <li>حجم البيانات: {(effectiveProducts?.length||0) + (effectiveUsers?.length||0) + (orders?.length||0)} سجل</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Brands Management */}
      {view === 'brands' && (
        <div style={sectionWrap}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <h3 style={subTitle}>إدارة العلامات التجارية</h3>
            <button style={primaryBtn} type="button" onClick={()=>loadBrands()}>تحديث</button>
            <button style={ghostBtn} type="button" onClick={()=>scanBrandIssues()}>فحص الصيانة</button>
            <button style={ghostBtn} type="button" onClick={()=>regenBrandLogos()}>إعادة توليد صور جميع الشعارات</button>
            {brandLoading && <span style={{fontSize:'.6rem',color:'#64748b'}}>...تحميل</span>}
            {brandError && <span style={{fontSize:'.6rem',color:'#b91c1c'}}>خطأ: {brandError}</span>}
            <input placeholder="بحث علامة" value={brandFilter} onChange={e=>setBrandFilter(e.target.value)} style={searchInput} />
            <select value={brandSort} onChange={e=>setBrandSort(e.target.value)} style={searchInput}>
              <option value="created_desc">الأحدث</option>
              <option value="created_asc">الأقدم</option>
              <option value="name_ar">الاسم AR</option>
              <option value="name_en">Name EN</option>
              <option value="products_desc">أكثر منتجات</option>
              <option value="products_asc">أقل منتجات</option>
            </select>
            <select value={brandIssueView} onChange={e=>setBrandIssueView(e.target.value)} style={searchInput}>
              <option value="">كل العلامات</option>
              <option value="duplicates">مكررة</option>
              <option value="noLogo">بدون شعار</option>
              <option value="zeroProducts">بدون منتجات</option>
              <option value="missingVariants">نقص نسخ الشعار</option>
            </select>
            <button type="button" style={ghostBtn} onClick={()=>setMergeOpen(m=>!m)}>{mergeOpen? 'إخفاء الدمج' : 'لوحة الدمج'}</button>
          </div>
          {brandIssues && (
            <div style={{marginTop:8,background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:'.5rem .75rem',display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
              <div style={{fontSize:'.7rem',color:'#334155',fontWeight:700}}>نتائج الفحص:</div>
              <button type="button" style={ghostBtn} onClick={()=>setBrandIssueView('duplicates')}>مكررات: {(brandIssues.duplicateNames||[]).length} مجموعة</button>
              <button type="button" style={ghostBtn} onClick={()=>setBrandIssueView('noLogo')}>بدون شعار: {(brandIssues.noLogo||[]).length}</button>
              <button type="button" style={ghostBtn} onClick={()=>setBrandIssueView('zeroProducts')}>بدون منتجات: {(brandIssues.zeroProducts||[]).length}</button>
              <button type="button" style={ghostBtn} onClick={()=>setBrandIssueView('missingVariants')}>نقص نسخ: {(brandIssues.missingLogoVariants||[]).length}</button>
              <button type="button" style={ghostBtn} onClick={()=>setBrandIssueView('')}>إظهار الكل</button>
            </div>
          )}
          {!brandIssues && (
            <div style={{marginTop:8,fontSize:'.65rem',color:'#64748b'}}>يمكنك تشغيل "فحص الصيانة" لرؤية المجموعات المكررة والمشاكل الأخرى.</div>
          )}
          {mergeOpen && (
            <div style={{marginTop:10,background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:'.75rem',display:'grid',gap:8}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <div style={{fontSize:'.8rem',fontWeight:700}}>دمج علامات</div>
                <select value={mergeTargetId} onChange={e=>setMergeTargetId(e.target.value)} style={searchInput}>
                  <option value="">— اختر الهدف —</option>
                  {brands.map(b=> <option key={b.id} value={b.id}>{(b.name?.ar||b.name?.en||b.slug)} ({b.productCount||0})</option>)}
                </select>
                <button type="button" style={primaryBtn} disabled={!mergeTargetId || !mergeSourceIds.filter(id=>id && id!==mergeTargetId).length} onClick={()=>{
                  const sources = mergeSourceIds.filter(id=>id && id!==mergeTargetId);
                  if (!sources.length) return;
                  if (!window.confirm(`دمج ${sources.length} علامة إلى الهدف المختار؟`)) return;
                  mergeBrands(mergeTargetId, sources).then(()=>{ setMergeSourceIds([]); setMergeTargetId(''); });
                }}>ابدأ الدمج</button>
              </div>
              {brandIssues?.duplicateNames?.length>0 && (
                <div style={{fontSize:'.65rem',color:'#334155'}}>
                  مجموعات مكررة سريعة:
                  <ul style={{listStyle:'none',padding:0,margin:'.25rem 0',display:'grid',gap:6}}>
                    {brandIssues.duplicateNames.map((g,idx)=> (
                      <li key={idx} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <span style={{fontWeight:600}}>مجموعة {idx+1}:</span>
                        <span style={{opacity:.8}}>{(g.slugs||[]).join(', ')}</span>
                        <button type="button" style={ghostBtn} onClick={()=>{ setMergeSourceIds(g.ids||[]); setBrandIssueView('duplicates'); setMergeOpen(true); }}>تهيئة من هذه المجموعة</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{display:'grid',gap:6}}>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <input placeholder="بحث في المصادر" value={mergeFilter} onChange={e=>setMergeFilter(e.target.value)} style={searchInput} />
                  <button type="button" style={ghostBtn} onClick={()=>setMergeSourceIds([])}>مسح التحديد</button>
                </div>
                <div style={{maxHeight:220,overflow:'auto',border:'1px solid #e2e8f0',borderRadius:8,padding:6,display:'grid',gap:4}}>
                  {brands.filter(b=>{
                    const n = mergeFilter.trim().toLowerCase();
                    if (!n) return true;
                    return (b.slug||'').toLowerCase().includes(n) || (b.name?.ar||'').toLowerCase().includes(n) || (b.name?.en||'').toLowerCase().includes(n);
                  }).map(b=> (
                    <label key={b.id} style={{display:'flex',alignItems:'center',gap:8,fontSize:'.75rem'}}>
                      <input type="checkbox" checked={mergeSourceIds.includes(b.id)} onChange={()=> setMergeSourceIds(prev => prev.includes(b.id) ? prev.filter(x=>x!==b.id) : [...prev, b.id])} />
                      <span style={{opacity:.85}}>{b.name?.ar||b.name?.en||b.slug}</span>
                      <span style={{fontSize:'.6rem',opacity:.6}}>({b.productCount||0})</span>
                      {mergeTargetId === b.id && <span style={{fontSize:'.6rem',color:'#b91c1c'}}>← الهدف</span>}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <form onSubmit={submitBrand} style={formRow}>
            <h4 style={{margin:0,fontSize:'.85rem'}}>{brandForm.id? 'تعديل علامة' : 'إضافة علامة'}</h4>
            <div style={formGrid}>
              <input placeholder="Slug" value={brandForm.slug} onChange={e=>setBrandForm(f=>({...f,slug:e.target.value}))} />
              <input placeholder="الاسم AR" value={brandForm.nameAr} onChange={e=>setBrandForm(f=>({...f,nameAr:e.target.value}))} required />
              <input placeholder="Name EN" value={brandForm.nameEn} onChange={e=>setBrandForm(f=>({...f,nameEn:e.target.value}))} required />
              <input placeholder="وصف AR" value={brandForm.descriptionAr} onChange={e=>setBrandForm(f=>({...f,descriptionAr:e.target.value}))} />
              <input placeholder="Description EN" value={brandForm.descriptionEn} onChange={e=>setBrandForm(f=>({...f,descriptionEn:e.target.value}))} />
              <input placeholder="Logo URL" value={brandForm.logo} onChange={e=>setBrandForm(f=>({...f,logo:e.target.value}))} />
              <input type="file" accept="image/*" onChange={e=> setBrandLogoFile(e.target.files?.[0]||null)} />
              {brandLogoFile && <span style={{fontSize:'.55rem'}}>{brandLogoFile.name}</span>}
            </div>
            <div style={actionsRow}>
              <button type="submit" style={primaryBtn}><Save size={16} /> {brandForm.id? 'حفظ' : 'إضافة'}</button>
              {brandForm.id && <button type="button" style={ghostBtn} onClick={()=>setBrandForm({ id:null, slug:'', nameAr:'', nameEn:'', descriptionAr:'', descriptionEn:'', logo:'' })}><X size={16}/> إلغاء</button>}
            </div>
          </form>
          <table style={table}>
            <thead>
              <tr>
                <th>الشعار</th><th>الاسم</th><th>Slug</th><th>المنتجات</th><th>الوصف</th><th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {visibleBrands.map(b => (
                <tr key={b.id}>
                  <td>{b.logo? <img src={b.logo} alt="logo" style={{width:38,height:38,objectFit:'contain'}} /> : '—'}</td>
                  <td>{b.name?.ar || b.name?.en}</td>
                  <td style={{fontSize:'.6rem'}}>{b.slug}</td>
                  <td>{b.productCount || 0}</td>
                  <td style={{fontSize:'.6rem',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{b.description?.ar || b.description?.en || '—'}</td>
                  <td style={tdActions}>
                    <button style={iconBtn} title="تعديل" onClick={()=> setBrandForm({ id:b.id, slug:b.slug, nameAr:b.name?.ar||'', nameEn:b.name?.en||'', descriptionAr:b.description?.ar||'', descriptionEn:b.description?.en||'', logo:b.logo||'' })}><Edit3 size={16} /></button>
                    <button style={iconBtn} title="إعادة توليد نسخ الشعار" onClick={()=>regenBrandLogos(b.id)}>↻</button>
                    <button style={iconBtnDanger} title="حذف" onClick={()=> deleteBrand(b.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {!visibleBrands.length && !brandLoading && <tr><td colSpan={6} style={emptyCell}>لا توجد علامات</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Marketing Management */}
      {view === 'marketing' && (
        <div style={sectionWrap}>
          <div style={{background:'#fff',padding:'1rem',borderRadius:14,boxShadow:'0 4px 14px -6px rgba(0,0,0,.08)',display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              <h4 style={{margin:'0 0 .25rem',fontSize:'.9rem'}}>تحليلات النقرات</h4>
              <select value={marketingMetricsDays} onChange={e=>{ const v=+e.target.value; setMarketingMetricsDays(v); loadMarketingMetrics(v); }} style={searchInput}>
                {[7,14,30,60,90,180].map(d=> <option key={d} value={d}>{d} يوم</option>)}
              </select>
              <button type="button" onClick={()=>loadMarketingMetrics()} style={primaryBtn}>تحديث</button>
            </div>
            {!marketingMetrics && <div style={{fontSize:'.65rem',color:'#64748b'}}>...تحميل</div>}
            {marketingMetrics && (
              <div style={{display:'grid',gap:'1rem',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
                {['banner','feature','appLink'].map(k=> (
                  <div key={k} style={{border:'1px solid #e2e8f0',borderRadius:12,padding:'.75rem',display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{fontSize:'.7rem',fontWeight:700,color:'#334155'}}>{k==='banner'?'بانرات':k==='feature'?'ميزات':'روابط التطبيقات'}</div>
                    <ul style={{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:4}}>
                      {(marketingMetrics[k]||[]).slice(0,10).map(item=> (
                        <li key={item.id} style={{display:'flex',justifyContent:'space-between',fontSize:'.6rem'}}>
                          <span style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.titleAr||item.labelAr||item.titleEn||item.labelEn||item.platform||item.id}</span>
                          <span style={{fontWeight:600}}>{item.count}</span>
                        </li>
                      ))}
                      {!(marketingMetrics[k]||[]).length && <li style={{fontSize:'.55rem',opacity:.6}}>لا بيانات</li>}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Features */}
            <form onSubmit={submitFeature} style={formRow}>
              <h4 style={{margin:0,fontSize:'.85rem'}}>ميزات ({marketingFeatures.length})</h4>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <input placeholder="بحث" value={featureFilter} onChange={e=>setFeatureFilter(e.target.value)} style={searchInput} />
                <select value={featureSort} onChange={e=>setFeatureSort(e.target.value)} style={searchInput}>
                  <option value="sort_asc">Sort ↑</option>
                  <option value="sort_desc">Sort ↓</option>
                  <option value="title_ar">عنوان AR</option>
                  <option value="title_en">Title EN</option>
                </select>
              </div>
              <div style={formGrid}>
                <input placeholder="عنوان AR" value={featureForm.titleAr} onChange={e=>setFeatureForm(f=>({...f,titleAr:e.target.value}))} required />
                <input placeholder="Title EN" value={featureForm.titleEn} onChange={e=>setFeatureForm(f=>({...f,titleEn:e.target.value}))} required />
                <input placeholder="نص AR" value={featureForm.bodyAr} onChange={e=>setFeatureForm(f=>({...f,bodyAr:e.target.value}))} />
                <input placeholder="Body EN" value={featureForm.bodyEn} onChange={e=>setFeatureForm(f=>({...f,bodyEn:e.target.value}))} />
                <input placeholder="Icon" value={featureForm.icon} onChange={e=>setFeatureForm(f=>({...f,icon:e.target.value}))} />
                <input type="number" placeholder="Sort" value={featureForm.sort} onChange={e=>setFeatureForm(f=>({...f,sort:+e.target.value||0}))} />
                <select value={featureForm.active? '1':'0'} onChange={e=>setFeatureForm(f=>({...f,active:e.target.value==='1'}))}>
                  <option value="1">نشط</option>
                  <option value="0">متوقف</option>
                </select>
              </div>
              <div style={actionsRow}>
                <button type="submit" style={primaryBtn}><Save size={16} /> {featureForm.id? 'حفظ' : 'إضافة'}</button>
                {featureForm.id && <button type="button" style={ghostBtn} onClick={()=>setFeatureForm({ id:null, titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', icon:'', sort:0, active:true })}><X size={16}/> إلغاء</button>}
              </div>
              <table style={table}>
                <thead>
                  <tr><th>العنوان</th><th>الأيقونة</th><th>Sort</th><th>نشط</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {visibleFeatures.map(f => (
                    <tr key={f.id}>
                      <td>{f.title?.ar || f.title?.en}</td>
                      <td>{f.icon || '—'}</td>
                      <td>{f.sort}</td>
                      <td>{f.active? '✓':'✗'}</td>
                      <td style={tdActions}>
                         <button style={iconBtn} onClick={()=> setFeatureForm({ id:f.id, titleAr:f.title?.ar||'', titleEn:f.title?.en||'', bodyAr:f.body?.ar||'', bodyEn:f.body?.en||'', icon:f.icon||'', sort:f.sort||0, active:!!f.active })}><Edit3 size={16} /></button>
                         <button style={iconBtnDanger} onClick={()=> deleteFeature(f.id)}><Trash2 size={16} /></button>
                       </td>
                     </tr>
                   ))}
                   {!visibleFeatures.length && !marketingLoading && <tr><td colSpan={5} style={emptyCell}>لا توجد ميزات</td></tr>}
                 </tbody>
               </table>
             </form>
          {/* App Links */}
            <form onSubmit={submitAppLink} style={formRow}>
              <h4 style={{margin:0,fontSize:'.85rem'}}>روابط التطبيقات ({marketingAppLinks.length})</h4>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <input placeholder="بحث" value={appLinkFilter} onChange={e=>setAppLinkFilter(e.target.value)} style={searchInput} />
                <select value={appLinkSort} onChange={e=>setAppLinkSort(e.target.value)} style={searchInput}>
                  <option value="platform_asc">منصة ↑</option>
                  <option value="platform_desc">منصة ↓</option>
                </select>
              </div>
              <div style={formGrid}>
                <select value={appLinkForm.platform} onChange={e=>setAppLinkForm(f=>({...f,platform:e.target.value}))}>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="web">Web</option>
                </select>
                <input placeholder="URL" value={appLinkForm.url} onChange={e=>setAppLinkForm(f=>({...f,url:e.target.value}))} required />
                <input placeholder="Label AR" value={appLinkForm.labelAr} onChange={e=>setAppLinkForm(f=>({...f,labelAr:e.target.value}))} />
                <input placeholder="Label EN" value={appLinkForm.labelEn} onChange={e=>setAppLinkForm(f=>({...f,labelEn:e.target.value}))} />
                <select value={appLinkForm.active? '1':'0'} onChange={e=>setAppLinkForm(f=>({...f,active:e.target.value==='1'}))}>
                  <option value="1">نشط</option>
                  <option value="0">متوقف</option>
                </select>
              </div>
              <div style={actionsRow}>
                <button type="submit" style={primaryBtn}><Save size={16} /> {appLinkForm.id? 'حفظ' : 'إضافة'}</button>
                {appLinkForm.id && <button type="button" style={ghostBtn} onClick={()=>setAppLinkForm({ id:null, platform:'web', url:'', labelAr:'', labelEn:'', active:true })}><X size={16}/> إلغاء</button>}
              </div>
              <table style={table}>
                <thead>
                  <tr><th>المنصة</th><th>الرابط</th><th>النص</th><th>نشط</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {visibleAppLinks.map(a => (
                    <tr key={a.id}>
                      <td>{a.platform}</td>
                      <td style={{fontSize:'.6rem',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis'}}>{a.url}</td>
                      <td>{a.label?.ar || a.label?.en || '—'}</td>
                      <td>{a.active? '✓':'✗'}</td>
                      <td style={tdActions}>
                        <button style={iconBtn} onClick={()=> setAppLinkForm({ id:a.id, platform:a.platform, url:a.url, labelAr:a.label?.ar||'', labelEn:a.label?.en||'', active:!!a.active })}><Edit3 size={16} /></button>
                        <button style={iconBtnDanger} onClick={()=> deleteAppLink(a.id)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {!visibleAppLinks.length && !marketingLoading && <tr><td colSpan={5} style={emptyCell}>لا توجد روابط</td></tr>}
                </tbody>
              </table>
            </form>
        </div>
      )}
    </div>
  );
};

// Styles (inline objects لسهولة النقل)
const pageWrap = { direction: 'rtl', padding: '1.25rem 0', fontSize: '.85rem' };
const title = { margin: '0 0 1rem', fontSize: '1.4rem', fontWeight: 700 };
const tabsBar = { display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' };
const tabBtn = { background: '#f1f5f9', border: 0, padding: '.55rem .9rem', borderRadius: 10, cursor: 'pointer', fontWeight: 500 };
const tabBtnActive = { ...tabBtn, background: 'linear-gradient(90deg,#69be3c,#f6ad55)', color: '#fff', boxShadow: '0 2px 8px -2px rgba(0,0,0,.25)' };
const searchInput = { padding: '.55rem .75rem', border: '1px solid #e2e8f0', borderRadius: 10, minWidth: 160, fontSize: '.8rem', background: '#fff' };
const grid3 = { display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' };
const statBox = { background: '#fff', padding: '1rem', borderRadius: 14, boxShadow: '0 4px 14px -6px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: '.35rem' };
const statValue = { fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' };
const statLabel = { fontSize: '.7rem', letterSpacing: '.5px', color: '#64748b', fontWeight: 600 };
const sectionWrap = { background: 'transparent', display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const formRow = { background: '#fff', padding: '1rem 1.1rem 1.25rem', borderRadius: 14, boxShadow: '0 4px 14px -6px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: '.8rem' };
const formGrid = { display: 'grid', gap: '.65rem', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' };
const actionsRow = { display: 'flex', gap: '.6rem', flexWrap: 'wrap' };
const subTitle = { margin: 0, fontSize: '1rem', fontWeight: 600 };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: '.4rem', border: 0, background: 'linear-gradient(90deg,#69be3c,#f6ad55)', color: '#fff', padding: '.6rem .95rem', borderRadius: 10, cursor: 'pointer', fontSize: '.75rem', fontWeight: 600 };
const ghostBtn = { ...primaryBtn, background: '#f1f5f9', color: '#334155' };
const table = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 14px -6px rgba(0,0,0,.06)' };
const tdActions = { display: 'flex', gap: '.35rem', alignItems: 'center' };
const iconBtn = { background: '#f1f5f9', border: 0, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', color: '#0f172a' };
const iconBtnDanger = { ...iconBtn, background: '#fee2e2', color: '#b91c1c' };
const emptyCell = { textAlign: 'center', padding: '1rem', fontSize: '.75rem', color: '#64748b' };
const mutedP = { fontSize: '.75rem', color: '#475569', margin: '.25rem 0 1rem' };
const ulClean = { margin: 0, padding: '0 1rem', listStyle: 'disc', lineHeight: 1.9 };
// Tier pricing sub-table styles
const tierLabel = { fontSize: '.55rem', fontWeight: 600, color: '#475569' };
const tierInput = { ...searchInput, minWidth: 90, fontSize: '.65rem', padding: '.4rem .5rem' };

export default AdminDashboard;

// -------- Helper Functions & Effects for Brands / Marketing (placed after export to avoid clutter above) --------
// NOTE: These rely on closure over React imports & api object already in file scope.

// We'll augment component prototype by monkey patching inside module scope: Not ideal, but simpler than large refactor.
// Instead we'll re-open the component via prototype? Simpler: move helper funcs above usage. For minimal diff, attach to window if needed.
// Safer: Do nothing here – helpers will be defined inside component via inline functions above? For clarity, we keep them here as comments.


// Lazy inline component for reviews moderation (kept here for simplicity)
import { useState as _useState, useEffect as _useEffect } from 'react';
import { api as _rawApi } from '../../api/client';

// Inline Categories Admin manager
const CategoriesAdmin = () => {
  const [cats, setCats] = _useState([]);
  const [loading, setLoading] = _useState(false);
  const [error, setError] = _useState(null);
  const [form, setForm] = _useState({ id:null, slug:'', nameAr:'', nameEn:'', descriptionAr:'', descriptionEn:'', image:'', icon:'' });
  const [file, setFile] = _useState(null);
  const [useFile, setUseFile] = _useState(false);
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await _rawApi.listCategories({ withCounts: 1 });
      setCats(res.categories || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  _useEffect(()=>{ load(); }, []);
  const reset = () => { setForm({ id:null, slug:'', nameAr:'', nameEn:'', descriptionAr:'', descriptionEn:'', image:'', icon:'' }); setFile(null); setUseFile(false); };
  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (form.id) {
        if (useFile && file) {
          const fd = new FormData();
          if (form.slug) fd.append('slug', form.slug);
          if (form.nameAr) fd.append('nameAr', form.nameAr);
          if (form.nameEn) fd.append('nameEn', form.nameEn);
          if (form.descriptionAr) fd.append('descriptionAr', form.descriptionAr);
          if (form.descriptionEn) fd.append('descriptionEn', form.descriptionEn);
          if (form.icon !== undefined) fd.append('icon', form.icon || '');
          fd.append('image', file);
          const updated = await _rawApi.updateCategoryForm(form.id, fd);
          setCats(cs => cs.map(c => c.id===updated.category?.id || c.id===updated.id ? (updated.category||updated) : c));
        } else {
          const updated = await _rawApi.updateCategory(form.id, {
            slug: form.slug || undefined,
            nameAr: form.nameAr || undefined,
            nameEn: form.nameEn || undefined,
            descriptionAr: form.descriptionAr || null,
            descriptionEn: form.descriptionEn || null,
            image: form.image || null,
            icon: form.icon || null
          });
          setCats(cs => cs.map(c => c.id===updated.category?.id || c.id===updated.id ? (updated.category||updated) : c));
        }
      } else {
        if (useFile && file) {
          const fd = new FormData();
          fd.append('slug', form.slug);
          fd.append('nameAr', form.nameAr);
          fd.append('nameEn', form.nameEn);
          if (form.descriptionAr) fd.append('descriptionAr', form.descriptionAr);
          if (form.descriptionEn) fd.append('descriptionEn', form.descriptionEn);
          if (form.icon) fd.append('icon', form.icon);
          fd.append('image', file);
          const created = await _rawApi.createCategoryForm(fd);
          const cat = created.category || created;
          setCats(cs => [cat, ...cs]);
        } else {
          const created = await _rawApi.createCategory({
            slug: form.slug,
            nameAr: form.nameAr,
            nameEn: form.nameEn,
            descriptionAr: form.descriptionAr || null,
            descriptionEn: form.descriptionEn || null,
            image: form.image || null,
            icon: form.icon || null
          });
          const cat = created.category || created;
          setCats(cs => [cat, ...cs]);
        }
      }
      reset();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  const del = async (id) => {
    if (!window.confirm('حذف التصنيف؟')) return;
    try { await _rawApi.deleteCategory(id); setCats(cs=>cs.filter(c=>c.id!==id)); } catch (e) { alert('فشل الحذف: '+e.message); }
  };
  return (
    <div style={sectionWrap}>
      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
        <h3 style={subTitle}>إدارة التصنيفات</h3>
        <button type="button" onClick={load} style={primaryBtn}>تحديث</button>
        {loading && <span style={{fontSize:'.65rem',color:'#64748b'}}>...تحميل</span>}
        {error && <span style={{fontSize:'.65rem',color:'#b91c1c'}}>خطأ: {error}</span>}
      </div>
      <form onSubmit={submit} style={formRow}>
        <h4 style={{margin:0,fontSize:'.9rem'}}>{form.id? 'تعديل تصنيف' : 'إضافة تصنيف'}</h4>
        <div style={formGrid}>
          <input placeholder="Slug" value={form.slug} onChange={e=>setForm(f=>({...f,slug:e.target.value}))} required={!form.id} />
          <input placeholder="الاسم AR" value={form.nameAr} onChange={e=>setForm(f=>({...f,nameAr:e.target.value}))} required={!form.id} />
          <input placeholder="Name EN" value={form.nameEn} onChange={e=>setForm(f=>({...f,nameEn:e.target.value}))} required={!form.id} />
          <input placeholder="وصف AR" value={form.descriptionAr} onChange={e=>setForm(f=>({...f,descriptionAr:e.target.value}))} />
          <input placeholder="Description EN" value={form.descriptionEn} onChange={e=>setForm(f=>({...f,descriptionEn:e.target.value}))} />
          <input placeholder="Icon key (مثل: coffee, cup-soda, cookie, store, tag)" value={form.icon} onChange={e=>setForm(f=>({...f,icon:e.target.value}))} />
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:'.8rem'}}>
            <input type="checkbox" checked={useFile} onChange={e=>setUseFile(e.target.checked)} /> رفع صورة
          </label>
          {!useFile && (
            <input placeholder="رابط صورة (اختياري)" value={form.image} onChange={e=>setForm(f=>({...f,image:e.target.value}))} />
          )}
          {useFile && (
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=> setFile(e.target.files?.[0]||null)} />
          )}
        </div>
        <div style={actionsRow}>
          <button type="submit" style={primaryBtn}>حفظ</button>
          {form.id && <button type="button" style={ghostBtn} onClick={reset}>إلغاء</button>}
        </div>
      </form>
      <div style={{overflowX:'auto'}}>
        <table style={table}>
          <thead>
            <tr><th>الاسم</th><th>Slug</th><th>الأيقونة</th><th>الصورة</th><th>المنتجات</th><th>إجراءات</th></tr>
          </thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id}>
                <td>{c.name?.ar || c.name?.en}</td>
                <td style={{fontSize:'.6rem'}}>{c.slug}</td>
                <td style={{fontSize:'.7rem'}}>{c.icon || '—'}</td>
                <td>{c.image ? <img src={c.image} alt="cat" style={{width:38,height:38,objectFit:'cover',borderRadius:6}} /> : '—'}</td>
                <td>{c.productCount||0}</td>
                <td style={tdActions}>
                  <button style={iconBtn} title="تعديل" onClick={()=> setForm({ id:c.id, slug:c.slug, nameAr:c.name?.ar||'', nameEn:c.name?.en||'', descriptionAr:c.description?.ar||'', descriptionEn:c.description?.en||'', image:c.image||'', icon:c.icon||'' })}>✎</button>
                  <button style={iconBtnDanger} title="حذف" onClick={()=> del(c.id)}>🗑</button>
                </td>
              </tr>
            ))}
            {!cats.length && !loading && <tr><td colSpan={6} style={emptyCell}>لا توجد تصنيفات</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
const ReviewsModeration = () => {
  const { user } = useAuth() || {};
  const [pending, setPending] = _useState([]);
  const [loading, setLoading] = _useState(false);
  const [error, setError] = _useState(null);
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const list = await _rawApi.reviewsModerationList();
      setPending(Array.isArray(list) ? list : (list.reviews || []));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  _useEffect(() => { if (user?.role==='admin') load(); }, [user]);
  const act = async (id, action) => {
    try { await _rawApi.reviewModerate(id, action); await load(); } catch (e) { alert('فشل: '+e.message); }
  };
  if (user?.role !== 'admin') return null;
  return (
    <div style={sectionWrap}>
      <h3 style={subTitle}>مراجعات بإنتظار الموافقة</h3>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <button type="button" onClick={load} style={primaryBtn}>تحديث</button>
        {loading && <span style={{fontSize:'.6rem',color:'#64748b'}}>...تحميل</span>}
        {error && <span style={{fontSize:'.6rem',color:'#b91c1c'}}>خطأ: {error}</span>}
      </div>
      <table style={table}>
        <thead>
          <tr>
            <th>التاريخ</th><th>المنتج</th><th>التقييم</th><th>العنوان</th><th>المراجعة</th><th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {pending.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis'}}>{r.productId}</td>
              <td>{r.rating}</td>
              <td>{r.title || '—'}</td>
              <td style={{fontSize:'.65rem'}}>{r.body?.slice(0,140)}</td>
              <td style={tdActions}>
                <button onClick={()=>act(r.id,'approve')} style={iconBtn} title="موافقة">✔</button>
                <button onClick={()=>act(r.id,'reject')} style={iconBtnDanger} title="رفض">✖</button>
              </td>
            </tr>
          ))}
          {!pending.length && !loading && (
            <tr><td colSpan={6} style={emptyCell}>لا توجد مراجعات معلّقة</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

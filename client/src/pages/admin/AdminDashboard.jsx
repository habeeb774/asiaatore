import AdminSideNav from '../../components/admin/AdminSideNav';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useOrders } from '../../context/OrdersContext';
import api from '../../api/client';
import { adminApi } from '../../api/admin';
import { Edit3, Trash2, Plus, Save, X } from 'lucide-react';
import ProductPicker from '../../components/admin/ProductPicker';
import { useAuth } from '../../context/AuthContext';

import Seo from '../../components/Seo';
import '../../styles/AdminPage.scss';
const AdsAdmin = React.lazy(() => import('../AdsAdmin'));
import { useSettings } from '../../context/SettingsContext';

import { useLanguage } from '../../context/LanguageContext';
import { resolveLocalized } from '../../utils/locale';

const AdminDashboard = () => {
  const { locale } = useLanguage();
  const { user } = useAuth() || {};
  const isAdmin = user?.role === 'admin';
  const { refresh } = useOrders() || {};

  const {
    products: adminProducts, users, orders,
    addProduct, updateProduct, deleteProduct,
    addUser, updateUser, deleteUser,
    addOrder, updateOrder, deleteOrder
  } = useAdmin();

  // Local shadow list for API-backed products (to avoid breaking existing context usage)
  const [apiProducts, setApiProducts] = useState([]);
  const [apiBacked, setApiBacked] = useState(false); // true if API fetch succeeded (even if empty)
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [prodError, setProdError] = useState(null);

  const effectiveProducts = apiBacked ? apiProducts : adminProducts;

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
  const [finDays, setFinDays] = useState(14);
  const [financials, setFinancials] = useState(null); // { totals, daily }
  const [finLoading, setFinLoading] = useState(false);
  const [finError, setFinError] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
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
    let list = effectiveProducts.map(p => ({
      ...p,
      _flatName: (String(resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || p.name || '')).toLowerCase()
    }));
      if (f) list = list.filter(p => p._flatName.includes(f) || (resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || p.slug || '').toLowerCase().includes(f));
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

  // Client-side pagination for products table
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(20);
  const productTotalPages = Math.max(1, Math.ceil((filteredProducts.length || 0) / productPageSize));
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productPageSize;
    return filteredProducts.slice(start, start + productPageSize);
  }, [filteredProducts, productPage, productPageSize]);
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
  const logoInputRef = React.useRef(null);
  const [settingsForm, setSettingsForm] = useState({
    siteNameAr: '', siteNameEn: '',
    colorPrimary: '', colorSecondary: '', colorAccent: '',
    supportPhone: '', supportMobile: '', supportWhatsapp: '', supportEmail: '', supportHours: '',
    footerAboutAr: '', footerAboutEn: '',
    linkBlog: '', linkSocial: '', linkReturns: '', linkPrivacy: '', appStoreUrl: '', playStoreUrl: ''
  });
  // Use SettingsContext directly (must follow hooks rules)
  const settingsCtx = useSettings();
  useEffect(() => {
    if (settingsCtx?.setting) {
      setStoreSettings(settingsCtx.setting);
      // Preload form with current values
      const s = settingsCtx.setting;
      setSettingsForm(f=>({
        ...f,
        siteNameAr: s.siteNameAr||'', siteNameEn: s.siteNameEn||'',
        colorPrimary: s.colorPrimary||'', colorSecondary: s.colorSecondary||'', colorAccent: s.colorAccent||'',
        supportPhone: s.supportPhone||'', supportMobile: s.supportMobile||'', supportWhatsapp: s.supportWhatsapp||'', supportEmail: s.supportEmail||'', supportHours: s.supportHours||'',
        footerAboutAr: s.footerAboutAr||'', footerAboutEn: s.footerAboutEn||'',
        linkBlog: s.linkBlog||'', linkSocial: s.linkSocial||'', linkReturns: s.linkReturns||'', linkPrivacy: s.linkPrivacy||'', appStoreUrl: s.appStoreUrl||'', playStoreUrl: s.playStoreUrl||''
      }));
    }
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
  // Offers management state
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState(null);
  const [offerFilter, setOfferFilter] = useState('');
  const [offerSort, setOfferSort] = useState('recent'); // recent | discount_desc | price_asc | price_desc
  const [offerCategoryFilter, setOfferCategoryFilter] = useState('');
  const [offerForm, setOfferForm] = useState({ id:null, nameAr:'', nameEn:'', price:'', oldPrice:'', image:'', category:'general' });
  // New: Add-discount helper form
  const [addDiscFilter, setAddDiscFilter] = useState('');
  const [addDiscForm, setAddDiscForm] = useState({ productId:'', percent:'', newPrice:'' });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addDiscShowAll, setAddDiscShowAll] = useState(false); // افتراضياً: عرض المنتجات المؤهلة فقط
  // Batch discount
  const [batchSelected, setBatchSelected] = useState([]); // array of product IDs
  const [batchPercent, setBatchPercent] = useState('');
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

  // Client-side pagination for orders table
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(50);
  const orderTotalPages = Math.max(1, Math.ceil((filteredOrders.length || 0) / orderPageSize));
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  // ------- Brands Handlers -------
  const loadBrands = async () => {
    setBrandLoading(true); setBrandError(null);
    try { const list = await api.brandsList(); setBrands(list); } catch (e) { setBrandError(e.message); } finally { setBrandLoading(false); }
  };
  // Localized SEO title for dashboard
  const siteName = locale === 'ar'
    ? (settingsCtx?.setting?.siteNameAr || 'شركة منفذ اسيا التجارية')
    : (settingsCtx?.setting?.siteNameEn || 'My Store');
  const pageTitle = locale === 'ar' ? `لوحة التحكم | ${siteName}` : `${siteName} | Admin Dashboard`;
  useEffect(() => { try { document.title = pageTitle; } catch {} }, [pageTitle]);
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
        list = list.filter(b => ((resolveLocalized(b.name, locale) || b.name?.ar || b.name?.en || b.slug || '') + '').toLowerCase().includes(needle));
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

  // Client-side pagination for brands table
  const [brandPage, setBrandPage] = useState(1);
  const [brandPageSize, setBrandPageSize] = useState(30);
  const brandTotalPages = Math.max(1, Math.ceil((visibleBrands.length || 0) / brandPageSize));
  const paginatedBrands = useMemo(() => {
    const start = (brandPage - 1) * brandPageSize;
    return visibleBrands.slice(start, start + brandPageSize);
  }, [visibleBrands, brandPage, brandPageSize]);

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

  const saveStoreSettings = async (e) => {
    e?.preventDefault?.();
    setSettingsLoading(true); setSettingsError(null);
    try {
      // Only send fields that have a value (not null/empty/undefined)
      const payload = Object.fromEntries(
        Object.entries(settingsForm).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      if (Object.keys(payload).length === 0) {
        setSettingsError('يرجى تعبئة حقل واحد على الأقل قبل الحفظ.');
        setSettingsLoading(false);
        return;
      }
      // Prefer context method if available
      if (settingsCtx?.update) {
        const updated = await settingsCtx.update(payload);
        if (updated?.setting) setStoreSettings(updated.setting);
      } else {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { ...authHeadersMaybe(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(()=>null);
        if (!res.ok) throw new Error(data?.message || 'فشل تحديث الإعدادات');
        if (data?.setting) setStoreSettings(data.setting);
      }
      alert('تم حفظ الإعدادات');
    } catch (e2) {
      setSettingsError(e2.message);
    } finally {
      setSettingsLoading(false);
    }
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
      // Pre-check duplicates on client for better UX when creating (API-backed mode)
      if (!productForm.id && apiBacked) {
        const norm = (s) => (s||'').toString().trim().toLowerCase();
        const nameAr = norm(productForm.nameAr || '');
        const nameEn = norm(productForm.nameEn || '');
        const slug = norm(productForm.slug || '');
        const hit = apiProducts.find(p => {
          const pAr = norm(p.name?.ar || p.nameAr || '');
          const pEn = norm(p.name?.en || p.nameEn || '');
          const pSlug = norm(p.slug || '');
          return (nameAr && pAr === nameAr) || (nameEn && pEn === nameEn) || (slug && pSlug === slug);
        });
        if (hit) {
          const msg = 'المنتج موجود مسبقاً (اسم أو معرف مكرر)';
          setProdError(msg);
          try { window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'warn', title: 'تكرار المنتج', description: msg } })); } catch {}
          setLoadingProducts(false);
          return;
        }
      }
      if (productForm.id && apiBacked) {
        const updated = useFormData
          ? await api.updateProductForm(productForm.id, payload)
          : await api.updateProduct(productForm.id, payload);
        setApiProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        setAudit(a => [{ ts: Date.now(), action: 'update_product', id: updated.id }, ...a].slice(0,200));
      } else if (apiBacked) {
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
      if (err?.code === 'DUPLICATE_PRODUCT' || msg.includes('SLUG_EXISTS') || msg.includes('DUPLICATE_PRODUCT')) {
        friendly = 'المنتج موجود مسبقاً (Slug/SKU/الاسم)';
        try { window.dispatchEvent(new CustomEvent('toast:show', { detail: { type: 'warn', title: 'تكرار المنتج', description: friendly } })); } catch {}
      }
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

  const Stat = ({ label, value, deltaPct }) => {
    const d = typeof deltaPct === 'number' ? deltaPct : null;
    const positive = d != null ? d >= 0 : null;
    return (
      <div style={statBox}>
        <div style={{display:'flex', alignItems:'baseline', gap:8}}>
          <div style={statValue}>{value}</div>
          {d != null && (
            <span style={{
              fontSize: '.7rem',
              fontWeight: 800,
              padding: '.15rem .4rem',
              borderRadius: 999,
              lineHeight: 1,
              background: positive ? 'rgba(var(--color-primary-rgb),0.12)' : 'rgba(220,38,38,0.08)',
              color: positive ? 'var(--color-primary)' : '#991b1b',
              border: positive ? '1px solid rgba(var(--color-primary-rgb),0.28)' : '1px solid rgba(220,38,38,0.25)'
            }} aria-label={positive ? 'زيادة' : 'انخفاض'}>
              {positive ? '↑' : '↓'} {Math.abs(d).toFixed(0)}%
            </span>
          )}
        </div>
        <div style={statLabel}>{label}</div>
      </div>
    );
  };

  // Fetch products from API on mount (non-blocking). If it fails, fallback stays (context products)
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingProducts(true); setProdError(null);
      try {
        const list = await api.listProducts();
        if (active && Array.isArray(list)) { setApiProducts(list); setApiBacked(true); }
      } catch (e) {
        if (active) { setProdError(e.message); setApiBacked(false); }
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

  const catOptions = useMemo(() => catList.map(c => ({ value: c.slug, label: resolveLocalized(c.name, locale) || c.name?.ar || c.name?.en || c.slug })), [catList, locale]);

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

  // Load financials and recent orders when on overview
  useEffect(() => {
    if (view !== 'overview') return;
    let active = true;
    (async () => {
      setFinLoading(true); setFinError(null);
      try {
        const [fin, ord] = await Promise.all([
          adminApi.statsFinancials({ days: finDays }),
          adminApi.listOrders({ page: 1, pageSize: 10 })
        ]);
        if (!active) return;
        if (fin?.daily) setFinancials(fin);
        if (Array.isArray(ord?.orders)) setRecentOrders(ord.orders);
      } catch (e) {
        if (active) setFinError(e.message);
      } finally {
        if (active) setFinLoading(false);
      }
    })();
    return () => { active = false; };
  }, [view, finDays]);

  // Delta percentage for today's revenue vs أمس (من السلسلة اليومية)
  const revenueDeltaPct = useMemo(() => {
    try {
      const d = financials?.daily || [];
      if (!Array.isArray(d) || d.length < 2) return null;
      const last = d[d.length - 1]?.revenue ?? null;
      const prev = d[d.length - 2]?.revenue ?? null;
      if (typeof last !== 'number' || typeof prev !== 'number' || prev === 0) return null;
      return ((last - prev) / Math.abs(prev)) * 100;
    } catch { return null; }
  }, [financials]);

  // Delta percentage for today's orders vs yesterday
  const ordersDeltaPct = useMemo(() => {
    try {
      const d = financials?.daily || [];
      if (!Array.isArray(d) || d.length < 2) return null;
      const last = d[d.length - 1]?.orders ?? null;
      const prev = d[d.length - 2]?.orders ?? null;
      if (typeof last !== 'number' || typeof prev !== 'number' || prev === 0) return null;
      return ((last - prev) / Math.abs(prev)) * 100;
    } catch { return null; }
  }, [financials]);

  // Delta percentage for today's AOV vs yesterday (using daily aov series)
  const aovDeltaPct = useMemo(() => {
    try {
      const d = financials?.daily || [];
      if (!Array.isArray(d) || d.length < 2) return null;
      const last = d[d.length - 1]?.aov ?? null;
      const prev = d[d.length - 2]?.aov ?? null;
      if (typeof last !== 'number' || typeof prev !== 'number' || prev === 0) return null;
      return ((last - prev) / Math.abs(prev)) * 100;
    } catch { return null; }
  }, [financials]);

  // ------- Offers: loaders & handlers -------
  const loadOffers = async () => {
    setOffersLoading(true); setOffersError(null);
    try {
      const list = await api.listOffers();
      setOffers(Array.isArray(list) ? list : []);
    } catch (e) {
      setOffersError(e.message);
    } finally { setOffersLoading(false); }
  };

  useEffect(() => {
    if (view === 'offers' && !offers.length) loadOffers();
  }, [view]);

  // Ensure categories are available when entering Offers for filtering and form select
  useEffect(() => {
    if (view !== 'offers') return;
    if (catList.length) return;
    let mounted = true;
    setCatLoading(true); setCatError(null);
    api.listCategories({ withCounts: 1 }).then(res => {
      const list = Array.isArray(res?.categories) ? res.categories : [];
      const map = new Map();
      for (const c of list) { if (c?.slug && !map.has(c.slug)) map.set(c.slug, c); }
      const uniq = Array.from(map.values()).sort((a,b) => (b.productCount||0) - (a.productCount||0) || String(a.name?.ar||a.name?.en||a.slug).localeCompare(String(b.name?.ar||b.name?.en||b.slug), 'ar'));
      if (mounted) setCatList(uniq);
    }).catch(err => { if (mounted) setCatError(err.message||'فشل تحميل التصنيفات'); }).finally(() => { if (mounted) setCatLoading(false); });
    return () => { mounted = false; };
  }, [view, catList.length]);

  const visibleOffers = useMemo(() => {
    let list = [...offers];
    const q = (offerFilter||'').toLowerCase();
    if (q) list = list.filter(o => ((resolveLocalized(o.name, locale) || o.name?.ar || o.name?.en || '') + '').toLowerCase().includes(q));
    if (offerCategoryFilter) list = list.filter(o => (o.category||'') === offerCategoryFilter);
    switch (offerSort) {
      case 'discount_desc':
        list.sort((a,b)=> ((a.originalPrice||a.oldPrice||0)-(a.price||0)) < ((b.originalPrice||b.oldPrice||0)-(b.price||0)) ? 1 : -1);
        break;
      case 'price_asc': list.sort((a,b)=> (a.price||0)-(b.price||0)); break;
      case 'price_desc': list.sort((a,b)=> (b.price||0)-(a.price||0)); break;
      case 'recent':
      default:
        list.sort((a,b)=> String(b.updatedAt||b.id).localeCompare(String(a.updatedAt||a.id)));
    }
    return list;
  }, [offers, offerFilter, offerSort]);

  // Ensure products list is available when entering Offers
  useEffect(() => {
    if (view !== 'offers') return;
    if (apiProducts.length) return;
    (async () => {
      try {
        const list = await api.listProducts();
        if (Array.isArray(list)) { setApiProducts(list); setApiBacked(true); }
      } catch { /* ignore load errors here */ }
    })();
  }, [view, apiProducts.length]);

  const resetOfferForm = () => setOfferForm({ id:null, nameAr:'', nameEn:'', price:'', oldPrice:'', image:'', category:'general' });

  const editOffer = (o) => {
    setOfferForm({ id:o.id, nameAr:o.name?.ar||'', nameEn:o.name?.en||'', price:o.price||'', oldPrice:o.originalPrice||o.oldPrice||'', image:o.image||'', category:o.category||'general' });
  };

  const round2 = (n) => Math.max(0, Math.round((+n + Number.EPSILON) * 100) / 100);
  // Eligible only (used for batch eligible list and some filters)
  const availableForDiscount = useMemo(() => {
    const needle = (addDiscFilter||'').toLowerCase();
    return (apiBacked ? apiProducts : effectiveProducts)
      .filter(p => !p.oldPrice && p.price > 0)
      .filter(p => {
        if (!needle) return true;
        const name = (resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || p.name || '').toLowerCase();
        return name.includes(needle);
      })
      .slice(0, 300);
  }, [apiBacked, apiProducts, effectiveProducts, addDiscFilter, locale]);
  // For the single-product "اختر المنتج" select: optionally show all products (not just eligible)
  const availableForAddPicker = useMemo(() => {
    const needle = (addDiscFilter||'').toLowerCase();
    let list = (apiBacked ? apiProducts : effectiveProducts)
      .filter(p => (p.price||0) > 0);
    if (!addDiscShowAll) list = list.filter(p => !p.oldPrice);
    if (needle) list = list.filter(p => {
      const name = (resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || p.name || '').toLowerCase();
      return name.includes(needle);
    });
    return list.slice(0, 300);
  }, [apiBacked, apiProducts, effectiveProducts, addDiscFilter, addDiscShowAll, locale]);
  const selectedAddDiscProduct = useMemo(() => {
    return availableForDiscount.find(p => p.id === addDiscForm.productId) || (apiBacked ? apiProducts.find(p=>p.id===addDiscForm.productId) : effectiveProducts.find(p=>p.id===addDiscForm.productId));
  }, [availableForDiscount, addDiscForm.productId, apiBacked, apiProducts, effectiveProducts]);
  const onAddDiscPercent = (v) => {
    setAddDiscForm(f => {
      const price = selectedAddDiscProduct?.price || 0;
      const perc = +v || 0;
      const np = price ? round2(price * (100 - perc) / 100) : '';
      return { ...f, percent: v, newPrice: np };
    });
  };
  const onAddDiscNewPrice = (v) => {
    setAddDiscForm(f => {
      const price = selectedAddDiscProduct?.price || 0;
      const np = +v || 0;
      const perc = price ? Math.max(0, Math.round((1 - (np/price)) * 100)) : '';
      return { ...f, newPrice: v, percent: perc };
    });
  };
  const applyAddDiscount = async (e) => {
    e?.preventDefault?.();
    if (!addDiscForm.productId) { setOffersError('اختر منتجاً لإضافة خصم'); return; }
    const basePrice = +selectedAddDiscProduct?.price || 0;
    const newPrice = +addDiscForm.newPrice || 0;
    if (!(basePrice>0) || !(newPrice>0) || newPrice >= basePrice) {
      setOffersError('السعر الجديد غير صالح. يجب أن يكون أقل من السعر الحالي');
      return;
    }
    setOffersLoading(true); setOffersError(null);
    try {
      await api.updateProduct(addDiscForm.productId, { oldPrice: basePrice, price: round2(newPrice) });
      await loadOffers();
      setAddDiscForm({ productId:'', percent:'', newPrice:'' });
      setAddDiscFilter('');
    } catch (e2) {
      setOffersError(e2.message);
    } finally { setOffersLoading(false); }
  };

  const submitOffer = async (e) => {
    e.preventDefault(); setOffersLoading(true); setOffersError(null);
    try {
      if (offerForm.oldPrice && +offerForm.oldPrice <= +offerForm.price) {
        throw new Error('السعر القديم يجب أن يكون أعلى من السعر الحالي لاحتساب الخصم');
      }
      const payload = {
        nameAr: offerForm.nameAr || offerForm.nameEn || 'عرض',
        nameEn: offerForm.nameEn || offerForm.nameAr || 'Offer',
        price: +offerForm.price,
        oldPrice: offerForm.oldPrice ? +offerForm.oldPrice : null,
        category: offerForm.category || 'general',
        image: offerForm.image || undefined
      };
      if (offerForm.id) {
        await api.updateProduct(offerForm.id, payload);
        await loadOffers();
      } else {
        await api.createProduct(payload);
        await loadOffers();
      }
      resetOfferForm();
    } catch (e2) {
      setOffersError(e2.message);
    } finally { setOffersLoading(false); }
  };

  const clearOfferDiscount = async (id) => {
    if (!id) return;
    if (!window.confirm('مسح الخصم لهذا المنتج؟')) return;
    setOffersLoading(true); setOffersError(null);
    try {
      await api.updateProduct(id, { oldPrice: null });
      // Remove from current offers list since it no longer qualifies
      setOffers(os => os.filter(o => o.id !== id));
      // If editing the same offer, reset form
      setOfferForm(f => (f.id === id ? { id:null, nameAr:'', nameEn:'', price:'', oldPrice:'', image:'', category:'general' } : f));
    } catch (e) {
      setOffersError(e.message);
    } finally { setOffersLoading(false); }
  };

  const removeOffer = async (id) => {
    if (!window.confirm('حذف هذا العرض؟')) return;
    setOffersLoading(true); setOffersError(null);
    try {
      await api.deleteProduct(id);
      setOffers(os => os.filter(o => o.id !== id));
    } catch (e) { setOffersError(e.message); } finally { setOffersLoading(false); }
  };

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
    <div className="admin-root" style={pageWrap} dir={locale==='ar'?'rtl':'ltr'}>
      <Seo title={pageTitle} description={locale==='ar' ? 'لوحة تحكم الإدارة' : 'Admin control panel'} />
      

      {/* Two-column layout with sticky admin sidebar */}
      <div className="admin-two-col">
        <AdminSideNav />
        <div>

      <div className="admin-subbar">
        <div className="admin-subbar-title">
          {{
            overview: 'نظرة عامة',
            offers: 'العروض',
            products: 'المنتجات',
            users: 'المستخدمون',
            orders: 'الطلبات',
            audit: 'السجلات',
            brands: 'العلامات',
            marketing: 'التسويق',
            settings: 'الإعدادات',
            reviews: 'المراجعات',
            cats: 'التصنيفات'
          }[view] || 'لوحة التحكم'}
        </div>
        {/* Optional meta slot: counts or quick tips */}
        {/* <div className="admin-subbar-meta">نصيحة سريعة: استخدم البحث لتصفية العناصر</div> */}
      </div>

      {/* Navigation moved to AdminSideNav; in-page tab buttons removed */}

      {/* Ads Management (lazy loaded to reduce initial admin bundle) */}
      {view === 'ads' && (
        <React.Suspense fallback={<div style={{padding:24}}>تحميل الإعلانات...</div>}>
          <AdsAdmin />
        </React.Suspense>
      )}

      {/* Overview */}
      {view === 'overview' && (
        <div className="admin-stat-grid">
          {loadingRemote ? (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{height: 96}} />
              ))}
            </>
          ) : (
            <>
              <Stat label="طلبات اليوم" value={stats.todayOrders} deltaPct={ordersDeltaPct} />
              <Stat label="إيراد اليوم" value={stats.todayRevenue.toFixed(2)} deltaPct={revenueDeltaPct} />
              <Stat label="متوسط السلة (اليوم)" value={stats.avgOrderValueToday.toFixed(2)} deltaPct={aovDeltaPct} />
              <div style={statBox}>
                <div style={statValue}>{stats.pendingBankCount}</div>
                <div style={statLabel}>تحويلات بنكية معلقة</div>
                <div style={{marginTop:6}}>
                  <a href="/admin/bank-transfers" style={{fontSize:'.7rem',textDecoration:'none',color:'var(--color-primary)'}}>مراجعة الآن →</a>
                </div>
              </div>
              <Stat label="إجمالي المنتجات" value={effectiveProducts.length} />
              <Stat label="المستخدمون" value={remoteUsers.length || users.length} />
              <Stat label="كل الطلبات (محلي)" value={orders.length} />
            </>
          )}
          {/* Financials mini-chart */}
          <div style={{...statBox, gridColumn:'1/-1'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700}}>الأداء المالي</div>
              <div>
                <select value={finDays} onChange={e=>setFinDays(+e.target.value)} style={searchInput}>
                  {[7,14,30,60].map(d => <option key={d} value={d}>{d} يوم</option>)}
                </select>
              </div>
            </div>
            {finLoading && (
              <div>
                <div className="skeleton" style={{height: 18, width: '45%', marginBottom: 10}} />
                <div className="skeleton" style={{height: 120, width: '100%'}} />
              </div>
            )}
            {finError && <div style={{fontSize:'.7rem',color:'#b91c1c'}}>خطأ: {finError}</div>}
            {financials && (
              <div style={{display:'grid', gap:'10px'}}>
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                  <div style={miniStat}><div style={miniStatVal}>{Number(financials.totals?.totalRevenue||0).toFixed(2)}</div><div style={miniStatLbl}>إجمالي الإيراد</div></div>
                  <div style={miniStat}><div style={miniStatVal}>{financials.totals?.totalOrders||0}</div><div style={miniStatLbl}>إجمالي الطلبات</div></div>
                  <div style={miniStat}><div style={miniStatVal}>{Number(financials.totals?.overallAov||0).toFixed(2)}</div><div style={miniStatLbl}>متوسط السلة</div></div>
                  <div style={miniStat}><div style={miniStatVal}>{financials.totals?.activeCustomersWindow||0}</div><div style={miniStatLbl}>عملاء نشطون</div></div>
                </div>
                {/* Simple inline chart using CSS bars */}
                <div style={{display:'grid', gridTemplateColumns:`repeat(${financials.daily.length}, minmax(2px,1fr))`, gap:2, alignItems:'end', height:120, background:'var(--color-bg-alt)', border:'1px solid var(--color-border-soft)', borderRadius:10, padding:6}} aria-label="مخطط الإيرادات">
                  {(() => {
                    const max = Math.max(1, ...financials.daily.map(d => d.revenue||0));
                    return financials.daily.map(d => {
                      const h = Math.round((d.revenue||0) / max * 100);
                      return <div key={d.date} title={`${d.date} • ${Number(d.revenue||0).toFixed(2)}`} style={{height:`${h}%`, background:'linear-gradient(180deg, var(--color-primary), var(--color-gold))', borderRadius:3}} />
                    });
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div style={{...statBox, gridColumn:'1/-1'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontWeight:700}}>أحدث 10 طلبات</div>
              <a href="/admin/reports" style={{fontSize:'.7rem',textDecoration:'none',color:'var(--color-primary)'}}>عرض التقارير →</a>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{...table, marginTop:8}}>
                <thead>
                  <tr><th>ID</th><th>المبلغ</th><th>الحالة</th><th>طريقة</th><th>الوقت</th><th>إجراءات</th></tr>
                </thead>
                <tbody>
                  {recentOrders.map(o => (
                    <tr key={o.id}>
                      <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis'}}>{o.id}</td>
                      <td>{o.grandTotal?.toFixed ? o.grandTotal.toFixed(2) : o.grandTotal} {o.currency}</td>
                      <td><span style={chip(o.status)}>{o.status}</span></td>
                      <td>{o.paymentMethod||'-'}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td style={tdActions}>
                        <a href={`/order/${o.id}`} style={{fontSize:'.65rem',textDecoration:'none',color:'var(--color-primary)'}}>عرض</a>
                        <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noopener" style={{fontSize:'.65rem',textDecoration:'none',color:'#075985'}}>فاتورة</a>
                      </td>
                    </tr>
                  ))}
                  {!recentOrders.length && (
                    <tr><td colSpan={6} style={emptyCell}>لا توجد طلبات</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
              {paginatedProducts.map(p => {
                const open = openTierProductId === p.id;
                const tiers = tiersByProduct[p.id] || [];
                const lowestTier = tiers.length ? tiers[0] : null;
                return (
                  <React.Fragment key={p.id}>
                    <tr>
                      <td>{resolveLocalized(p.name, locale) || p.name?.ar || p.name?.en || p.name}</td>
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
                            if (apiBacked) {
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
                                      <td style={{fontSize:'.6rem'}}>{resolveLocalized(t.note, locale) || t.note?.ar || t.note?.en || '—'}</td>
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
          {/* Products pagination controls */}
          {filteredProducts.length > 0 && (
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
              <button style={productPage===1?ghostBtn:primaryBtn} disabled={productPage===1} onClick={()=>setProductPage(p=>Math.max(1,p-1))}>السابق</button>
              <span style={{fontSize:'.65rem'}}>صفحة {productPage} / {productTotalPages}</span>
              <button style={productPage===productTotalPages?ghostBtn:primaryBtn} disabled={productPage===productTotalPages} onClick={()=>setProductPage(p=>Math.min(productTotalPages,p+1))}>التالي</button>
              <span style={{marginInlineStart:10,fontSize:'.65rem'}}>عدد الصفوف:</span>
              <select value={productPageSize} onChange={e=>{ setProductPageSize(+e.target.value); setProductPage(1); }} style={searchInput}>
                {[10,20,30,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
              <span style={{fontSize:'.65rem',opacity:.7}}>{filteredProducts.length} عنصر</span>
            </div>
          )}
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
              {paginatedOrders.map(o => {
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
          {/* Orders pagination controls */}
          {filteredOrders.length > 0 && (
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
              <button style={orderPage===1?ghostBtn:primaryBtn} disabled={orderPage===1} onClick={()=>setOrderPage(p=>Math.max(1,p-1))}>السابق</button>
              <span style={{fontSize:'.65rem'}}>صفحة {orderPage} / {orderTotalPages}</span>
              <button style={orderPage===orderTotalPages?ghostBtn:primaryBtn} disabled={orderPage===orderTotalPages} onClick={()=>setOrderPage(p=>Math.min(orderTotalPages,p+1))}>التالي</button>
              <span style={{marginInlineStart:10,fontSize:'.65rem'}}>عدد الصفوف:</span>
              <select value={orderPageSize} onChange={e=>{ setOrderPageSize(+e.target.value); setOrderPage(1); }} style={searchInput}>
                {[20,50,100,200,500].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
              <span style={{fontSize:'.65rem',opacity:.7}}>{filteredOrders.length} عنصر</span>
            </div>
          )}
        </div>
      )}

      {/* Users tab removed in favor of dedicated /admin/users page. */}

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
                  {finLoading && (
                    <tr>
                      <td colSpan={6}>
                        <div className="skeleton" style={{height: 36, marginBottom: 8}} />
                        <div className="skeleton" style={{height: 36, marginBottom: 8}} />
                        <div className="skeleton" style={{height: 36}} />
                      </td>
                    </tr>
                  )}
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
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  style={{display:'none'}}
                  onChange={e=> setSettingsLogoFile(e.target.files?.[0]||null)}
                />
                <button type="button" onClick={()=> logoInputRef.current?.click()} style={{background:'#e2e8f0', color:'#0f172a', border:0, padding:'6px 10px', borderRadius:8, fontWeight:700}}>
                  اختر صورة من جهازك
                </button>
                {settingsLogoFile && <span style={{fontSize:'.65rem'}}>{settingsLogoFile.name}</span>}
                <button
                  type="button"
                  style={primaryBtn}
                  disabled={!settingsLogoFile || settingsLoading}
                  onClick={async () => {
                    setSettingsLoading(true); setSettingsError(null);
                    try {
                      if (settingsCtx?.uploadLogo) {
                        const newSetting = await settingsCtx.uploadLogo(settingsLogoFile);
                        if (newSetting) setStoreSettings(newSetting);
                        setSettingsLogoFile(null);
                        alert('تم رفع الشعار بنجاح');
                      }
                    } catch (e) {
                      setSettingsError(e.message);
                    } finally {
                      setSettingsLoading(false);
                    }
                  }}
                >رفع الشعار</button>
                <button type="button" style={ghostBtn} onClick={loadSettings} disabled={settingsLoading}>تحديث</button>
              </div>
              <p style={mutedP}>الملفات المسموحة: صور حتى 2MB. يتم إنشاء نسخة WebP محسنة تلقائياً.</p>
            </div>
            <form onSubmit={saveStoreSettings} style={{background:'#fff',padding:'1rem',borderRadius:12,boxShadow:'0 4px 14px -6px rgba(0,0,0,.08)', display:'grid', gap:8}}>
              <h4 style={{marginTop:0}}>تحديث الإعدادات</h4>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:8}}>
                <input placeholder="اسم عربي" value={settingsForm.siteNameAr} onChange={e=>setSettingsForm(f=>({...f,siteNameAr:e.target.value}))} />
                <input placeholder="Name EN" value={settingsForm.siteNameEn} onChange={e=>setSettingsForm(f=>({...f,siteNameEn:e.target.value}))} />
                <input placeholder="#69be3c" value={settingsForm.colorPrimary} onChange={e=>setSettingsForm(f=>({...f,colorPrimary:e.target.value}))} />
                <input placeholder="#1f2937" value={settingsForm.colorSecondary} onChange={e=>setSettingsForm(f=>({...f,colorSecondary:e.target.value}))} />
                <input placeholder="#ef4444" value={settingsForm.colorAccent} onChange={e=>setSettingsForm(f=>({...f,colorAccent:e.target.value}))} />
                <input placeholder="هاتف" value={settingsForm.supportPhone} onChange={e=>setSettingsForm(f=>({...f,supportPhone:e.target.value}))} />
                <input placeholder="جوال" value={settingsForm.supportMobile} onChange={e=>setSettingsForm(f=>({...f,supportMobile:e.target.value}))} />
                <input placeholder="واتساب" value={settingsForm.supportWhatsapp} onChange={e=>setSettingsForm(f=>({...f,supportWhatsapp:e.target.value}))} />
                <input placeholder="Email" value={settingsForm.supportEmail} onChange={e=>setSettingsForm(f=>({...f,supportEmail:e.target.value}))} />
                <input placeholder="ساعات الدعم" value={settingsForm.supportHours} onChange={e=>setSettingsForm(f=>({...f,supportHours:e.target.value}))} />
                <input placeholder="عن الشركة AR" value={settingsForm.footerAboutAr} onChange={e=>setSettingsForm(f=>({...f,footerAboutAr:e.target.value}))} />
                <input placeholder="About EN" value={settingsForm.footerAboutEn} onChange={e=>setSettingsForm(f=>({...f,footerAboutEn:e.target.value}))} />
                <input placeholder="رابط المدونة" value={settingsForm.linkBlog} onChange={e=>setSettingsForm(f=>({...f,linkBlog:e.target.value}))} />
                <input placeholder="روابط التواصل" value={settingsForm.linkSocial} onChange={e=>setSettingsForm(f=>({...f,linkSocial:e.target.value}))} />
                <input placeholder="سياسة الاسترجاع" value={settingsForm.linkReturns} onChange={e=>setSettingsForm(f=>({...f,linkReturns:e.target.value}))} />
                <input placeholder="سياسة الخصوصية" value={settingsForm.linkPrivacy} onChange={e=>setSettingsForm(f=>({...f,linkPrivacy:e.target.value}))} />
                <input placeholder="App Store URL" value={settingsForm.appStoreUrl} onChange={e=>setSettingsForm(f=>({...f,appStoreUrl:e.target.value}))} />
                <input placeholder="Play Store URL" value={settingsForm.playStoreUrl} onChange={e=>setSettingsForm(f=>({...f,playStoreUrl:e.target.value}))} />
              </div>
              <div style={{display:'flex', gap:8}}>
                <button type="submit" style={primaryBtn} disabled={settingsLoading}>حفظ</button>
                <button type="button" style={ghostBtn} onClick={()=> loadSettings()}>إلغاء</button>
              </div>
            </form>
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
                  {brands.map(b=> <option key={b.id} value={b.id}>{(resolveLocalized(b.name, locale) || b.name?.ar||b.name?.en||b.slug)} ({b.productCount||0})</option>)}
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
                    const name = (resolveLocalized(b.name, locale) || b.name?.ar || b.name?.en || b.slug || '').toLowerCase();
                    return (b.slug||'').toLowerCase().includes(n) || name.includes(n);
                  }).map(b=> (
                    <label key={b.id} style={{display:'flex',alignItems:'center',gap:8,fontSize:'.75rem'}}>
                      <input type="checkbox" checked={mergeSourceIds.includes(b.id)} onChange={()=> setMergeSourceIds(prev => prev.includes(b.id) ? prev.filter(x=>x!==b.id) : [...prev, b.id])} />
                      <span style={{opacity:.85}}>{resolveLocalized(b.name, locale) || b.name?.ar||b.name?.en||b.slug}</span>
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
              {paginatedBrands.map(b => (
                <tr key={b.id}>
                  <td>{b.logo? <img src={b.logo} alt="logo" loading="lazy" style={{width:38,height:38,objectFit:'contain'}} /> : '—'}</td>
                  <td>{resolveLocalized(b.name, locale) || b.name?.ar || b.name?.en}</td>
                  <td style={{fontSize:'.6rem'}}>{b.slug}</td>
                  <td>{b.productCount || 0}</td>
                  <td style={{fontSize:'.6rem',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis'}}>{resolveLocalized(b.description, locale) || b.description?.ar || b.description?.en || '—'}</td>
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
          {/* Brands pagination controls */}
          {visibleBrands.length > 0 && (
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
              <button style={brandPage===1?ghostBtn:primaryBtn} disabled={brandPage===1} onClick={()=>setBrandPage(p=>Math.max(1,p-1))}>السابق</button>
              <span style={{fontSize:'.65rem'}}>صفحة {brandPage} / {brandTotalPages}</span>
              <button style={brandPage===brandTotalPages?ghostBtn:primaryBtn} disabled={brandPage===brandTotalPages} onClick={()=>setBrandPage(p=>Math.min(brandTotalPages,p+1))}>التالي</button>
              <span style={{marginInlineStart:10,fontSize:'.65rem'}}>عدد الصفوف:</span>
              <select value={brandPageSize} onChange={e=>{ setBrandPageSize(+e.target.value); setBrandPage(1); }} style={searchInput}>
                {[10,20,30,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
              <span style={{fontSize:'.65rem',opacity:.7}}>{visibleBrands.length} عنصر</span>
            </div>
          )}
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
                      <td>{resolveLocalized(f.title, locale) || f.title?.ar || f.title?.en}</td>
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
                      <td>{resolveLocalized(a.label, locale) || a.label?.ar || a.label?.en || '—'}</td>
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
      </div>
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
// Base input styles used in forms
const input = { ...searchInput, minWidth: 180 };
const inputSmall = { ...searchInput, minWidth: 110 };
const grid3 = { display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' };
const statBox = { background: 'var(--color-surface)', padding: '1rem', borderRadius: 14, boxShadow: '0 4px 14px -6px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: '.35rem', border: '1px solid var(--color-border-soft)' };
const statValue = { fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text)' };
const statLabel = { fontSize: '.7rem', letterSpacing: '.5px', color: 'var(--color-text-faint)', fontWeight: 600 };
const miniStat = { background:'var(--color-bg-alt)', border:'1px solid var(--color-border)', borderRadius:10, padding:'.5rem .7rem' };
const miniStatVal = { fontSize:'.95rem', fontWeight:800, color: 'var(--color-text)' };
const miniStatLbl = { fontSize:'.65rem', color:'var(--color-text-faint)', fontWeight:700 };
const sectionWrap = { background: 'transparent', display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const formRow = { background: 'var(--color-surface)', padding: '1rem 1.1rem 1.25rem', borderRadius: 14, boxShadow: '0 4px 14px -6px rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column', gap: '.8rem', border: '1px solid var(--color-border-soft)' };
const formGrid = { display: 'grid', gap: '.65rem', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' };
const actionsRow = { display: 'flex', gap: '.6rem', flexWrap: 'wrap' };
const subTitle = { margin: 0, fontSize: '1rem', fontWeight: 700 };
const primaryBtn = { display: 'inline-flex', alignItems: 'center', gap: '.4rem', border: 0, background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-alt))', color: '#fff', padding: '.6rem .95rem', borderRadius: 10, cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, boxShadow: '0 10px 20px -12px rgba(var(--color-primary-rgb),0.35)' };
const ghostBtn = { ...primaryBtn, background: 'var(--color-bg-alt)', color: 'var(--color-text)', boxShadow: 'none' };
// Secondary button (neutral variant)
const secondaryBtn = { ...primaryBtn, background: 'var(--color-bg-alt)', color: 'var(--color-text)', boxShadow: 'none' };
// Link-like button used for small cancel actions
const linkBtnStyle = { background: 'transparent', border: 0, color: 'var(--color-text)', opacity: .9, cursor: 'pointer', padding: '.4rem .6rem', borderRadius: 8, fontSize: '.75rem', fontWeight: 600 };
const table = { width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 14px -6px rgba(0,0,0,.06)', border: '1px solid var(--color-border-soft)' };
const tdActions = { display: 'flex', gap: '.35rem', alignItems: 'center' };
const iconBtn = { background: 'var(--color-bg-alt)', border: 0, width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', color: 'var(--color-text)' };
const iconBtnDanger = { ...iconBtn, background: '#fee2e2', color: '#b91c1c' };
const emptyCell = { textAlign: 'center', padding: '1rem', fontSize: '.75rem', color: 'var(--color-text-faint)' };
const mutedP = { fontSize: '.75rem', color: 'var(--color-text-soft)', margin: '.25rem 0 1rem' };
const ulClean = { margin: 0, padding: '0 1rem', listStyle: 'disc', lineHeight: 1.9 };
const errorText = { fontSize: '.75rem', color: '#b91c1c' };
// Tier pricing sub-table styles
const tierLabel = { fontSize: '.55rem', fontWeight: 600, color: 'var(--color-text-soft)' };
const tierInput = { ...searchInput, minWidth: 90, fontSize: '.65rem', padding: '.4rem .5rem' };

// Status chip style helper
function chip(status) {
  const base = { display:'inline-block', padding:'.15rem .45rem', borderRadius:999, fontSize:'.65rem', fontWeight:700 };
  const themed = {
    success: {
      background: 'rgba(var(--color-primary-rgb),0.12)',
      color: 'var(--color-primary)',
      border: '1px solid rgba(var(--color-primary-rgb),0.28)'
    },
    info: {
      background: 'rgba(var(--color-accent-rgb,58,90,121),0.10)',
      color: 'var(--color-accent)',
      border: '1px solid rgba(var(--color-accent-rgb,58,90,121),0.25)'
    },
    warning: {
      background: 'rgba(217,119,6,0.10)',
      color: 'var(--color-warning)',
      border: '1px solid rgba(217,119,6,0.28)'
    },
    danger: {
      background: 'rgba(220,38,38,0.10)',
      color: 'var(--color-danger)',
      border: '1px solid rgba(220,38,38,0.25)'
    },
    neutral: {
      background: 'var(--color-bg-alt)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)'
    }
  };
  const map = {
    pending: themed.warning,
    processing: themed.info,
    paid: themed.success,
    shipped: themed.info,
    completed: themed.success,
    cancelled: themed.danger,
    pending_bank_review: themed.warning
  };
  return { ...base, ...(map[status] || themed.neutral) };
}

export default AdminDashboard;

// -------- Helper Functions & Effects for Brands / Marketing (placed after export to avoid clutter above) --------
// NOTE: These rely on closure over React imports & api object already in file scope.

// We'll augment component prototype by monkey patching inside module scope: Not ideal, but simpler than large refactor.
// Instead we'll re-open the component via prototype? Simpler: move helper funcs above usage. For minimal diff, attach to window if needed.
// Safer: Do nothing here – helpers will be defined inside component via inline functions above? For clarity, we keep them here as comments.


// Lazy inline component for reviews moderation (kept here for simplicity)
import { useState as _useState, useEffect as _useEffect } from 'react';
import _rawApi from '../../api/client';

// Inline Categories Admin manager
const CategoriesAdmin = () => {
  const { locale } = useLanguage();
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
                <td>{resolveLocalized(c.name, locale) || c.name?.ar || c.name?.en || c.slug}</td>
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

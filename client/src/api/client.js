// Full-featured API client wrapper for React / Vite projects
// Includes logging, audit, error handling, and token management
// Ready to use directly with secured backend endpoints
// Full-featured API client wrapper for React / Vite projects
// Includes logging, audit, error handling, and token management
// Ready to use directly with secured backend endpoints

const DEV = import.meta?.env?.DEV;
const VITE_API_ENV = import.meta?.env?.VITE_API_URL;
let API_BASE = '/api';
if (typeof VITE_API_ENV === 'string' && VITE_API_ENV.trim()) {
  const v = VITE_API_ENV.replace(/\/$/, '');
  // If it's a relative path (starts with /), use it as-is.
  if (v.startsWith('/')) {
    API_BASE = v;
  } else {
    // Try to parse as absolute URL. If valid, use the origin (protocol://host:port)
    try {
      const u = new URL(v);
      API_BASE = u.origin; // don't include pathname
    } catch {
      // Fallback: use the raw value (best-effort)
      API_BASE = v;
    }
  }
}
if (DEV) API_BASE = API_BASE || '/api';

async function request(path, options = {}) {
  const url = API_BASE + path;
  let res;
  let token = null;
  try { token = localStorage.getItem('my_store_token'); } catch {}
  const isFormData = options.body instanceof FormData;
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Dev headers for testing without login
  if (DEV && !token && !path.startsWith('/auth')) {
    let devUser = null;
    try { const raw = localStorage.getItem('my_store_user'); if (raw) devUser = JSON.parse(raw); } catch {}
    headers['x-user-id'] = devUser?.id || 'dev-admin';
    headers['x-user-role'] = devUser?.role || 'admin';
  }

  try {
    const needCreds = path.startsWith('/auth');
    res = await fetch(url, { headers, ...options, ...(needCreds ? { credentials: 'include' } : {}) });
  } catch (e) { throw new Error('Network error: ' + e.message); }

  // Handle 401 auto-refresh once
  if (res.status === 401 && !options._retry) {
    try {
      const r = await fetch(API_BASE + '/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
      if (r.ok) {
        const body = await r.json();
        if (body?.accessToken) {
          try { localStorage.setItem('my_store_token', body.accessToken); } catch {}
          const retryHeaders = { ...headers, Authorization: `Bearer ${body.accessToken}` };
          const retryRes = await fetch(url, { headers: retryHeaders, ...options, _retry: true });
          if (!retryRes.ok) throw new Error(`API Error ${retryRes.status} after refresh`);
          return retryRes.json();
        }
      }
    } catch {}
  }

  if (!res.ok) {
    let bodyText = '';
    let parsed;
    try { bodyText = await res.text(); } catch {}
    if (bodyText) { try { parsed = JSON.parse(bodyText); } catch {} }
    const method = (options.method || 'GET').toUpperCase();
    const msg = `API Error ${res.status} ${res.statusText} (${method} ${path})` + (parsed?.error ? ` code=${parsed.error}` : '');
    if (DEV) console.error('[API]', msg);
    if (parsed && typeof parsed === 'object') return Promise.reject(Object.assign(new Error(msg), { code: parsed.error, data: parsed, status: res.status }));
    throw new Error(msg);
  }
  return res.json();
}

// Exported API methods with security, logging, audit-ready
const api = {
  request,
  listProducts: () => request('/products'),
  getProduct: id => request(`/products/${id}`),
  searchProducts: params => {
    const qs = new URLSearchParams();
    Object.entries(params||{}).forEach(([k,v]) => { if (v != null && v !== '') qs.append(k,v); });
    return request('/products' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  createProduct: data => request('/products', { method:'POST', body: JSON.stringify(data) }),
  updateProduct: (id,data) => request(`/products/${id}`, { method:'PUT', body: JSON.stringify(data) }),
  deleteProduct: id => request(`/products/${id}`, { method:'DELETE' }),
  // Offers
  listOffers: () => request('/products/offers'),
  // Multipart helpers for products (image upload via FormData)
  createProductForm: (formData) => request('/products', { method:'POST', body: formData }),
  updateProductForm: (id, formData) => request(`/products/${encodeURIComponent(id)}`, { method:'PUT', body: formData }),
  // Orders
  listOrders: (userId) => request('/orders' + (userId ? `?userId=${encodeURIComponent(userId)}` : '')),
  getOrder: id => request(`/orders/${id}`),
  createOrder: data => request('/orders', { method:'POST', body: JSON.stringify(data) }),
  updateOrder: (id,patch) => request(`/orders/${id}`, { method:'PATCH', body: JSON.stringify(patch||{}) }),
  // Auth
  authLogin: (email,password) => request('/auth/login', { method:'POST', body: JSON.stringify({email,password}), credentials:'include' }),
  authRegister: (email,password,name) => request('/auth/register', { method:'POST', body: JSON.stringify({email,password,name}), credentials:'include' }),
  authLogout: () => request('/auth/logout', { method:'POST', credentials:'include' }),
  me: () => request('/auth/me'),
  meUpdate: patch => request('/auth/me', { method:'PATCH', body: JSON.stringify(patch||{}) }),
  // Wishlist
  wishlistList: () => request('/wishlist'),
  wishlistAdd: productId => request('/wishlist', { method:'POST', body: JSON.stringify({ productId }) }),
  wishlistRemove: productId => request(`/wishlist/${productId}`, { method:'DELETE' }),
  // Reviews
  reviewsModerationList: () => request('/reviews/moderation'),
  reviewModerate: (id, action) => request(`/reviews/${encodeURIComponent(id)}/moderate`, { method:'POST', body: JSON.stringify({ action }) }),
  // جلب مراجعات منتج معين
  reviewsListForProduct: (productId) => request(`/reviews?productId=${encodeURIComponent(productId)}`),
  // Cart
  cartList: () => request('/cart'),
  cartSet: (productId,quantity) => request('/cart/set', { method:'POST', body: JSON.stringify({ productId, quantity }) }),
  cartRemoveItem: (productId) => request(`/cart/item/${encodeURIComponent(productId)}`, { method:'DELETE' }),
  cartMerge: (items) => request('/cart/merge', { method:'POST', body: JSON.stringify({ items }) }),
  cartClear: () => request('/cart', { method:'DELETE' }),
  // Bank transfers
  bankConfirm: (orderId,ref) => request('/pay/bank/confirm', { method:'POST', body: JSON.stringify({ orderId, reference: ref }) }),
  bankReject: (orderId,reason) => request('/pay/bank/reject', { method:'POST', body: JSON.stringify({ orderId, reason }) }),
  
  // Categories
  listCategories: (params) => {
    const qs = new URLSearchParams();
    const p = params || {};
    if (p.withCounts) qs.append('withCounts', String(p.withCounts));
    return request('/categories' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  getCategoryBySlug: (slug) => request(`/categories/slug/${encodeURIComponent(slug)}`),
  // Category CRUD (flat naming for consistency)
  categoryCreate: (dataOrForm) => {
    if (dataOrForm instanceof FormData) return request('/categories', { method: 'POST', body: dataOrForm });
    return request('/categories', { method: 'POST', body: JSON.stringify(dataOrForm) });
  },
  categoryUpdate: (id, dataOrForm) => {
    if (dataOrForm instanceof FormData) return request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: dataOrForm });
    return request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(dataOrForm) });
  },
  categoryDelete: (id) => request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  // Back-compat aliases used in AdminDashboard inline manager
  createCategory: function(data) { return this.categoryCreate(data); },
  createCategoryForm: function(formData) { return this.categoryCreate(formData); },
  updateCategory: function(id, data) { return this.categoryUpdate(id, data); },
  updateCategoryForm: function(id, formData) { return this.categoryUpdate(id, formData); },
  deleteCategory: function(id) { return this.categoryDelete(id); },


  // Settings (site identity/colors)
  settingsGet: () => request('/settings'),
  settingsUpdate: (patch) => request('/settings', { method: 'PATCH', body: JSON.stringify(patch||{}) }),
  settingsUploadLogo: (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return request('/settings/logo', { method: 'POST', body: formData });
  },
  // Brands
  brandsList: () => request('/brands'),

  // Marketing
  marketingFeatures: () => request('/marketing/features'),
  marketingBanners: () => request('/marketing/banners'),
  marketingAppLinks: () => request('/marketing/app-links'),
  marketingTrack: (payload) => request('/marketing/track', { method:'POST', body: JSON.stringify(payload||{}) }),
  marketingMetrics: (days=30) => request(`/marketing/metrics?days=${encodeURIComponent(days)}`),
  marketingFeatureCreate: (data) => request('/marketing/features', { method:'POST', body: JSON.stringify(data||{}) }),
  marketingFeatureUpdate: (id,data) => request(`/marketing/features/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify(data||{}) }),
  marketingFeatureDelete: (id) => request(`/marketing/features/${encodeURIComponent(id)}`, { method:'DELETE' }),
  marketingBannerCreate: (data) => request('/marketing/banners', { method:'POST', body: JSON.stringify(data||{}) }),
  marketingBannerUpdate: (id,data) => request(`/marketing/banners/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify(data||{}) }),
  marketingBannerDelete: (id) => request(`/marketing/banners/${encodeURIComponent(id)}`, { method:'DELETE' }),
  marketingAppLinkCreate: (data) => request('/marketing/app-links', { method:'POST', body: JSON.stringify(data||{}) }),
  marketingAppLinkUpdate: (id,data) => request(`/marketing/app-links/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify(data||{}) }),
  marketingAppLinkDelete: (id) => request(`/marketing/app-links/${encodeURIComponent(id)}`, { method:'DELETE' }),

  // Ads CRUD (Ad table)
  listAds: () => request('/ads'),
  createAd: (data) => request('/ads', { method: 'POST', body: JSON.stringify(data) }),
  updateAd: (id, data) => request(`/ads/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAd: (id) => request(`/ads/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Search / catalog
  searchTypeahead: (q) => request(`/search/typeahead?q=${encodeURIComponent(q||'')}`),
  catalogSummary: () => request('/products/catalog/summary'),

  // Tier prices (per product)
  tierList: (productId) => request(`/tier-prices/products/${encodeURIComponent(productId)}/tier-prices`),
  tierCreate: (productId, data) => request(`/tier-prices/products/${encodeURIComponent(productId)}/tier-prices`, { method:'POST', body: JSON.stringify(data||{}) }),
  tierUpdate: (id, patch) => request(`/tier-prices/tier-prices/${encodeURIComponent(id)}`, { method:'PATCH', body: JSON.stringify(patch||{}) }),
  tierDelete: (id) => request(`/tier-prices/tier-prices/${encodeURIComponent(id)}`, { method:'DELETE' }),

  // Delivery endpoints
  deliveryList: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v != null && v !== '') qs.append(k, String(v)); });
    return request('/delivery/orders' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  deliveryAccept: (id) => request(`/delivery/orders/${encodeURIComponent(id)}/accept`, { method:'POST' }),
  deliveryReject: (id) => request(`/delivery/orders/${encodeURIComponent(id)}/reject`, { method:'POST' }),
  deliveryStart: (id) => request(`/delivery/orders/${encodeURIComponent(id)}/start`, { method:'POST' }),
  deliveryComplete: (id, body) => {
    if (body instanceof FormData) return request(`/delivery/orders/${encodeURIComponent(id)}/complete`, { method:'POST', body });
    return request(`/delivery/orders/${encodeURIComponent(id)}/complete`, { method:'POST', body: JSON.stringify(body||{}) });
  },
  deliveryFail: (id, reason) => request(`/delivery/orders/${encodeURIComponent(id)}/fail`, { method:'POST', body: JSON.stringify({ reason }) }),
  deliveryLocation: (id, loc) => request(`/delivery/orders/${encodeURIComponent(id)}/location`, { method:'POST', body: JSON.stringify(loc||{}) }),
  deliveryStatusPatch: (id, status) => request(`/delivery/orders/${encodeURIComponent(id)}/status`, { method:'PATCH', body: JSON.stringify({ status }) }),
  deliveryOtpGenerate: (id) => request(`/delivery/orders/${encodeURIComponent(id)}/otp/generate`, { method:'POST' }),
  deliveryOtpConfirm: (id, code) => request(`/delivery/orders/${encodeURIComponent(id)}/otp/confirm`, { method:'POST', body: JSON.stringify({ code }) }),
  deliverySignature: (id, formData) => request(`/delivery/orders/${encodeURIComponent(id)}/signature`, { method:'POST', body: formData }),
  deliveryProfileGet: () => request('/delivery/me/profile'),
  deliveryProfileUpdate: (patch) => request('/delivery/me/profile', { method:'PATCH', body: JSON.stringify(patch||{}) }),
  deliveryHistory: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v != null && v !== '') qs.append(k, String(v)); });
    return request('/delivery/orders/history' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  // Inventory
  inventoryList: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params||{}).forEach(([k,v]) => { if (v != null && v !== '') qs.append(k, String(v)); });
    return request('/inventory' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  inventoryByProduct: (productId) => request(`/inventory/${encodeURIComponent(productId)}`),
  inventoryLowStock: () => request('/inventory/low-stock'),
  inventoryAdjust: (productId, payload) => request(`/inventory/${encodeURIComponent(productId)}/update`, { method:'POST', body: JSON.stringify(payload||{}) }),
  inventoryReserve: (orderId, items, warehouseId=null) => request('/inventory/reserve', { method:'POST', body: JSON.stringify({ order_id: orderId, items, warehouse_id: warehouseId }) }),
  inventoryRelease: (orderId) => request('/inventory/release', { method:'POST', body: JSON.stringify({ order_id: orderId }) }),
  // Reports
  reportInventoryMovement: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params||{}).forEach(([k,v]) => { if (v != null && v !== '') qs.append(k, String(v)); });
    return request('/reports/inventory-movement' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  reportTopSelling: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params||{}).forEach(([k,v]) => { if (v != null && v !== '') qs.append(k, String(v)); });
    return request('/reports/top-selling' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  reportStockValuation: () => request('/reports/stock-valuation'),
  // Add more methods as needed, all ready for audit/logging
};

export default api;
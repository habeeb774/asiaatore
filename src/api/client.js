// Determine API base: prefer Vite proxy in dev if VITE_API_URL points to the same origin (frontend port)
const DEV = import.meta?.env?.DEV;
const VITE_API_ENV = import.meta?.env?.VITE_API_URL;
// Default to VITE_API_URL (if provided) otherwise '/api'.
let API_BASE = VITE_API_ENV || '/api';
// In local development always prefer the Vite proxy to avoid CORS and accidental
// direct calls to production. Force API_BASE to '/api' when DEV is true.
if (DEV) {
  API_BASE = '/api';
  console.warn('[API] Development mode: forcing API_BASE to /api to use Vite proxy.');
}

async function request(path, options = {}) {
  const url = API_BASE + path;
  let res;
  // Inject auth token if exists
  let token = null;
  try { token = localStorage.getItem('my_store_token'); } catch {}
  const isFormData = (typeof FormData !== 'undefined') && options.body instanceof FormData;
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Dev helper: in dev, if no Authorization token, include admin dev headers for non-auth endpoints
  if (import.meta?.env?.DEV && !token && !path.startsWith('/auth')) {
    let devUser = null;
    try { const raw = localStorage.getItem('my_store_user'); if (raw) devUser = JSON.parse(raw); } catch {}
    if (devUser?.id && devUser?.role) {
      headers['x-user-id'] = headers['x-user-id'] || devUser.id;
      headers['x-user-role'] = headers['x-user-role'] || devUser.role;
    } else {
      headers['x-user-id'] = headers['x-user-id'] || 'dev-admin';
      headers['x-user-role'] = headers['x-user-role'] || 'admin';
    }
  }
  try {
    // include credentials when hitting auth endpoints so cookies are sent
    const needCreds = path.startsWith('/auth');
    res = await fetch(url, { headers, ...options, ...(needCreds ? { credentials: 'include' } : {}) });
  } catch (e) {
    throw new Error('Network error: ' + e.message);
  }
  // Auto refresh on 401 once
  if (res.status === 401 && !options._retry) {
    try {
      // Use cookie-based refresh; include credentials
      const r = await fetch(API_BASE + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (r.ok) {
        const body = await r.json();
        if (body?.accessToken) {
          try { localStorage.setItem('my_store_token', body.accessToken) } catch {}
          const retryHeaders = { ...headers, Authorization: `Bearer ${body.accessToken}` };
          const retryRes = await fetch(url, { headers: retryHeaders, ...options, _retry: true });
          if (!retryRes.ok) {
            let errText = ''; try { errText = await retryRes.text(); } catch {}
            throw new Error(`API Error ${retryRes.status} after refresh: ${retryRes.statusText} ${errText.slice(0,200)}`);
          }
          return retryRes.json();
        }
      }
    } catch {}
  }
  if (!res.ok) {
    let bodyText = '';
    let parsed;
    try { bodyText = await res.text(); } catch {}
    if (bodyText) {
      try { parsed = JSON.parse(bodyText); } catch {}
    }
    const method = (options.method || 'GET').toUpperCase();
    const baseMsg = `API Error ${res.status} ${res.statusText}`;
    const details = parsed?.error ? ` code=${parsed.error}` : '';
    const tail = bodyText && !parsed ? (' - ' + bodyText.slice(0,240)) : '';
    const msg = `${baseMsg}${details} (${method} ${path})${tail}`;
    if (import.meta.env.DEV) console.error('[API]', msg);
    // Return structured error payload to callers that expect JSON, else throw
    if (parsed && typeof parsed === 'object') {
      // Keep status and code for the UI to classify
      return Promise.reject(Object.assign(new Error(msg), { code: parsed.error, data: parsed, status: res.status }));
    }
    throw new Error(msg);
  }
  return res.json();
}

export const api = {
  request,
  listProducts: () => request('/products'),
  listOffers: () => request('/products/offers'),
  catalogSummary: () => request('/products/catalog/summary'),
  getProduct: id => request(`/products/${id}`),
  searchProducts: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    return request('/products' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  batchDiscount: (payload) => request('/products/batch/discount', { method: 'POST', body: JSON.stringify(payload||{}) }),
  batchClearDiscount: (productIds) => request('/products/batch/clear-discount', { method: 'POST', body: JSON.stringify({ productIds }) }),
  createProductForm: (formData) => request('/products', { method: 'POST', body: formData }),
  updateProductForm: (id, formData) => request(`/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  // Categories
  listCategories: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request('/categories' + suffix);
  },
  getCategoryBySlug: (slug) => request(`/categories/slug/${slug}`),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  createCategoryForm: (formData) => request('/categories', { method: 'POST', body: formData }),
  updateCategoryForm: (id, formData) => request(`/categories/${id}`, { method: 'PUT', body: formData }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  // Orders
  listOrders: (userId) => request('/orders' + (userId ? `?userId=${encodeURIComponent(userId)}` : '')),
  // Admin/advanced orders listing with filters (status, paymentMethod, from, to, page, pageSize)
  listOrdersAdmin: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request('/orders' + suffix);
  },
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id, patch) => request(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  // (Future) validate coupon server-side
  validateCoupon: (code) => request(`/coupons/validate?code=${encodeURIComponent(code)}`),
  getInvoiceHtml: (id) => request(`/orders/${id}/invoice`),
  listStores: () => request('/stores'),
  authLogin: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), credentials: 'include' })
  ,authRegister: (email, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }), credentials: 'include' })
  ,authForgot: (email) => request('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) })
  ,authResetWithToken: (email, token, newPassword) => request('/auth/reset', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) })
  ,authRefresh: () => request('/auth/refresh', { method: 'POST', credentials: 'include' })
  ,authLogout: () => request('/auth/logout', { method: 'POST', credentials: 'include' })
  ,authVerifyEmailRequest: () => request('/auth/verify-email/request', { method: 'POST' })
  ,authVerifyEmailConfirm: (token, email) => request(`/auth/verify-email?token=${encodeURIComponent(token||'')}&email=${encodeURIComponent(email||'')}`)
  ,authVerifyPhoneRequest: () => request('/auth/verify-phone/request', { method: 'POST' })
  ,authVerifyPhoneConfirm: (code) => request('/auth/verify-phone/confirm', { method: 'POST', body: JSON.stringify({ code }) })
  ,me: () => request('/auth/me')
  ,meUpdate: (patch) => request('/auth/me', { method:'PATCH', body: JSON.stringify(patch||{}) })
  ,searchTypeahead: (q) => request(`/search/typeahead?q=${encodeURIComponent(q||'')}`)
  // Wishlist
  ,wishlistList: () => request('/wishlist')
  ,wishlistAdd: (productId) => request('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) })
  ,wishlistRemove: (productId) => request(`/wishlist/${productId}`, { method: 'DELETE' })
  // Cart (server persistence)
  ,cartList: () => request('/cart')
  ,cartMerge: (items) => request('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) })
  ,cartSet: (productId, quantity) => request('/cart/set', { method: 'POST', body: JSON.stringify({ productId, quantity }) })
  ,cartClear: () => request('/cart', { method: 'DELETE' })
  ,cartRemoveItem: (productId) => request(`/cart/item/${productId}`, { method: 'DELETE' })
  // Reviews
  ,reviewsListForProduct: (productId) => request(`/reviews/product/${productId}`)
  ,reviewCreate: (productId, data) => request('/reviews', { method: 'POST', body: JSON.stringify({ productId, ...data }) })
  ,reviewsModerationList: () => request('/reviews/moderation')
  ,reviewModerate: (id, action) => request(`/reviews/${id}/moderate`, { method: 'POST', body: JSON.stringify({ action }) })
  // Brands
  ,brandsList: () => request('/brands')
  ,brandGetBySlug: (slug) => request(`/brands/slug/${slug}`)
  ,brandCreate: (data) => request('/brands', { method:'POST', body: JSON.stringify(data) })
  ,brandUpdate: (id, data) => request(`/brands/${id}`, { method:'PUT', body: JSON.stringify(data) })
  ,brandDelete: (id) => request(`/brands/${id}`, { method:'DELETE' })
  // Tier Prices
  ,tierList: (productId) => request(`/tier-prices/products/${productId}/tier-prices`)
  ,tierCreate: (productId, data) => request(`/tier-prices/products/${productId}/tier-prices`, { method:'POST', body: JSON.stringify(data) })
  ,tierUpdate: (id, data) => request(`/tier-prices/tier-prices/${id}`, { method:'PATCH', body: JSON.stringify(data) })
  ,tierDelete: (id) => request(`/tier-prices/tier-prices/${id}`, { method:'DELETE' })
  // Marketing
  ,marketingFeatures: () => request('/marketing/features')
  ,marketingFeatureCreate: (data) => request('/marketing/features', { method:'POST', body: JSON.stringify(data) })
  ,marketingFeatureUpdate: (id,data) => request(`/marketing/features/${id}`, { method:'PATCH', body: JSON.stringify(data) })
  ,marketingFeatureDelete: (id) => request(`/marketing/features/${id}`, { method:'DELETE' })
  ,marketingBanners: () => request('/marketing/banners')
  ,marketingBannerCreate: (data) => request('/marketing/banners', { method:'POST', body: JSON.stringify(data) })
  ,marketingBannerUpdate: (id,data) => request(`/marketing/banners/${id}`, { method:'PATCH', body: JSON.stringify(data) })
  ,marketingBannerDelete: (id) => request(`/marketing/banners/${id}`, { method:'DELETE' })
  ,marketingAppLinks: () => request('/marketing/app-links')
  ,marketingAppLinkCreate: (data) => request('/marketing/app-links', { method:'POST', body: JSON.stringify(data) })
  ,marketingAppLinkUpdate: (id,data) => request(`/marketing/app-links/${id}`, { method:'PATCH', body: JSON.stringify(data) })
  ,marketingAppLinkDelete: (id) => request(`/marketing/app-links/${id}`, { method:'DELETE' })
  // Tracking
  ,marketingTrackClick: (type,id) => request('/marketing/track', { method:'POST', body: JSON.stringify({ type, id }) })
  // Marketing Metrics
  ,marketingMetrics: (days=30) => request(`/marketing/metrics?days=${days}`)
  // Shipping quote
  ,shippingQuote: (address) => request('/shipping/quote', { method: 'POST', body: JSON.stringify(address||{}) })
  // Settings
  ,settingsGet: () => request('/settings')
  ,settingsUpdate: (patch) => request('/settings', { method:'PATCH', body: JSON.stringify(patch||{}) })
  ,settingsUploadLogo: (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    return request('/settings/logo', { method:'POST', body: fd });
  },
  // Admin Stats
  adminStatsOverview: () => request('/admin/stats/overview'),
  adminStatsFinancials: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request('/admin/stats/financials' + suffix);
  },
  adminStatsFinancialsCsv: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request('/admin/stats/financials/export/csv' + suffix);
  },
  // Admin Users
  adminUsersList: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const tail = qs.toString() ? `?${qs.toString()}` : '';
    return request('/admin/users' + tail);
  },
  adminUserCreate: (data) => request('/admin/users', { method:'POST', body: JSON.stringify(data||{}) }),
  adminUserUpdate: (id, patch) => request(`/admin/users/${id}`, { method:'PATCH', body: JSON.stringify(patch||{}) }),
  adminUserDelete: (id) => request(`/admin/users/${id}`, { method:'DELETE' }),
  adminUserActivate: (id) => request(`/admin/users/${id}/activate`, { method:'POST' }),
  adminUserDeactivate: (id) => request(`/admin/users/${id}/deactivate`, { method:'POST' }),
  // Bank transfer review
  bankConfirm: (orderId, reference) => request('/pay/bank/confirm', { method:'POST', body: JSON.stringify({ orderId, reference }) }),
  bankReject: (orderId, reason) => request('/pay/bank/reject', { method:'POST', body: JSON.stringify({ orderId, reason }) }),
  bankPendingList: (params = {}) => {
    const qs = new URLSearchParams({ status: 'pending_bank_review', paymentMethod: 'bank' });
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    return request('/orders?' + qs.toString());
  },
  // Chat
  chatEnsureThread: (sellerId, ctx = {}) => request('/chat/threads', { method:'POST', body: JSON.stringify({ sellerId, ...ctx }) }),
  chatListThreads: (as='buyer', params={}) => {
    const qs = new URLSearchParams({ as });
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    return request('/chat/threads?' + qs.toString());
  },
  chatGetMessages: (threadId) => request(`/chat/threads/${threadId}/messages`),
  chatSendMessage: (threadId, content) => request(`/chat/threads/${threadId}/messages`, { method:'POST', body: JSON.stringify({ content }) })
  // Seller product management
  ,sellerProductsList: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request('/sellers/products' + suffix);
  }
  ,sellerProductCreate: (data) => request('/sellers/products', { method:'POST', body: JSON.stringify(data||{}) })
  ,sellerProductUpdate: (id, patch) => request(`/sellers/products/${id}`, { method:'PATCH', body: JSON.stringify(patch||{}) })
  ,sellerProductDelete: (id) => request(`/sellers/products/${id}`, { method:'DELETE' })
  ,sellerProductAddImages: (id, images=[]) => request(`/sellers/products/${id}/images`, { method:'POST', body: JSON.stringify({ images }) })
  ,sellerProductUploadImage: (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return request(`/sellers/products/${id}/upload-image`, { method: 'POST', body: fd });
  }
  // Delivery (drivers)
  ,deliveryList: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs}` : '';
    return request('/delivery/orders' + suffix);
  }
  ,deliveryAssigned: () => request('/delivery/orders/assigned')
  ,deliveryHistory: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs}` : '';
    return request('/delivery/orders/history' + suffix);
  }
  ,deliveryGet: (id) => request(`/delivery/orders/${id}`)
  ,deliveryAccept: (id) => request(`/delivery/orders/${id}/accept`, { method:'POST' })
  ,deliveryReject: (id) => request(`/delivery/orders/${id}/reject`, { method:'POST' })
  ,deliveryStart: (id) => request(`/delivery/orders/${id}/start`, { method:'POST' })
  ,deliveryComplete: (id, payload={}) => {
    // Support both JSON and FormData (for proof upload)
    try {
      if (typeof FormData !== 'undefined' && payload instanceof FormData) {
        return request(`/delivery/orders/${id}/complete`, { method:'POST', body: payload });
      }
    } catch {}
    return request(`/delivery/orders/${id}/complete`, { method:'POST', body: JSON.stringify(payload || {}) });
  }
  ,deliveryFail: (id, reason) => request(`/delivery/orders/${id}/fail`, { method:'POST', body: JSON.stringify({ reason }) })
  ,deliveryOtpGenerate: (id) => request(`/delivery/orders/${id}/otp/generate`, { method:'POST' })
  ,deliveryOtpConfirm: (id, code) => request(`/delivery/orders/${id}/otp/confirm`, { method:'POST', body: JSON.stringify({ code }) })
  ,deliverySignature: (id, file) => {
    const fd = new FormData();
    fd.append('signature', file);
    return request(`/delivery/orders/${id}/signature`, { method:'POST', body: fd });
  }
  ,deliveryLocation: (id, loc) => request(`/delivery/orders/${id}/location`, { method:'POST', body: JSON.stringify(loc || {}) })
  // Delivery profile & presence
  ,deliveryProfileGet: () => request('/delivery/me/profile')
  ,deliveryProfileUpdate: (patch) => request('/delivery/me/profile', { method:'PATCH', body: JSON.stringify(patch||{}) })
  ,deliveryDriversOnline: () => request('/delivery/drivers/online')
  // Addresses
  ,addressesList: () => request('/addresses')
  ,addressCreate: (data) => request('/addresses', { method: 'POST', body: JSON.stringify(data||{}) })
  ,addressUpdate: (id, patch) => request(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(patch||{}) })
  ,addressDelete: (id) => request(`/addresses/${id}`, { method: 'DELETE' })
  // Seller KYC
  ,sellerProfileGet: () => request('/sellers/profile')
  ,sellerProfileSubmit: (payload) => request('/sellers/profile', { method:'POST', body: JSON.stringify(payload||{}) })
  // Admin KYC review
  ,adminSellersList: (params={}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request('/admin/sellers' + suffix);
  }
  ,adminSellerApprove: (id) => request(`/admin/sellers/${id}/approve`, { method:'POST' })
  ,adminSellerReject: (id, reason) => request(`/admin/sellers/${id}/reject`, { method:'POST', body: JSON.stringify({ reason }) })
};

export default api;

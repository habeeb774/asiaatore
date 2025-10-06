const API_BASE = import.meta?.env?.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const url = API_BASE + path;
  let res;
  // Inject auth token if exists
  let token = null;
  try { token = localStorage.getItem('my_store_token'); } catch {}
  const isFormData = (typeof FormData !== 'undefined') && options.body instanceof FormData;
  const headers = { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Dev fallback: if no token, send admin role via legacy headers to satisfy requireAdmin in dev only
  if (!token && import.meta?.env?.DEV) {
    headers['x-user-id'] = headers['x-user-id'] || 'dev-admin';
    headers['x-user-role'] = headers['x-user-role'] || 'admin';
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
  ,tierList: (productId) => request(`/products/${productId}/tier-prices`)
  ,tierCreate: (productId, data) => request(`/products/${productId}/tier-prices`, { method:'POST', body: JSON.stringify(data) })
  ,tierUpdate: (id, data) => request(`/tier-prices/${id}`, { method:'PATCH', body: JSON.stringify(data) })
  ,tierDelete: (id) => request(`/tier-prices/${id}`, { method:'DELETE' })
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
  // Admin Users
  adminUsersList: () => request('/admin/users'),
  adminUserUpdate: (id, patch) => request(`/admin/users/${id}`, { method:'PATCH', body: JSON.stringify(patch||{}) }),
  adminUserDelete: (id) => request(`/admin/users/${id}`, { method:'DELETE' }),
  // Bank transfer review
  bankConfirm: (orderId, reference) => request('/pay/bank/confirm', { method:'POST', body: JSON.stringify({ orderId, reference }) }),
  bankReject: (orderId, reason) => request('/pay/bank/reject', { method:'POST', body: JSON.stringify({ orderId, reason }) }),
  bankPendingList: (params = {}) => {
    const qs = new URLSearchParams({ status: 'pending_bank_review', paymentMethod: 'bank' });
    Object.entries(params).forEach(([k,v]) => { if (v!==undefined && v!==null && v!=='') qs.append(k, v); });
    return request('/orders?' + qs.toString());
  }
};

export default api;

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './config';

let CURRENT_BASE = API_BASE; // mutable working base

async function fetchWithTimeout(url: string, init: RequestInit & { signal?: AbortSignal | null } = {}, ms = 3500) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: init.signal || ac.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

function candidatesFor(base: string): string[] {
  try {
    const u = new URL(base);
    const host = u.hostname;
    const isEmu = host === '10.0.2.2';
    const ports = [u.port || '80', '4005', '4004', '4003'];
    const uniq = new Set<string>();
    for (const p of ports) {
      if (isEmu) uniq.add(`${u.protocol}//10.0.2.2:${p}${u.pathname}`);
      else uniq.add(`${u.protocol}//${host}:${p}${u.pathname}`);
    }
    return Array.from(uniq.values());
  } catch {
    return [base];
  }
}

async function getToken(): Promise<string | null> {
  try { return await AsyncStorage.getItem('my_store_token'); } catch { return null; }
}

export async function request(path: string, options: RequestInit = {}) {
  let url = CURRENT_BASE + path;
  const token = await getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as any || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Dev helper: allow local dev headers if no token
  if (!token && !path.startsWith('/auth')) {
    headers['x-user-id'] = headers['x-user-id'] || 'dev-admin';
    headers['x-user-role'] = headers['x-user-role'] || 'admin';
  }
  let res: Response;
  // Try current base then fallbacks on network errors
  try {
    res = await fetchWithTimeout(url, { ...(options as any), headers }, 3000);
  } catch (e: any) {
    const cands = candidatesFor(CURRENT_BASE);
    let lastErr: any = e;
    let found: Response | null = null;
    for (const b of cands) {
      if (b === CURRENT_BASE) continue;
      try {
        const tryUrl = b + path;
        const r = await fetchWithTimeout(tryUrl, { ...(options as any), headers }, 2500);
        // If we got any HTTP response, adopt this base (even if error; upper layer will handle)
        if (r) { CURRENT_BASE = b; url = tryUrl; found = r; break; }
      } catch (ee: any) { lastErr = ee; }
    }
    if (found) res = found; else throw new Error('Network error: ' + (lastErr?.message || 'failed'));
  }
  if (!res.ok) {
    let text = '';
    let parsed: any;
    try { text = await res.text(); } catch {}
    if (text) { try { parsed = JSON.parse(text); } catch {} }
    const method = (options.method || 'GET').toUpperCase();
    const base = `API Error ${res.status} ${res.statusText}`;
    const details = parsed?.error ? ` code=${parsed.error}` : '';
    const msg = `${base}${details} (${method} ${path})`;
    const err: any = new Error(msg);
    if (parsed && typeof parsed === 'object') { err.code = parsed.error; err.data = parsed; }
    throw err;
  }
  return res.json();
}

export const api = {
  // Products
  listProducts: () => request('/products'),
  getProduct: (id: string) => request(`/products/${id}`),
  listOffers: () => request('/products/offers'),
  // Brands/Categories (subset)
  listBrands: () => request('/brands'),
  brandBySlug: (slug: string) => request(`/brands/slug/${slug}`),
  listCategories: () => request('/categories'),
  // Orders
  listOrders: () => request('/orders'),
  // Auth
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  // Cart
  cartList: () => request('/cart'),
  cartMerge: (items: Array<{ productId: string; quantity: number }>) => request('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) }),
  cartSet: (productId: string, quantity: number) => request('/cart/set', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  cartClear: () => request('/cart', { method: 'DELETE' })
};

export default api;

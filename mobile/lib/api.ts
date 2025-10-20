let AsyncStorage: any | null = null;

export type DeliveryOrder = {
  id: string;
  status?: string | null;
  deliveryStatus: string;
  grandTotal?: number | null;
  userId?: string | null;
  deliveryDriverId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  deliveryDurationSec?: number | null;
};

type DeliveryOrdersResponse = { ok?: boolean; orders?: DeliveryOrder[] };
type DeliveryOrderResponse = { ok?: boolean; order?: DeliveryOrder };

const DEFAULT_BASES = [
  'http://10.0.2.2:4000/api', // Android emulator -> host machine
  'http://localhost:4000/api', // iOS simulator / local dev
  'https://my-store-backend-production.up.railway.app/api', // prod fallback
];

// Resolve initial base from common runtime places, otherwise use first default
let CURRENT_BASE: string = ((): string => {
	// global override (e.g. set on window/globalThis)
	if (typeof (globalThis as any).API_BASE === 'string') return (globalThis as any).API_BASE;
	// node env (runtime-safe access to avoid TS requiring @types/node)
	if ((globalThis as any).process?.env?.API_BASE) return (globalThis as any).process.env.API_BASE;
	return DEFAULT_BASES[0];
})();

// Allow runtime override from app code
export function setApiBase(base: string) {
	CURRENT_BASE = base;
}

// Provide candidate base list for fallback attempts
function candidatesFor(base: string) {
	const seen = new Set<string>();
	const list: string[] = [];
	// prefer the current base first, then known defaults
	[base, ...DEFAULT_BASES].forEach(b => {
		if (!seen.has(b)) { seen.add(b); list.push(b); }
	});
	return list;
}

// Minimal fetch with timeout using AbortController (no dependency)
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeout = 3000): Promise<Response> {
	// If AbortController not available, just call fetch (some RN environments polyfill it)
	const AC = (globalThis as any).AbortController;
	if (!AC) return fetch(url, opts);
	const controller = new AC();
	const timer = setTimeout(() => controller.abort(), timeout);
	try {
		const res = await fetch(url, { ...opts, signal: controller.signal } as any);
		return res;
	} finally {
		clearTimeout(timer);
	}
}

async function ensureAsyncStorage() {
	// already resolved
	if (AsyncStorage) return;
	try {
		// dynamic import so TS/node won't require the package at build time
		// @ts-ignore - allow dynamic import even if TS project module flag is stricter
		const mod = await import('@react-native-async-storage/async-storage');
		AsyncStorage = mod.default || mod;
	} catch {
		// fallback: prefer browser localStorage if available, otherwise use an in-memory shim
		if (typeof localStorage !== 'undefined') {
			AsyncStorage = {
				getItem: async (k: string) => Promise.resolve(localStorage.getItem(k)),
				setItem: async (k: string, v: string) => Promise.resolve(localStorage.setItem(k, v)),
				removeItem: async (k: string) => Promise.resolve(localStorage.removeItem(k)),
			};
		} else {
			const mem: Record<string, string> = {};
			AsyncStorage = {
				getItem: async (k: string) => Promise.resolve(mem[k] ?? null),
				setItem: async (k: string, v: string) => { mem[k] = v; return Promise.resolve(); },
				removeItem: async (k: string) => { delete mem[k]; return Promise.resolve(); },
			};
		}
	}
}

async function getToken(): Promise<string | null> {
	try {
		await ensureAsyncStorage();
		return await AsyncStorage.getItem('my_store_token');
	} catch {
		return null;
	}
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
  me: () => request('/auth/me'),
  // Auth
  login: (email: string, password: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  // Cart
  cartList: () => request('/cart'),
  cartMerge: (items: Array<{ productId: string; quantity: number }>) => request('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) }),
  cartSet: (productId: string, quantity: number) => request('/cart/set', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  cartClear: () => request('/cart', { method: 'DELETE' }),
  // Delivery
  deliveryAssigned: async (): Promise<DeliveryOrder[]> => {
    const data = await request('/delivery/orders/assigned') as DeliveryOrdersResponse;
    return Array.isArray(data?.orders) ? data.orders : [];
  },
  deliveryPool: async (): Promise<DeliveryOrder[]> => {
    const data = await request('/delivery/orders?pool=1') as DeliveryOrdersResponse;
    return Array.isArray(data?.orders) ? data.orders : [];
  },
  deliveryHistory: async (limit = 100): Promise<DeliveryOrder[]> => {
    const data = await request(`/delivery/orders/history?limit=${encodeURIComponent(String(limit))}`) as DeliveryOrdersResponse;
    return Array.isArray(data?.orders) ? data.orders : [];
  },
  deliveryGet: async (id: string): Promise<DeliveryOrder | null> => {
    const data = await request(`/delivery/orders/${id}`) as DeliveryOrderResponse;
    return data?.order || null;
  },
  deliveryAccept: (id: string) => request(`/delivery/orders/${id}/accept`, { method: 'POST' }),
  deliveryReject: (id: string) => request(`/delivery/orders/${id}/reject`, { method: 'POST' }),
  deliveryStart: (id: string) => request(`/delivery/orders/${id}/start`, { method: 'POST' }),
  deliveryComplete: async (id: string, payload: { note?: string; proofUri?: string | null }) => {
    const form = new FormData();
    if (payload?.note) form.append('note', payload.note);
    if (payload?.proofUri) {
      const uri = payload.proofUri;
      const name = uri.split('/').pop() || `proof-${Date.now()}.jpg`;
      const ext = name.split('.').pop()?.toLowerCase();
      const type = ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/jpeg';
      form.append('proof', { uri, name, type } as any);
    }
    return request(`/delivery/orders/${id}/complete`, { method: 'POST', body: form });
  },
  deliveryFail: (id: string, reason: string) => request(`/delivery/orders/${id}/fail`, { method: 'POST', body: JSON.stringify({ reason }) }),
  deliveryLocation: (id: string, coords: { lat?: number; lng?: number; accuracy?: number | null; heading?: number | null; speed?: number | null }) => request(`/delivery/orders/${id}/location`, { method: 'POST', body: JSON.stringify(coords) }),
  deliveryStatusPatch: (id: string, status: string) => request(`/delivery/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deliveryOtpGenerate: (id: string) => request(`/delivery/orders/${id}/otp/generate`, { method: 'POST' }),
  deliveryOtpConfirm: (id: string, code: string) => request(`/delivery/orders/${id}/otp/confirm`, { method: 'POST', body: JSON.stringify({ code }) }),
};

export default api;

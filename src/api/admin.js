// Lightweight admin API client with token injection.

async function req(path, options = {}) {
  // Lazy inline version (no duplication of existing client.js patterns too much)
  const API_BASE = import.meta?.env?.VITE_API_URL || '/api';
  let token = null; try { token = localStorage.getItem('my_store_token'); } catch {}
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  let body = null;
  try { body = await res.json(); } catch { /* ignore parse */ }
  if (!res.ok) {
    const err = new Error(body?.error || res.statusText || 'REQUEST_FAILED');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const adminApi = {
  // Users
  listUsers: () => req('/admin/users'),
  updateUser: (id, data) => req('/admin/users/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => req('/admin/users/' + id, { method: 'DELETE' }),
  // Audit logs with optional filters
  listAudit: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
    return req('/admin/audit' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  // Orders (paginated)
  listOrders: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
    return req('/orders' + (qs.toString() ? `?${qs.toString()}` : ''));
  },
  // Stats overview
  statsOverview: () => req('/admin/stats/overview'),
  // Order exports
  exportOrdersCsv: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
    // Return full Response text (CSV) - bypass json parser (use fetch directly)
    const API_BASE = import.meta?.env?.VITE_API_URL || '/api';
    let token = null; try { token = localStorage.getItem('my_store_token'); } catch {}
    const headers = {}; if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(API_BASE + '/admin/stats/orders/export/csv' + (qs.toString() ? `?${qs.toString()}` : ''), { headers }).then(r => r.text());
  },
  exportOrdersXlsx: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== null && v !== '') qs.append(k, v); });
    const API_BASE = import.meta?.env?.VITE_API_URL || '/api';
    let token = null; try { token = localStorage.getItem('my_store_token'); } catch {}
    const headers = {}; if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(API_BASE + '/admin/stats/orders/export/xlsx' + (qs.toString() ? `?${qs.toString()}` : ''), { headers }).then(r => r.blob());
  },
  // Stats panel - we reuse existing /api/admin/panel (light) and infer counts client-side when needed
  panel: () => req('/admin/panel')
};

export default adminApi;

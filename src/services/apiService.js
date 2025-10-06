export const API_BASE = '/api';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.message || 'API request failed');
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export const apiGet = (path) => request(path, { method: 'GET' });
export const apiPost = (path, body) => request(path, { method: 'POST', body });
export const apiPut = (path, body) => request(path, { method: 'PUT', body });
export const apiDelete = (path) => request(path, { method: 'DELETE' });

// Multipart (FormData) request helper (no JSON stringification)
export async function apiPostMultipart(path, formData) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  // Attach auth token if available (was missing => caused FORBIDDEN and generic 'Upload failed')
  let token = null;
  try { token = localStorage.getItem('my_store_token'); } catch { token = null; }
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined; // don't set Content-Type
  let res;
  try {
    res = await fetch(url, { method: 'POST', body: formData, headers });
  } catch (e) {
    const netErr = new Error('Network upload error: ' + e.message);
    netErr.status = 0;
    throw netErr;
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const serverMsg = data?.message || data?.error || 'Upload failed';
    const err = new Error(serverMsg + (data?.error ? ` [${data.error}]` : ''));
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

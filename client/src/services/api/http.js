const API_BASE = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL) || '/api';

const toQuery = (params = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) =>
      Array.isArray(v)
        ? v.map((x) => `${encodeURIComponent(k)}=${encodeURIComponent(x)}`).join('&')
        : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join('&');

export async function get(path, params, { signal } = {}) {
  const qs = params ? `?${toQuery(params)}` : '';
  const res = await fetch(`${API_BASE}${path}${qs}`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return res.json();
}

export async function post(path, data, { signal, json = true } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Accept': 'application/json', ...(json ? { 'Content-Type': 'application/json' } : {}) },
    body: json ? JSON.stringify(data) : data,
    signal,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return res.json();
}

export async function patch(path, data, { signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return res.json();
}

export async function del(path, { signal } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.message || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = errBody;
    throw err;
  }
  return res.json();
}

import { API_BASE } from './apiService';

/**
 * Open invoice PDF for a specific order in a new tab.
 * Tries a direct window.open first; if blocked or fails, fetches the PDF and opens a Blob URL.
 * @param {string|number} orderId
 * @param {{ format?: 'a4'|'pos'|'thermal', query?: Record<string,string|number|boolean> }} [options]
 */
export async function openInvoicePdfByOrder(orderId, options = {}) {
  if (!orderId) throw new Error('orderId is required');
  const { format, query = {} } = options;

  // Build URL with optional format and custom query params
  const params = new URLSearchParams();
  if (format) params.set('format', String(format));
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  const qs = params.toString();
  const href = `${API_BASE}/orders/${encodeURIComponent(orderId)}/invoice${qs ? `?${qs}` : ''}`;

  // First try: open directly (lets the backend stream PDF). This avoids memory usage of blob.
  try {
    const win = window.open(href, '_blank', 'noopener');
    if (win) {
      // Some browsers block until user gesture; if it opened, we assume success.
      return;
    }
  } catch {}

  // Fallback: fetch the PDF and open as Blob URL (handles cases where headers like Authorization are needed)
  let token = null;
  try { token = localStorage.getItem('my_store_token'); } catch { token = null; }
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  let res;
  try {
    res = await fetch(href, { method: 'GET', headers });
  } catch (e) {
    throw new Error('Network error while fetching invoice: ' + e.message);
  }
  if (!res.ok) {
    // Try to parse JSON error if present
    let msg = `Failed to fetch invoice (HTTP ${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data?.message) msg = data.message;
        } catch {}
      }
    } catch {}
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  try {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank', 'noopener');
    if (!win) {
      // If still blocked, try to trigger download via temporary link
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    // Revoke later to allow the tab to load
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  } catch (e) {
    throw new Error('Unable to open invoice: ' + (e?.message || 'unknown error'));
  }
}

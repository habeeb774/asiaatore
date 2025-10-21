// Simple GA4 + Google Ads helper for SPA
// Reads IDs from env: VITE_GA_ID, VITE_GADS_ID (optional), VITE_GADS_CONVERSION_LABEL (optional)

let inited = false;

export function initAnalytics() {
  if (inited) return;
  const GA_ID = import.meta?.env?.VITE_GA_ID;
  if (!GA_ID) return; // no-op if not configured
  try {
    // dataLayer for gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: false }); // we'll track manually on route changes
    // Inject gtag script once
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(s);
    inited = true;
  } catch {}
}

export function trackPageView(path, title) {
  const GA_ID = import.meta?.env?.VITE_GA_ID;
  if (!GA_ID || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'page_view', {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href
    });
  } catch {}
}

export function trackEvent(name, params = {}) {
  const GA_ID = import.meta?.env?.VITE_GA_ID;
  if (!GA_ID || typeof window.gtag !== 'function') return;
  try { window.gtag('event', name, params || {}); } catch {}
}

// Optional Google Ads conversion
export function trackConversion({ sendTo, value, currency, eventLabel } = {}) {
  const GADS_ID = import.meta?.env?.VITE_GADS_ID;
  const LABEL = import.meta?.env?.VITE_GADS_CONVERSION_LABEL;
  if (!GADS_ID || typeof window.gtag !== 'function') return;
  const target = sendTo || `${GADS_ID}/${LABEL || ''}`.replace(/\/$/, '');
  try {
    window.gtag('event', 'conversion', {
      send_to: target,
      value: value || 0,
      currency: currency || 'SAR',
      event_label: eventLabel || undefined
    });
  } catch {}
}

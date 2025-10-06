import { useEffect, useRef } from 'react';

/**
 * Safe loader for Tawk.to chat widget.
 * Blocks loading by default on localhost unless VITE_ENABLE_TAWK='1'.
 * Setup:
 *   - Put your propertyId and widgetId below.
 *   - Create .env: VITE_TAWK_PROPERTY=xxxx  VITE_TAWK_WIDGET=yyyy
 *   - Optional enable in dev: VITE_ENABLE_TAWK=1
 */
const PROPERTY_ID = import.meta.env.VITE_TAWK_PROPERTY || ''; // e.g. '64f0....'
const WIDGET_ID   = import.meta.env.VITE_TAWK_WIDGET   || ''; // e.g. '1habc...'

export default function TawkProvider({
  enableInDev = import.meta.env.VITE_ENABLE_TAWK === '1',
  defer = true
}) {
  const loadedRef = useRef(false);

  useEffect(() => {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!PROPERTY_ID || !WIDGET_ID) {
      console.info('[TawkProvider] Missing ids, chat disabled.');
      document.documentElement.setAttribute('data-chat-disabled', 'true');
      return;
    }
    if (isLocal && !enableInDev) {
      console.info('[TawkProvider] Skipped loading (dev mode).');
      document.documentElement.setAttribute('data-chat-disabled', 'true');
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    script.async = true;
    if (defer) script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      console.warn('[TawkProvider] Script load error (network / 400). Widget suppressed.');
      document.documentElement.setAttribute('data-chat-disabled', 'true');
      cleanup();
    };

    const timeout = setTimeout(() => {
      if (!window.Tawk_API || !window.Tawk_API.onLoaded) {
        console.warn('[TawkProvider] Timed out waiting for Tawk; disabling.');
        document.documentElement.setAttribute('data-chat-disabled', 'true');
        cleanup();
      }
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      // Remove dangling script if failed
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    document.head.appendChild(script);
    return () => {
      clearTimeout(timeout);
    };
  }, [enableInDev, defer]);

  return null;
}

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.settingsGet();
        if (!mounted) return;
        let s = res.setting || null;
        // Normalize possible older values that stored uploads with an /api prefix
        if (s && s.logo && typeof s.logo === 'string') {
          // If someone stored '/api/uploads/..' convert to '/uploads/..' so the client uses the backend static path
          if (s.logo.startsWith('/api/uploads')) s.logo = s.logo.replace(/^\/api/, '');
        }
        // إذا كان logo مساراً نسبياً، أنشئ logoUrl مطلق
        if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/')) {
          // Prefer explicit VITE_API_URL when set (developer override)
          const viteApi = import.meta.env && import.meta.env.VITE_API_URL;
          let base = window.location.origin;
          if (viteApi && typeof viteApi === 'string' && viteApi.trim()) {
            // Ensure no trailing slash
            const normalized = viteApi.replace(/\/$/, '');
            s.logoUrl = normalized + s.logo;
          } else {
            // Fast initial fallback: use current origin so UI shows something immediately
            s.logoUrl = base + s.logo;
            // If we're running under Vite dev server, attempt async non-blocking discovery of backend
            if (base.includes(':517')) {
              (async () => {
                const ports = [4000, 4001, 3000, 3001];
                for (let port of ports) {
                  const candidate = base.replace(/:\d+$/, ':' + port) + s.logo;
                  try {
                    // Use fetch HEAD to check availability (async, won't block rendering)
                    const resp = await fetch(candidate, { method: 'HEAD' });
                    if (resp && resp.ok) {
                      if (!mounted) return;
                      // update setting object copy so React notices change
                      setSetting(prev => prev ? { ...prev, logoUrl: candidate } : { ...s, logoUrl: candidate });
                      return;
                    }
                  } catch (_) { /* ignore and try next port */ }
                }
                // nothing found — keep origin-based logoUrl
              })();
            }
          }
        }
        setSetting(s);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!setting) return;
    // طباعة قيمة الشعار والرابط النهائي
    console.log('[SettingsContext] logo:', setting.logo, 'logoUrl:', setting.logoUrl);
    const root = document.documentElement;
    const setLink = (rel, href) => {
      try {
        if (!href) return;
        let el = document.head.querySelector(`link[rel="${rel}"]`);
        if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
        el.setAttribute('href', href);
      } catch {}
    };
    // Update favicons to use the uploaded logo
    if (setting.logo) {
      setLink('icon', setting.logo);
      setLink('shortcut icon', setting.logo);
      setLink('apple-touch-icon', setting.logo);
    }
    const apply = (name, val) => {
      if (!val) return;
      if (name === 'colorPrimary') {
        root.style.setProperty('--color-primary', val);
        const rgb = hexToRgb(val);
        if (rgb) root.style.setProperty('--color-primary-rgb', rgb);
      }
      if (name === 'colorSecondary') {
        root.style.setProperty('--color-primary-alt', val);
        root.style.setProperty('--color-secondary', val);
      }
      if (name === 'colorAccent') {
        root.style.setProperty('--color-accent', val);
        const rgb = hexToRgb(val);
        if (rgb) root.style.setProperty('--color-accent-rgb', rgb);
      }
    };
    apply('colorPrimary', setting.colorPrimary);
    apply('colorSecondary', setting.colorSecondary);
    apply('colorAccent', setting.colorAccent);
    if (setting.colorPrimary && setting.colorSecondary) {
      root.style.setProperty('--grad-primary', `linear-gradient(90deg, ${setting.colorPrimary}, ${setting.colorSecondary})`);
    }
    // Debug: تحقق من القيمة الفعلية للون الأساسي
    console.log('[SettingsContext] colorPrimary:', setting.colorPrimary);
    // Set site name in og:site_name meta for consistency
    try {
      const siteName = setting.siteNameAr || setting.siteNameEn;
      if (siteName) {
        let el = document.head.querySelector('meta[property="og:site_name"]');
        if (!el) { el = document.createElement('meta'); el.setAttribute('property','og:site_name'); document.head.appendChild(el); }
        el.setAttribute('content', siteName);
      }
    } catch {}
  }, [setting]);

  const update = async (patch) => {
    const res = await api.settingsUpdate(patch);
    let s = res.setting;
    if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/api/uploads')) {
      s.logo = s.logo.replace(/^\/api/, '');
    }
    if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/')) {
      const viteApi = import.meta.env && import.meta.env.VITE_API_URL;
      if (viteApi && typeof viteApi === 'string' && viteApi.trim()) {
        s.logoUrl = viteApi.replace(/\/$/, '') + s.logo;
      } else {
        let base = window.location.origin;
        if (base.includes(':517')) {
          base = base.replace(/:\d+$/, ':4000');
        }
        s.logoUrl = base + s.logo;
      }
    }
    setSetting(s);
    return s;
  };

  const uploadLogo = async (file) => {
    const res = await api.settingsUploadLogo(file);
    let s = res.setting;
    if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/api/uploads')) {
      s.logo = s.logo.replace(/^\/api/, '');
    }
    if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/')) {
      const viteApi = import.meta.env && import.meta.env.VITE_API_URL;
      if (viteApi && typeof viteApi === 'string' && viteApi.trim()) {
        s.logoUrl = viteApi.replace(/\/$/, '') + s.logo;
      } else {
        let base = window.location.origin;
        if (base.includes(':517')) {
          base = base.replace(/:\d+$/, ':4000');
        }
        s.logoUrl = base + s.logo;
      }
    }
    if (s) setSetting(s);
    return s || null;
  };

  const value = useMemo(() => ({ setting, loading, error, update, uploadLogo }), [setting, loading, error]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);

export default SettingsContext;

// Helpers
function hexToRgb(hex) {
  try {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r},${g},${b}`;
  } catch { return null; }
}

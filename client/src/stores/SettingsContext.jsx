import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api/client';
import { useDesignTokens } from './DesignTokenContext';
import { useQuery } from '@tanstack/react-query';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [setting, setSetting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setTokens: setDesignTokens } = useDesignTokens();

  // Use React Query for settings with proper caching
  const {
    data: remoteSetting,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.settingsGet();
      let s = res.setting || null;
      // Normalize possible older values that stored uploads with an /api prefix
      if (s && s.logo && typeof s.logo === 'string') {
        // If someone stored '/api/uploads/..' convert to '/uploads/..' so the client uses the backend static path
        if (s.logo.startsWith('/api/uploads')) s.logo = s.logo.replace(/^\/api/, '');
      }
      // إذا كان logo مساراً نسبياً، ابنِ logoUrl بشكل صحيح
      if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/')) {
        const isUpload = s.logo.startsWith('/uploads');
        if (isUpload) {
          // Uploaded assets are proxied by Vite under /uploads; use the proxied path for same-origin requests
          s.logoUrl = s.logo;
        } else {
          // Public assets like /images are served by the frontend; use current origin directly
          s.logoUrl = s.logo;
        }
      }
      return s;
    },
    enabled: true, // Always enabled since settings are core to the app
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change frequently
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Sync query results into our local state when available
  useEffect(() => {
    if (remoteSetting !== undefined) {
      setSetting(remoteSetting);
      setError(null);
    }
  }, [remoteSetting]);

  // Handle query errors
  useEffect(() => {
    if (isError) {
      setError(queryError?.message || 'Failed to load settings');
    }
  }, [isError, queryError]);

  // Update loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (!setting) return;
    // طباعة قيمة الشعار والرابط النهائي (dev only)
    if (import.meta?.env?.DEV) {
      console.log('[SettingsContext] logo:', setting.logo, 'logoUrl:', setting.logoUrl);
    }
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
    if (setDesignTokens) {
      const patch = {};
      if (setting.colorPrimary) {
        patch['brand.primary'] = setting.colorPrimary;
        const rgb = hexToRgb(setting.colorPrimary);
        if (rgb) patch['brand.primaryRgb'] = rgb;
      }
      if (setting.colorSecondary) {
        patch['brand.primaryAlt'] = setting.colorSecondary;
        patch['brand.secondary'] = setting.colorSecondary;
      }
      if (setting.colorPrimary && setting.colorSecondary) {
        patch['brand.gradient.primary'] = `linear-gradient(90deg, ${setting.colorPrimary}, ${setting.colorSecondary})`;
      }
      if (setting.colorAccent) {
        patch['brand.accent'] = setting.colorAccent;
        const rgb = hexToRgb(setting.colorAccent);
        if (rgb) patch['brand.accentRgb'] = rgb;
        patch['brand.ring'] = setting.colorAccent;
      }
      if (Object.keys(patch).length) {
        setDesignTokens(patch);
      }
    }
    // Debug: تحقق من القيمة الفعلية للون الأساسي (dev only)
    if (import.meta?.env?.DEV) {
      console.log('[SettingsContext] colorPrimary:', setting.colorPrimary);
    }
    // Set site name in og:site_name meta for consistency
    try {
      const siteName = setting.siteNameAr || setting.siteNameEn;
      if (siteName) {
        let el = document.head.querySelector('meta[property="og:site_name"]');
        if (!el) { el = document.createElement('meta'); el.setAttribute('property','og:site_name'); document.head.appendChild(el); }
        el.setAttribute('content', siteName);
      }
    } catch {}
  }, [setting, setDesignTokens]);

  const update = async (patch) => {
    const res = await api.settingsUpdate(patch);
    let s = res.setting;
    if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/api/uploads')) {
      s.logo = s.logo.replace(/^\/api/, '');
    }
    if (s && s.logo && typeof s.logo === 'string' && s.logo.startsWith('/')) {
      const isUpload = s.logo.startsWith('/uploads');
      const viteApi = import.meta.env && import.meta.env.VITE_API_URL;
      if (isUpload) {
        let base = window.location.origin;
        if (viteApi && typeof viteApi === 'string' && viteApi.trim() && !viteApi.startsWith('/')) {
          try { base = new URL(viteApi).origin; } catch {}
        } else if (base.includes(':517')) {
          base = base.replace(/:\d+$/, ':8829');
        }
        s.logoUrl = base + s.logo;
      } else {
        s.logoUrl = s.logo;
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
      const isUpload = s.logo.startsWith('/uploads');
      const viteApi = import.meta.env && import.meta.env.VITE_API_URL;
      if (isUpload) {
        let base = window.location.origin;
        if (viteApi && typeof viteApi === 'string' && viteApi.trim() && !viteApi.startsWith('/')) {
          try { base = new URL(viteApi).origin; } catch {}
        } else if (base.includes(':517')) {
          base = base.replace(/:\d+$/, ':8829');
        }
        s.logoUrl = base + s.logo;
      } else {
        s.logoUrl = s.logo;
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

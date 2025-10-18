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
        setSetting(res.setting || null);
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
    setSetting(res.setting);
    return res.setting;
  };

  const uploadLogo = async (file) => {
    const res = await api.settingsUploadLogo(file);
    setSetting(res.setting);
    return res.setting.logo;
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

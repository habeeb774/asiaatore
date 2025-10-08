import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLocale }) => {
  const location = useLocation?.();
  const navigate = useNavigate?.();
  const { i18n, t: i18t } = useTranslation();
  const pathLocale = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[0] : null;
  const defaultLocale = (pathLocale && ['ar','en','fr'].includes(pathLocale)) ? pathLocale : (initialLocale || i18n?.language || 'ar');
  const [locale, setLocaleState] = useState(defaultLocale);

  const setLocale = useCallback((nextLocale) => {
    setLocaleState(nextLocale);
    try { i18n?.changeLanguage(nextLocale); } catch {}
    try { localStorage.setItem('lang', nextLocale); } catch {}
    // adjust path
    if (typeof window === 'undefined' || !navigate) return;
    const segments = window.location.pathname.split('/').filter(Boolean);
    // remove existing locale segment
    if (segments[0] && ['ar','en','fr'].includes(segments[0])) {
      segments.shift();
    }
    if (nextLocale !== 'ar') {
      segments.unshift(nextLocale);
    }
    const newPath = '/' + segments.join('/');
    navigate(newPath + window.location.search, { replace: true });
  }, [navigate, i18n]);

  const t = useCallback((key) => i18t(key), [i18t]);

  const value = useMemo(() => ({ locale, setLocale, t, available: ['ar','en','fr'] }), [locale, t, setLocale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

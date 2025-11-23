import { useMemo } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function useSiteName({ locale } = {}) {
  const { setting } = useSettings() || {};
  return useMemo(() => {
    const fromSettings = setting?.siteNameEn || setting?.siteName || setting?.siteNameAr;
    const envName = import.meta.env.VITE_SITE_NAME;
    const def = locale === 'ar' ? 'متجرنا' : 'Our Store';
    return fromSettings || envName || def;
  }, [setting?.siteNameEn, setting?.siteName, setting?.siteNameAr, locale]);
}

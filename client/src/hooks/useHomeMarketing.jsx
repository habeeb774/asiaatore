import { useMemo } from 'react';
import { resolveLocalized } from '../utils/locale';

/**
 * Custom hook for managing marketing features
 */
export const useMarketingFeatures = (marketingFeatures = [], locale) => {
  return useMemo(
    () =>
      marketingFeatures.slice(0, 6).map((f) => ({
        id: f.id,
        icon: <span className="text-3xl" aria-hidden="true">{f.icon}</span>,
        title: resolveLocalized(f.title, locale) || f.title,
        description: resolveLocalized(f.body, locale) || f.body,
      })),
    [marketingFeatures, locale]
  );
};

/**
 * Custom hook for managing site configuration
 */
export const useSiteConfig = (locale, setting, t) => {
  const siteName = useMemo(() =>
    locale === 'ar'
      ? setting?.siteNameAr || 'شركة منفذ اسيا التجارية'
      : setting?.siteNameEn || 'My Store',
    [locale, setting]
  );

  const pageTitle = useMemo(() =>
    locale === 'ar' ? `${t('home')} | ${siteName}` : `${siteName} | ${t('home')}`,
    [locale, t, siteName]
  );

  return { siteName, pageTitle };
};

/**
 * Custom hook for managing top strip banners
 */
export const useTopStripBanners = (topStrip = [], locale) => {
  return useMemo(() =>
    topStrip.slice(0, 3).map((b, index) => {
      const href = b.linkUrl || '#';
      const isExternal = typeof href === 'string' && /^(https?:)?\/\//i.test(href) && !href.startsWith('/');

      return {
        ...b,
        href,
        isExternal,
        animationDelay: `${index * 100}ms`,
        resolvedTitle: resolveLocalized(b.title, locale)
      };
    }),
    [topStrip, locale]
  );
};
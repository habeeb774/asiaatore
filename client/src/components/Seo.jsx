import React, { useEffect } from 'react';
import { useSettings } from "../stores/SettingsContext";

// Small SEO helper for single-page app to update title and common meta tags
const setMeta = (nameOrProp, value, attr = 'name') => {
  try {
    if (!value) return;
    const selector = `${attr}="${nameOrProp}"`;
    let el = document.head.querySelector(`[${attr}="${nameOrProp}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, nameOrProp);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  } catch {}
};

const Seo = ({ title, description, image, url }) => {
  const { setting } = useSettings() || {};
  useEffect(() => {
    const siteName = setting?.siteNameAr || setting?.siteNameEn || 'شركة منفذ اسيا التجارية';
    const finalTitle = title || siteName;
    if (finalTitle) document.title = finalTitle;
    setMeta('description', description, 'name');
    setMeta('og:title', finalTitle, 'property');
    setMeta('og:description', description, 'property');
    if (image) {
      setMeta('og:image', image, 'property');
      setMeta('twitter:image', image, 'name');
    }
    if (url) setMeta('og:url', url, 'property');
    // twitter basics
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary', 'name');
    if (finalTitle) setMeta('twitter:title', finalTitle, 'name');
    if (description) setMeta('twitter:description', description, 'name');
    // Ensure og:site_name reflects settings
    setMeta('og:site_name', siteName, 'property');
  }, [title, description, image, url, setting?.siteNameAr, setting?.siteNameEn]);

  return null;
};

export default Seo;

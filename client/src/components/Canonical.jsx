import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../stores/LanguageContext';

/*
  Canonical + hreflang manager.
  Assumptions:
   - Arabic is default ("ar") and base domain mirrors production jomlah.app replacement later.
   - We'll allow passing a baseDomain via window.__APP_CANONICAL_DOMAIN__ if set.
*/
const BASE_DOMAIN = (import.meta?.env?.VITE_PUBLIC_DOMAIN) || (typeof window !== 'undefined' && window.__APP_CANONICAL_DOMAIN__) || 'https://jomlah.app';

function ensureTag(tagName, attrs = {}) {
  const selector = Object.entries(attrs).map(([k,v]) => `[${k}="${v}"]`).join('');
  let el = document.head.querySelector(`${tagName}${selector}`);
  if (!el) {
    el = document.createElement(tagName);
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    document.head.appendChild(el);
  }
  return el;
}

const Canonical = ({ alternates = ['ar','en'] }) => {
  const location = useLocation();
  const langCtx = useLanguage();
  const { locale } = langCtx;

  useEffect(() => {
    // detect locale prefix (simple heuristic: first segment if matches alternates but not default root)
    const segments = location.pathname.split('/').filter(Boolean);
    let detectedLocale = locale || 'ar';
    if (!locale) {
      if (segments[0] && alternates.includes(segments[0])) detectedLocale = segments[0];
    }

    // build canonical path: ensure locale prefix for non-default languages
    let canonicalPath;
    if (detectedLocale === 'ar') {
      canonicalPath = '/' + segments.filter(s => s !== 'ar').join('/');
    } else {
      canonicalPath = '/' + [detectedLocale, ...segments.slice(1)].join('/');
    }
    if (canonicalPath === '/') canonicalPath = '/';
    const canonicalUrl = `${BASE_DOMAIN}${canonicalPath}`.replace(/\/+$/, '/');

    let link = ensureTag('link', { rel: 'canonical' });
    link.setAttribute('href', canonicalUrl);

    // hreflang alternates
    alternates.forEach(lang => {
      let altPath;
      if (lang === 'ar') {
        // drop locale segment if present
        altPath = '/' + segments.filter(s => s !== 'ar' && s !== 'en').join('/');
      } else {
        altPath = '/' + [lang, ...segments.filter((s,i) => !(i===0 && alternates.includes(s)))].join('/');
      }
      if (altPath === '/') altPath = '/';
      const href = `${BASE_DOMAIN}${altPath}`.replace(/\/+$/, '/');
      let alt = ensureTag('link', { rel: 'alternate', hreflang: lang });
      alt.setAttribute('href', href);
    });

    // x-default
    let xDef = ensureTag('link', { rel: 'alternate', hreflang: 'x-default' });
    xDef.setAttribute('href', `${BASE_DOMAIN}/`);

    // og:locale:alternate meta tags
    const existingOgAlts = Array.from(document.head.querySelectorAll('meta[property="og:locale:alternate"]'));
    existingOgAlts.forEach(n => n.parentNode.removeChild(n));
    alternates.forEach(lang => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:locale:alternate');
      meta.setAttribute('content', lang === 'ar' ? 'ar_AR' : 'en_US');
      document.head.appendChild(meta);
    });
  }, [location, alternates, locale]);

  return null;
};

export default Canonical;
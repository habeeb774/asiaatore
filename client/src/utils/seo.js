import { useEffect } from 'react';

/**
 * مكون لإدارة عناصر head في الصفحة لتحسين SEO
 */
export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  locale = 'en',
  siteName
}) => {
  useEffect(() => {
    // تحديث title
    if (title) {
      document.title = title;
    }

    // تحديث أو إنشاء meta tags
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (element) {
        element.setAttribute('content', content);
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.setAttribute('content', content);
        document.head.appendChild(element);
      }
    };

    // Meta description
    if (description) {
      updateMetaTag('description', description);
    }

    // Meta keywords
    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph tags
    if (title) updateMetaTag('og:title', title, true);
    if (description) updateMetaTag('og:description', description, true);
    if (image) updateMetaTag('og:image', image, true);
    if (url) updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    if (locale) updateMetaTag('og:locale', locale, true);
    if (siteName) updateMetaTag('og:site_name', siteName, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    if (title) updateMetaTag('twitter:title', title, true);
    if (description) updateMetaTag('twitter:description', description, true);
    if (image) updateMetaTag('twitter:image', image, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (url) {
      if (canonical) {
        canonical.setAttribute('href', url);
      } else {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', url);
        document.head.appendChild(canonical);
      }
    }

    // Structured Data (JSON-LD)
    let structuredData = document.querySelector('script[type="application/ld+json"]');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.setAttribute('type', 'application/ld+json');
      document.head.appendChild(structuredData);
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': type === 'website' ? 'WebSite' : 'Organization',
      name: siteName || title,
      description: description,
      url: url,
      ...(image && { image: image }),
      ...(type === 'website' && {
        potentialAction: {
          '@type': 'SearchAction',
          target: `${url}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      })
    };

    structuredData.textContent = JSON.stringify(jsonLd);

  }, [title, description, keywords, image, url, type, locale, siteName]);
};

/**
 * مكون لتحسين SEO للصفحة الرئيسية
 */
export const HomeSEO = ({ locale, siteName }) => {
  const seoData = {
    title: locale === 'ar'
      ? `${siteName || 'متجرنا'} - تسوق عبر الإنترنت بأفضل الأسعار`
      : `${siteName || 'Our Store'} - Online Shopping at Best Prices`,
    description: locale === 'ar'
      ? 'اكتشف مجموعة واسعة من المنتجات عالية الجودة في متجرنا الإلكتروني. تسوق بأمان واستمتع بتجربة تسوق مميزة مع شحن مجاني.'
      : 'Discover a wide range of high-quality products in our online store. Shop safely and enjoy a premium shopping experience with free shipping.',
    keywords: locale === 'ar'
      ? 'تسوق عبر الإنترنت, منتجات, شحن مجاني, متجر إلكتروني, أسعار منافسة'
      : 'online shopping, products, free shipping, e-commerce, competitive prices',
    image: '/images/og-image.jpg',
    url: typeof window !== 'undefined' ? window.location.href : '/',
    type: 'website',
    locale: locale === 'ar' ? 'ar_SA' : 'en_US',
    siteName: siteName || (locale === 'ar' ? 'متجرنا' : 'Our Store')
  };

  useSEO(seoData);

  return null;
};
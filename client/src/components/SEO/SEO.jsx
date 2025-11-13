import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../../stores/LanguageContext';

// Enhanced SEO Component with structured data and advanced meta tags
const SEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
  published,
  modified,
  section,
  tags = [],
  breadcrumbs = [],
  product,
  organization,
  localBusiness,
  article,
  ...props
}) => {
  const { locale } = useLanguage();
  // Generate full title
  const fullTitle = title ? `${title} | My Store` : 'My Store';

  // Generate full URL
  const fullUrl = url ? `${window.location.origin}${url}` : window.location.href;

  // Generate image URL
  const imageUrl = image ? `${window.location.origin}${image}` : `${window.location.origin}/images/og-default.jpg`;

  // Default meta description
  const metaDescription = description || 'Discover amazing products at My Store. Quality products with great prices and fast delivery.';

  // Generate structured data
  const generateStructuredData = () => {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
      name: title,
      description: metaDescription,
      url: fullUrl,
      image: imageUrl,
    };

    // Organization data
    const orgData = organization || {
      '@type': 'Organization',
      name: 'My Store',
      url: window.location.origin,
      logo: `${window.location.origin}/images/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+966-50-000-0000',
        contactType: 'customer service',
        availableLanguage: ['Arabic', 'English']
      },
      sameAs: [
        'https://facebook.com/mystore',
        'https://instagram.com/mystore',
        'https://twitter.com/mystore'
      ]
    };

    // Product structured data
    if (type === 'product' && product) {
      // Handle multilingual product data
      const productName = typeof product.name === 'object' && product.name[locale]
        ? product.name[locale]
        : typeof product.name === 'string'
        ? product.name
        : 'Product';

      const productDescription = typeof product.description === 'object' && product.description[locale]
        ? product.description[locale]
        : typeof product.description === 'string'
        ? product.description
        : 'Product description';

      return {
        ...baseData,
        '@type': 'Product',
        name: productName,
        description: productDescription,
        image: product.images?.map(img => `${window.location.origin}${img}`) || [imageUrl],
        brand: {
          '@type': 'Brand',
          name: product.brand?.name || 'My Store'
        },
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: 'SAR',
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          condition: 'https://schema.org/NewCondition'
        },
        aggregateRating: product.rating ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount || 0
        } : undefined,
        review: product.reviews?.slice(0, 5).map(review => ({
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: review.userName || 'Anonymous'
          },
          reviewRating: {
            '@type': 'Rating',
            ratingValue: review.rating
          },
          reviewBody: review.body
        }))
      };
    }

    // Article structured data
    if (type === 'article' && article) {
      return {
        ...baseData,
        '@type': 'Article',
        headline: article.headline,
        author: {
          '@type': 'Person',
          name: article.author
        },
        publisher: orgData,
        datePublished: article.published,
        dateModified: article.modified || article.published,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': fullUrl
        }
      };
    }

    // Local Business structured data
    if (type === 'LocalBusiness' && localBusiness) {
      return {
        ...baseData,
        '@type': 'LocalBusiness',
        address: {
          '@type': 'PostalAddress',
          streetAddress: localBusiness.address,
          addressLocality: localBusiness.city,
          addressRegion: localBusiness.region,
          postalCode: localBusiness.postalCode,
          addressCountry: localBusiness.country
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: localBusiness.latitude,
          longitude: localBusiness.longitude
        },
        telephone: localBusiness.phone,
        openingHours: localBusiness.openingHours
      };
    }

    // Breadcrumb structured data
    if (breadcrumbs.length > 0) {
      const breadcrumbData = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${window.location.origin}${crumb.url}`
        }))
      };

      return [baseData, breadcrumbData];
    }

    return baseData;
  };

  const structuredData = generateStructuredData();

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {keywords && <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />}
      <meta name="author" content={author || 'My Store'} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="My Store" />
      <meta property="og:locale" content="ar_SA" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Article Meta Tags */}
      {published && <meta property="article:published_time" content={published} />}
      {modified && <meta property="article:modified_time" content={modified} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Additional Meta Tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />

      {/* Mobile Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="My Store" />

      {/* Favicon and Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Structured Data */}
      {Array.isArray(structuredData) ? (
        structuredData.map((data, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        ))
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://cdn.salla.network" />

      {/* DNS prefetch */}
      <link rel="dns-prefetch" href="//cdn.salla.network" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />

      {props.children}
    </Helmet>
  );
};

export default SEO;
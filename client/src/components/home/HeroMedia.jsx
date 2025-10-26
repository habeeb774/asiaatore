import React from 'react';
import SafeImage from '../../components/common/SafeImage';

export default function HeroMedia({ heroVisual, setting, useVideoBg }) {
  return (
    <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden" aria-hidden="true">
      {useVideoBg && setting?.heroVideoUrl ? (
        <video
          className="w-full h-full object-cover"
          src={setting.heroVideoUrl}
          poster={heroVisual.src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : (
        <picture>
          {setting?.heroImageAvif && <source srcSet={setting.heroImageAvif} type="image/avif" />}
          {setting?.heroImageWebp && <source srcSet={setting.heroImageWebp} type="image/webp" />}
          <source srcSet="/images/hero-image.avif" type="image/avif" />
          <source srcSet="/images/hero-image.webp" type="image/webp" />
          <img
            src={heroVisual.src || '/images/hero-image.svg'}
            alt={heroVisual.alt || ''}
            className="w-full h-full object-cover hero-bg-img"
            style={{ width: '100%', height: '100%', objectPosition: 'center' }}
            width={1600}
            height={600}
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.18) 100%)' }}
      />

      {/* Decorative radial glow to the bottom-right for depth */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -bottom-40 w-96 h-96 rounded-full opacity-30" style={{ background: 'radial-gradient(circle at 40% 60%, rgba(255,180,100,0.18), transparent 40%)', filter: 'blur(40px)' }} />
    </div>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMarketing } from '../context/MarketingContext';
import api from '../api/client';

// Accessible autoplay carousel for homepage banners (location=homepage)
// Features:
//  - Autoplay (5s) with pause on hover / focus
//  - Keyboard navigation (ArrowLeft / ArrowRight)
//  - Indicators & SR-friendly labels
//  - Lazy image loading & aspect ratio box
//  - RTL aware movement

const AUTO_INTERVAL = 5000;

const HeroBannerSlider = () => {
  const { locale } = useLanguage();
  const { byLocation, loading } = useMarketing() || { byLocation:{ homepage:[] }, loading:false };
  const banners = byLocation.homepage || [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dirRtl = locale === 'ar';
  const timerRef = useRef(null);
  const sliderRef = useRef(null);

  const clamp = useCallback((i) => {
    const len = banners.length; if (!len) return 0; return ( (i % len) + len ) % len;
  }, [banners.length]);

  const next = useCallback(()=> setIndex(i => clamp(i+1)), [clamp]);
  const prev = useCallback(()=> setIndex(i => clamp(i-1)), [clamp]);

  // Autoplay
  useEffect(()=> {
    if (paused || banners.length <= 1) return; 
    timerRef.current = setTimeout(next, AUTO_INTERVAL);
    return ()=> clearTimeout(timerRef.current);
  }, [index, paused, banners.length, next]);

  // Reset index if banners length changes
  useEffect(()=> { setIndex(0); }, [banners.length]);

  // Keyboard navigation
  useEffect(()=> {
    const el = sliderRef.current; if (!el) return;
    const handler = (e) => {
      if (e.key === 'ArrowRight') { (dirRtl ? prev : next)(); }
      else if (e.key === 'ArrowLeft') { (dirRtl ? next : prev)(); }
    };
    el.addEventListener('keydown', handler);
    return ()=> el.removeEventListener('keydown', handler);
  }, [next, prev, dirRtl]);

  if (loading) {
    return (
      <div className="container-custom mt-6" aria-hidden="true">
        <div className="h-52 md:h-64 w-full rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }
  if (!banners.length) return null;

  return (
    <section
      className="relative mt-6 select-none"
      aria-roledescription="carousel"
      aria-label={locale==='ar' ? 'شرائح ترويجية' : 'Promotional slider'}
    >
      <div 
        className="container-custom full-bleed-mobile"
      >
        <div
          ref={sliderRef}
          tabIndex={0}
          className="relative overflow-hidden rounded-2xl group shadow ring-1 ring-black/5 focus:outline-none"
          onMouseEnter={()=>setPaused(true)}
          onMouseLeave={()=>setPaused(false)}
          onFocus={()=>setPaused(true)}
          onBlur={()=>setPaused(false)}
        >
          {/* Slides wrapper */}
          <div
            className="flex transition-transform duration-700 ease-out will-change-transform"
            style={{ transform: `translateX(${dirRtl ? index*100 : -index*100}%)`, direction: dirRtl ? 'rtl' : 'ltr' }}
          >
            {banners.map((b, i) => {
              const title = b.title?.[locale] || b.title?.ar || b.title?.en || '';
              const body = b.body?.[locale] || b.body?.ar || b.body?.en || '';
              const active = i === index;
              const content = (
                <div
                  className="absolute inset-0 flex flex-col justify-center gap-4 p-6 md:p-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white"
                >
                  {title && <h3 className="text-xl md:text-3xl font-bold drop-shadow-sm" dangerouslySetInnerHTML={{ __html: title }} />}
                  {body && <p className="max-w-xl text-sm md:text-base opacity-90 leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />}
                  {b.linkUrl && (
                    <span className="inline-flex w-max items-center gap-2 bg-primary-red hover:bg-red-700 transition text-xs md:text-sm font-semibold px-4 py-2 rounded-full shadow">
                      {locale==='ar' ? 'تعرف أكثر' : 'Learn more'}
                    </span>
                  )}
                </div>
              );
              const inner = (
                <div
                  aria-roledescription="slide"
                  aria-label={`${i+1} / ${banners.length}`}
                  aria-hidden={!active}
                  className="hero-slider__frame relative shrink-0 w-full overflow-hidden"
                >
                  {b.image ? (
                    b.imageVariants?.avif || b.imageVariants?.webp ? (
                      <picture>
                        {b.imageVariants?.avif ? (
                          <source type="image/avif" srcSet={[
                            b.imageVariants.avif.thumb && `${b.imageVariants.avif.thumb} 320w`,
                            b.imageVariants.avif.medium && `${b.imageVariants.avif.medium} 800w`,
                            b.imageVariants.avif.large && `${b.imageVariants.avif.large} 1280w`
                          ].filter(Boolean).join(', ')} sizes="(max-width: 640px) 100vw, 100vw" />
                        ) : null}
                        {b.imageVariants?.webp ? (
                          <source type="image/webp" srcSet={[
                            b.imageVariants.webp.thumb && `${b.imageVariants.webp.thumb} 320w`,
                            b.imageVariants.webp.medium && `${b.imageVariants.webp.medium} 800w`,
                            b.imageVariants.webp.large && `${b.imageVariants.webp.large} 1280w`
                          ].filter(Boolean).join(', ')} sizes="(max-width: 640px) 100vw, 100vw" />
                        ) : null}
                        <img
                          src={b.imageVariants?.medium || b.image}
                          srcSet={b.imageVariants ? [
                            b.imageVariants.thumb && `${b.imageVariants.thumb} 320w`,
                            b.imageVariants.medium && `${b.imageVariants.medium} 800w`,
                            b.imageVariants.large && `${b.imageVariants.large} 1280w`
                          ].filter(Boolean).join(', ') : undefined}
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                          alt={title}
                          loading={i === 0 ? 'eager':'lazy'}
                          fetchPriority={i === 0 ? 'high' : undefined}
                          className="w-full h-full object-cover"
                          decoding="async"
                        />
                      </picture>
                    ) : (
                      <img
                        src={b.imageVariants?.medium || b.image}
                        srcSet={b.imageVariants ? [
                          b.imageVariants.thumb && `${b.imageVariants.thumb} 320w`,
                          b.imageVariants.medium && `${b.imageVariants.medium} 800w`,
                          b.imageVariants.large && `${b.imageVariants.large} 1280w`
                        ].filter(Boolean).join(', ') : undefined}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
                        alt={title}
                        loading={i === 0 ? 'eager':'lazy'}
                        fetchPriority={i === 0 ? 'high' : undefined}
                        className="w-full h-full object-cover"
                        decoding="async"
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                  {content}
                </div>
              );
              return (
                <div key={b.id || i} className="w-full relative">
                  {b.linkUrl ? (
                    <a href={b.linkUrl} className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-red/40" onClick={()=>{ try { api.marketingTrackClick('banner', b.id); } catch{} }}>
                      {inner}
                    </a>
                  ) : inner}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={dirRtl ? next : prev}
                aria-label={locale==='ar' ? 'السابق' : 'Previous'}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 start-2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="text-lg" aria-hidden="true">{dirRtl ? '›' : '‹'}</span>
              </button>
              <button
                type="button"
                onClick={dirRtl ? prev : next}
                aria-label={locale==='ar' ? 'التالي' : 'Next'}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 end-2 z-10 w-10 h-10 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/55 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="text-lg" aria-hidden="true">{dirRtl ? '‹' : '›'}</span>
              </button>
            </>
          )}
          {/* Indicators */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-2 z-10">
            {banners.map((_,i)=>(
              <button
                key={i}
                type="button"
                aria-label={(locale==='ar' ? 'اذهب إلى الشريحة':'Go to slide') + ' ' + (i+1)}
                onClick={()=> setIndex(i)}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${i===index? 'w-6 bg-primary-red shadow':'w-2.5 bg-white/60 hover:bg-white/90'}`}
              />
            ))}
          </div>
          {/* Pause / Play toggle (visually hidden on mobile indicators coexist) */}
          {banners.length > 1 && (
            <button
              type="button"
              onClick={()=>setPaused(p=>!p)}
              className="absolute top-2 end-2 z-10 text-[11px] bg-black/40 hover:bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {paused ? (locale==='ar' ? 'تشغيل' : 'Play') : (locale==='ar' ? 'إيقاف' : 'Pause')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBannerSlider;
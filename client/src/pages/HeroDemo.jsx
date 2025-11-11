import React, { useMemo, useState } from 'react';
import HomeHero from '../components/home/HomeHero.jsx';
import ExperimentContext from '../stores/ExperimentContext.jsx';
import SettingsContext from '../stores/SettingsContext.jsx';
import { useLanguage } from '../stores/LanguageContext.jsx';
import { Button } from '../components/ui';

const HERO_PRESETS = {
  default: {
    name: 'Core Grocery',
    description: 'Balanced gradient + product mix tailored for a general grocery storefront.',
    slides: [
      {
        id: 'default-1',
        title: 'عروض نهاية الأسبوع',
        subtitle: 'خصومات 35% على السلة العائلية',
        link: '/products?tag=weekend',
        src: 'https://images.unsplash.com/photo-1543168226-8675d954d411?auto=format&fit=crop&w=1400&q=80',
        overlay: 'linear-gradient(135deg, rgba(56,189,248,0.85) 0%, rgba(59,130,246,0.85) 100%)',
        baseBg: 'linear-gradient(135deg, rgba(13,148,136,0.85) 0%, rgba(16,185,129,0.65) 100%)'
      },
      {
        id: 'default-2',
        title: 'منتجات طازجة كل صباح',
        subtitle: 'شحن مجاني للطلبات فوق 150 ر.س',
        link: '/products?category=fresh',
        src: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80',
        overlay: 'linear-gradient(135deg, rgba(236,72,153,0.85) 0%, rgba(244,114,182,0.85) 100%)',
        baseBg: 'linear-gradient(135deg, rgba(79,70,229,0.85) 0%, rgba(99,102,241,0.65) 100%)'
      }
    ]
  },
  ramadan: {
    name: 'Ramadan Nights',
    description: 'Warm tones, lantern overlays, and seasonal messaging for Ramadan promotions.',
    slides: [
      {
        id: 'ramadan-1',
        title: 'سلال رمضان المميزة',
        subtitle: 'حضّر الإفطار في دقائق مع تشكيلتنا الجاهزة',
        link: '/products?collection=ramadan-boxes',
        src: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=1400&q=80',
        overlay: 'linear-gradient(135deg, rgba(180,83,9,0.88) 0%, rgba(202,138,4,0.85) 100%)',
        baseBg: 'linear-gradient(135deg, rgba(30,64,175,0.9) 0%, rgba(37,99,235,0.7) 100%)',
        centerImage: 'https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/ramadan.svg'
      },
      {
        id: 'ramadan-2',
        title: 'حلويات شرقية أصلية',
        subtitle: 'قطايف، بسبوسة، وتمور فاخرة مع توصيل سريع',
        link: '/products?category=sweets',
        src: 'https://images.unsplash.com/photo-1612872087720-bb876e5d06c5?auto=format&fit=crop&w=1400&q=80',
        overlay: 'linear-gradient(135deg, rgba(147,51,234,0.88) 0%, rgba(124,58,237,0.78) 100%)',
        baseBg: 'linear-gradient(135deg, rgba(24,24,27,0.9) 0%, rgba(39,39,42,0.75) 100%)'
      }
    ]
  },
  electronics: {
    name: 'Electronics Launch',
    description: 'High contrast hero geared towards gadgets and premium electronics.',
    slides: [
      {
        id: 'electronics-1',
        title: 'أحدث الهواتف الذكية',
        subtitle: 'عروض حصرية مع ضمان ممتد',
        link: '/products?category=smartphones',
        src: 'https://images.unsplash.com/photo-1510554310709-16f8c1df3d41?auto=format&fit=crop&w=1400&q=80',
        overlay: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.85) 100%)',
        baseBg: 'linear-gradient(135deg, rgba(59,130,246,0.7) 0%, rgba(99,102,241,0.7) 100%)'
      },
      {
        id: 'electronics-2',
        title: 'ملحقات أصلية 100%',
        subtitle: 'شواحن، سماعات، وكابلات بضمان المتجر',
        link: '/products?category=accessories',
        src: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1400&q=80',
        overlay: 'linear-gradient(135deg, rgba(79,70,229,0.78) 0%, rgba(167,139,250,0.75) 100%)',
        baseBg: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.78) 100%)'
      }
    ]
  }
};

const HeroDemo = () => {
  const [presetKey, setPresetKey] = useState('default');
  const [ctaVariant, setCtaVariant] = useState('B');
  const [autoplay, setAutoplay] = useState(false);
  const [showCenterpiece, setShowCenterpiece] = useState(true);
  const { locale, setLocale } = useLanguage();

  const activePreset = HERO_PRESETS[presetKey];

  const slides = useMemo(() => {
    if (!activePreset) return [];
    return activePreset.slides.map((slide) => ({
      ...slide,
      centerImage: showCenterpiece ? slide.centerImage : null
    }));
  }, [activePreset, showCenterpiece]);

  const experimentValue = useMemo(() => ({
    variantFor: () => ctaVariant
  }), [ctaVariant]);

  const settingsValue = useMemo(() => ({
    setting: {
      heroAutoplayInterval: 5000,
      heroBackgroundGradient: slides[0]?.overlay || 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.8) 100%)',
      heroBackgroundImage: slides[0]?.src || null,
      heroCenterImage: slides[0]?.centerImage || null
    }
  }), [slides]);

  return (
    <div className="container mx-auto px-4 py-10 space-y-12">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold">Hero Visual Demo</h1>
        <p className="text-muted-foreground text-base max-w-3xl">
          Preview the home hero with curated presets, force CTA variants, and validate Arabic/English copy without leaving the design system. Use this page as your quick Storybook-style reference when iterating on landing visuals.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {Object.entries(HERO_PRESETS).map(([key, preset]) => (
            <Button
              key={key}
              variant={key === presetKey ? 'primary' : 'outline'}
              onClick={() => setPresetKey(key)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[320px_minmax(0,1fr)] items-start">
        <aside className="space-y-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">CTA variant</h2>
            <div className="mt-3 flex gap-2">
              {['A','B'].map((variant) => (
                <Button
                  key={variant}
                  size="sm"
                  variant={ctaVariant === variant ? 'primary' : 'outline'}
                  onClick={() => setCtaVariant(variant)}
                >
                  Variant {variant}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Locale</h2>
            <div className="mt-3 flex gap-2">
              {[
                { key: 'ar', label: 'العربية' },
                { key: 'en', label: 'English' }
              ].map((lang) => (
                <Button
                  key={lang.key}
                  size="sm"
                  variant={locale === lang.key ? 'primary' : 'outline'}
                  onClick={() => setLocale(lang.key)}
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
              />
              تفعيل الدوران التلقائي
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showCenterpiece}
                onChange={(e) => setShowCenterpiece(e.target.checked)}
              />
              إظهار الصورة المركزية (إذا وُجدت)
            </label>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{activePreset?.description}</p>
            <p>
              استخدم متغيرات التحكم أعلاه لاختبار الرسائل، التحويلات، وأوضاع التجربة (A/B) مباشرة داخل الواجهة.
            </p>
          </div>
        </aside>

        <div className="relative">
          <ExperimentContext.Provider value={experimentValue}>
            <SettingsContext.Provider value={settingsValue}>
              <HomeHero
                slides={slides}
                forceVariant={ctaVariant}
                disableTracking
                disableAutoplay={!autoplay}
                containerClassName="relative h-[640px] overflow-hidden rounded-[28px] border border-border/40 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
              />
            </SettingsContext.Provider>
          </ExperimentContext.Provider>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-2">Design tokens in play</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>--color-primary / --grad-primary (CTA + overlays)</li>
            <li>--radius-xl (hero container rounding)</li>
            <li>Button variants (primary vs. outline) exposed via ExperimentContext</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-2">Analytics wiring</h3>
          <p className="text-sm text-muted-foreground">
            CTA click + exposure tracking is disabled in this preview to avoid noisy events. Production hero still emits <code>hero_cta_click</code> and <code>hero_exposure</code> with sendBeacon fallback.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold mb-2">Workflow tips</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>Use <code>?ab_hero_cta=A</code> on any route to force variant without this page.</li>
            <li>Grab presets as JSON for marketing campaigns from <code>HeroDemo.jsx</code>.</li>
            <li>Pair with the image conversion CI job to keep hero assets optimized.</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HeroDemo;

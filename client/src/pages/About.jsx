import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMarketing } from '../context/MarketingContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import Seo from '../components/Seo';
import api from '../api/client';

/* --------------------- Skeleton Placeholder --------------------- */
const FeatureSkeleton = () => (
  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col gap-3">
    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-xl mb-2" />
    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
    <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
    <div className="h-3 w-3/5 bg-slate-200 dark:bg-slate-700 rounded" />
  </div>
);

/* --------------------------- Main Component --------------------------- */
const About = () => {
  const { features = [], loading } = useMarketing() || {};
  const { locale } = useLanguage();
  const { setting } = useSettings() || {};

  const siteName =
    locale === 'ar'
      ? setting?.siteNameAr || 'شركة منفذ اسيا التجارية'
      : setting?.siteNameEn || 'My Store';

  const pageTitle =
    locale === 'ar'
      ? `من نحن | ${siteName}`
      : `${siteName} | About Us`;

  const list = useMemo(
    () => features.slice().sort((a, b) => (a.sort || 0) - (b.sort || 0)),
    [features]
  );

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container-custom px-4 py-16">
        <Seo
          title={pageTitle}
          description={
            locale === 'ar'
              ? `اعرف المزيد عن ${siteName}، الرائدة في التجارة الآسيوية وخدمات الاستيراد.`
              : `Learn more about ${siteName}, a leading Asian products trading platform.`
          }
        />

        {/* -------- Page Header -------- */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
            {locale === 'ar' ? 'من نحن' : 'About Us'}
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 leading-relaxed text-base">
            {locale === 'ar'
              ? `${siteName}: منصة متخصصة في استيراد وتجارة المنتجات الآسيوية عالية الجودة بأسعار تنافسية.`
              : `${siteName}: a platform focused on sourcing and distributing quality Asian products at competitive pricing.`}
          </p>
        </motion.header>

        {/* -------- Features Section -------- */}
        <section aria-labelledby="about-features-heading" className="mb-16">
          <motion.h2
            id="about-features-heading"
            className="text-2xl md:text-3xl font-semibold mb-8 text-slate-900 dark:text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {locale === 'ar' ? 'لماذا نحن' : 'Why Choose Us'}
          </motion.h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <FeatureSkeleton key={i} />
              ))}

            {!loading &&
              list.map((f, i) => {
                const title = f.title?.[locale] || f.title?.ar || f.title?.en;
                const body = f.body?.[locale] || f.body?.ar || f.body?.en;

                return (
                  <motion.button
                    key={f.id}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      try {
                        api.marketingTrackClick('feature', f.id);
                      } catch {}
                    }}
                    className="text-start p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                    aria-label={title}
                  >
                    <span
                      className="text-4xl text-emerald-500"
                      aria-hidden
                    >
                      {f.icon || '★'}
                    </span>
                    <h3 className="font-semibold text-lg leading-snug text-slate-900 dark:text-white">
                      {title}
                    </h3>
                    {body && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {body}
                      </p>
                    )}
                  </motion.button>
                );
              })}

            {!loading && !list.length && (
              <p className="col-span-full text-sm opacity-60 text-center">
                {locale === 'ar'
                  ? 'لا توجد ميزات مفعّلة حالياً.'
                  : 'No active features yet.'}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

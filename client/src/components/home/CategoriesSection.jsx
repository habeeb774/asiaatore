import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveLocalized } from '../../utils/locale';
import { useLanguage } from '../../context/LanguageContext';
import SafeImage from '../common/SafeImage';

const fadeInUp = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' }
  }),
};

const CategoriesSectionModern = ({ categories = [], title, onSelect, selected }) => {
  const { locale } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (categories.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % categories.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [categories]);

  if (!Array.isArray(categories) || categories.length === 0) return null;

  return (
    <section
      className="categories-section-modern my-12"
      aria-label={title || (locale === 'ar' ? 'تصفح حسب الفئة' : 'Browse by Category')}
    >
      <div className="container-fixed px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-extrabold text-emerald-700 tracking-wide drop-shadow-sm">
            {title || (locale === 'ar' ? 'تصفح حسب الفئة' : 'Browse by Category')}
          </h3>
        </div>

        {/* Desktop / Tablet Grid */}
        <motion.div
          className="hidden md:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
          role="list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {categories.map((cat, i) => {
            const name = resolveLocalized(cat.name, locale) || cat.slug;
            const isActive = selected === cat.slug;

            return (
              <motion.div key={cat.id || cat.slug} role="listitem" variants={fadeInUp} custom={i}>
                <button
                  onClick={() => onSelect && onSelect(cat.slug)}
                  className={`group relative block w-full rounded-2xl overflow-hidden border transition-transform duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                    ${isActive ? 'ring-2 ring-emerald-500 shadow-2xl scale-105' : 'shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-105'}`}
                >
                  <div className="aspect-square w-full bg-gray-100 relative overflow-hidden rounded-t-2xl">
                    <SafeImage
                      src={cat.image || '/images/category-placeholder.jpg'}
                      alt={name}
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
                  </div>
                  <div className="p-4 bg-white/95 dark:bg-slate-800/80 text-center rounded-b-2xl">
                    <div className="text-base font-semibold text-slate-900 dark:text-white truncate mb-1">{name}</div>
                    {typeof cat.productCount !== 'undefined' && (
                      <div className="text-xs text-slate-500 dark:text-slate-300">
                        {cat.productCount} {locale === 'ar' ? 'منتج' : 'items'}
                      </div>
                    )}
                  </div>
                  <span className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-emerald-500 text-white text-xs font-bold rounded-full px-2 py-1 shadow-md transform translate-y-0 group-hover:-translate-y-1">
                    {locale === 'ar' ? 'عرض' : 'View'}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Mobile Auto Carousel */}
        <div className="md:hidden relative w-full overflow-hidden rounded-2xl">
          <AnimatePresence initial={false}>
            {categories.map((cat, i) => {
              if (i !== currentIndex) return null;
              const name = resolveLocalized(cat.name, locale) || cat.slug;
              return (
                <motion.div
                  key={cat.id || cat.slug}
                  className="w-full/2 flex-shrink-0"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.6 }}
                >
                  <button
                    onClick={() => onSelect && onSelect(cat.slug)}
                    className="block w-full rounded-2xl overflow-hidden border shadow-md hover:shadow-lg"
                  >
                    <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
                      <SafeImage
                        src={cat.image || '/images/category-placeholder.jpg'}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    </div>
                    <div className="p-3 bg-white/95 text-center">
                      <div className="text-base font-semibold text-slate-900 truncate">{name}</div>
                      {typeof cat.productCount !== 'undefined' && (
                        <div className="text-xs text-slate-500">{cat.productCount} {locale === 'ar' ? 'منتج' : 'items'}</div>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-1 mt-2">
            {categories.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-100 ${i === currentIndex ? 'bg-emerald-500 scale-110' : 'bg-gray-300 hover:scale-105'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoriesSectionModern;

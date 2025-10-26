import React from 'react';
import { motion } from '../../lib/framerLazy';

/**
 * HomeFeatures
 * Props:
 * - features: [{ id, icon, title, description }]
 */
export default function HomeFeatures({ features = [] }) {
  if (!Array.isArray(features) || features.length === 0) return null;

  return (
    <section className="section-padding bg-white dark:bg-gray-900" aria-label="store features">
      <div className="container-fixed">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.id || i}
              className="feature-card p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all cursor-default"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
            >
              <div className="flex items-start gap-4">
                <div className="icon-wrapper w-14 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-700 flex items-center justify-center text-2xl text-emerald-600 dark:text-white">
                  {f.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{f.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

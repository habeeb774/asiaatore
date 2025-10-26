import React, { useEffect, useRef } from 'react';
import { useMarketing } from '../../context/MarketingContext';
import { useSettings } from '../../context/SettingsContext';
import SafeImage from '../common/SafeImage';

export default function TopStrip() {
  const { byLocation } = useMarketing() || { byLocation: { topStrip: [] } };
  const { setting } = useSettings() || {};
  const items = (byLocation && byLocation.topStrip) || [];
  const stripRef = useRef(null);

  // simple autoscroll behaviour
  useEffect(() => {
    if (!stripRef.current) return;
    if (!setting?.topStripAutoscroll) return; // respect setting
    const el = stripRef.current;
    let raf;
    let px = 0;
    const speed = 0.4; // px per frame ~ smooth
    const step = () => {
      if (!el) return;
      px = (px + speed) % el.scrollWidth;
      el.scrollLeft = px;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [setting?.topStripAutoscroll, items.length]);

  if (!setting?.topStripEnabled) return null;
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/90 border-b dark:border-slate-800">
      <div className="max-w-full sm:max-w-[1200px] mx-auto px-2 sm:px-6 md:px-10">
        <div
          ref={stripRef}
          className="w-full flex gap-4 overflow-x-auto no-scrollbar py-2 items-center smooth-scroll"
          style={{ scrollBehavior: 'smooth' }}
          aria-label="Top promotions"
        >
          {items.map(b => (
            <a key={b.id} href={b.linkUrl || '#'} className="flex-shrink-0 min-w-[220px] sm:min-w-[260px] bg-white/95 dark:bg-slate-800/80 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3" aria-label={b.titleEn || b.titleAr}>
              {b.image ? (
                <div className="w-14 h-10 rounded-md overflow-hidden flex-shrink-0">
                  <SafeImage src={b.image} alt={b.titleEn || b.titleAr} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div className="flex-1 text-sm leading-tight">
                <div className="font-medium text-slate-700 dark:text-slate-100">{b.titleAr || b.titleEn}</div>
                {b.bodyAr || b.bodyEn ? <div className="text-xs text-slate-500 dark:text-slate-400">{b.bodyAr || b.bodyEn}</div> : null}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

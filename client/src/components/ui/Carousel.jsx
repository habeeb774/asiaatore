import React, { useEffect, useRef, useState } from 'react';

/**
 * Generic Carousel
 * Props:
 * - items: array
 * - renderItem: (item, index, meta) => ReactNode
 * - visibleCount: number
 * - autoplay: boolean
 * - interval: number
 * - pauseOnHover: boolean
 * - showArrows: boolean
 * - showDots: boolean
 */
const Carousel = ({
  items = [],
  renderItem,
  visibleCount = 1,
  autoplay = true,
  interval = 4000,
  pauseOnHover = true,
  showArrows = true,
  showDots = true,
  className = '',
  initialIndex = 0,
  index, // controlled index (optional)
  onIndexChange
}) => {
  const [internalCurrent, setInternalCurrent] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef(null);

  const maxIndex = Math.max(0, (items?.length || 0) - visibleCount);

  useEffect(() => {
    if (!autoplay || paused || items.length <= visibleCount) return undefined;
    const id = setInterval(() => {
      const cur = typeof index === 'number' ? index : internalCurrent;
      const next = cur >= maxIndex ? 0 : cur + 1;
      if (typeof index === 'number') onIndexChange && onIndexChange(next);
      else setInternalCurrent(next);
    }, interval);
    return () => clearInterval(id);
  }, [autoplay, paused, interval, maxIndex, items.length, visibleCount, index, internalCurrent, onIndexChange]);

  // touch support
  const touchStart = useRef(0);
  const touchDelta = useRef(0);
  const SWIPE_THRESHOLD = 40;

  const onTouchStart = (e) => { touchStart.current = e.touches ? e.touches[0].clientX : e.clientX; touchDelta.current = 0; };
  const onTouchMove = (e) => { const x = e.touches ? e.touches[0].clientX : e.clientX; touchDelta.current = x - touchStart.current; };
  const onTouchEnd = () => {
    const d = touchDelta.current;
    if (Math.abs(d) > SWIPE_THRESHOLD) {
      const cur = typeof index === 'number' ? index : internalCurrent;
      const next = d < 0 ? Math.min(maxIndex, cur + 1) : Math.max(0, cur - 1);
      if (typeof index === 'number') onIndexChange && onIndexChange(next);
      else setInternalCurrent(next);
    }
    touchStart.current = 0; touchDelta.current = 0;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const onKey = (e) => {
      const cur = typeof index === 'number' ? index : internalCurrent;
      if (e.key === 'ArrowLeft') {
        const prev = Math.max(0, cur - 1);
        if (typeof index === 'number') onIndexChange && onIndexChange(prev);
        else setInternalCurrent(prev);
      }
      if (e.key === 'ArrowRight') {
        const next = Math.min(maxIndex, cur + 1);
        if (typeof index === 'number') onIndexChange && onIndexChange(next);
        else setInternalCurrent(next);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [maxIndex]);

  // notify parent when index changes
  useEffect(() => {
    if (typeof index !== 'number') {
      try { onIndexChange && onIndexChange(internalCurrent); } catch (e) {}
    }
  }, [internalCurrent, onIndexChange, index]);

  const goPrev = () => {
    const cur = typeof index === 'number' ? index : internalCurrent;
    const prev = Math.max(0, cur - 1);
    if (typeof index === 'number') onIndexChange && onIndexChange(prev);
    else setInternalCurrent(prev);
  };
  const goNext = () => {
    const cur = typeof index === 'number' ? index : internalCurrent;
    const next = Math.min(maxIndex, cur + 1);
    if (typeof index === 'number') onIndexChange && onIndexChange(next);
    else setInternalCurrent(next);
  };

  const effectiveCurrent = typeof index === 'number' ? index : internalCurrent;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`relative ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
      onTouchStart={() => pauseOnHover && setPaused(true)}
      onTouchEnd={() => pauseOnHover && setPaused(false)}
      onTouchMove={onTouchMove}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') goPrev(); if (e.key === 'ArrowRight') goNext(); }}
    >
      {showArrows && items.length > visibleCount && (
        <>
          <button aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow hover:scale-105 transition hidden sm:inline-flex" onClick={goPrev}>
            ‹
          </button>
          <button aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow hover:scale-105 transition hidden sm:inline-flex" onClick={goNext}>
            ›
          </button>
        </>
      )}

      <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${effectiveCurrent * (100 / visibleCount)}%)` }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
          {items.map((it, idx) => {
            const middleIndex = effectiveCurrent + Math.floor(visibleCount / 2);
            const isCenter = visibleCount === 3 && idx === middleIndex;
            return (
              <div key={idx} className={`flex-shrink-0 px-2 py-4 transition-transform duration-500`} style={{ flex: `0 0 ${100 / visibleCount}%` }}>
                {renderItem(it, idx, { isCenter })}
              </div>
            );
          })}
        </div>
      </div>

      {showDots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => (typeof index === 'number' ? onIndexChange && onIndexChange(i) : setInternalCurrent(i))}
              aria-label={`Go to slide ${i + 1}`}
              className={`rounded-full transition-transform duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                i === effectiveCurrent ? 'bg-emerald-500 scale-110 w-3 h-3' : 'bg-gray-300 hover:scale-105 w-2 h-2'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;

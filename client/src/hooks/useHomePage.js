import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for managing deferred rendering
 * Delays heavy components to improve initial page load
 */
export const useDeferredRender = (delay = 700) => {
  const [deferRender, setDeferRender] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const schedule = () => {
      if (mounted) setDeferRender(true);
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const idleId = window.requestIdleCallback(schedule, { timeout: delay });
        return () => {
          mounted = false;
          window.cancelIdleCallback?.(idleId);
        };
      } else {
        timeoutId = setTimeout(schedule, delay);
      }
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay]);

  return deferRender;
};

/**
 * Custom hook for managing Framer Motion loading
 * Loads motion library only when needed and user prefers animations
 */
export const useMotion = (deferRender, prefersReducedMotion) => {
  const [Motion, setMotion] = useState(null);

  useEffect(() => {
    if (!deferRender || prefersReducedMotion) return;

    let cancelled = false;
    let idleId = null;
    let timeoutId = null;

    const load = () => {
      import('framer-motion')
        .then((m) => {
          if (cancelled) return;
          const MotionObj = m.m || m.motion;
          if (MotionObj && typeof MotionObj === 'object' && MotionObj.div) {
            setMotion(MotionObj);
          } else {
            setMotion(null);
          }
        })
        .catch(() => {});
    };

    try {
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(load, { timeout: 800 });
      } else {
        timeoutId = setTimeout(load, 0);
      }
    } catch {
      timeoutId = setTimeout(load, 0);
    }

    return () => {
      cancelled = true;
      try {
        if (idleId && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleId);
        }
      } catch {}
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [deferRender, prefersReducedMotion]);

  return Motion;
};

/**
 * Custom hook for managing reduced motion preference
 */
export const usePrefersReducedMotion = () => {
  return useMemo(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch {
      return false;
    }
  }, []);
};

/**
 * Custom hook for managing scroll detection
 */
export const useScrollDetection = (threshold = 50) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
};
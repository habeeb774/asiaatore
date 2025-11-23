import React, { useEffect, useRef, useState } from 'react';

// SafeImage: keeps showing the last successfully loaded image while
// attempting to load new src values. Prevents visual flicker when
// the app briefly switches to an unavailable URL.
const DEFAULT_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23f5f5f5' width='100%25' height='100%25'/%3E%3Cpath fill='%23d4d4d8' d='M120 320h360a12 12 0 0 0 12-12V92a12 12 0 0 0-12-12H120a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12Zm36-48 72-96 96 128 60-80 96 128H156Z'/%3E%3Ctext x='50%25' y='92%25' font-size='36' fill='%239999a1' text-anchor='middle' font-family='system-ui,sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function SafeImage({ src, srcSet, sizes, alt, className = '', style = {}, loading = 'lazy', decoding = 'async', fetchPriority: fpCamel, fetchpriority: fpLower, ...rest }) {
  const normalizeSrc = (input) => {
    if (!input || typeof input !== 'string') return '';
    let s = input.trim();
    // Strip accidental /api prefix for static uploads
    if (s.startsWith('/api/uploads')) s = s.replace(/^\/api/, '');
    // Ensure leading slash for uploads paths like 'uploads/...'
    if (s.startsWith('uploads/')) s = '/' + s;
    // Expand placeholder shorthand like "600x400?text=..."
    if (/^\d{2,4}x\d{2,4}(\?.*)?$/.test(s)) {
      // Extract dimensions
      const [width, height] = s.split('x').map(n => parseInt(n.split('?')[0]));
      // Generate a local SVG placeholder instead of using external service
      const svgPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 600}' height='${height || 400}'%3E%3Crect fill='%23e5e7eb' width='100%25' height='100%25'/%3E%3Ctext fill='%239ca3af' font-family='system-ui,-apple-system,sans-serif' font-size='${Math.min(width || 600, height || 400) / 10}' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E${width || 600}x${height || 400}%3C/text%3E%3C/svg%3E`;
      return svgPlaceholder;
    }
    return s;
  };

  const initial = normalizeSrc(src);
  const [current, setCurrent] = useState(initial || DEFAULT_PLACEHOLDER);
  const lastGood = useRef(initial || DEFAULT_PLACEHOLDER);
  const pending = useRef(null);

  useEffect(() => {
    // When src is cleared, fall back to placeholder immediately
    if (!src) {
      lastGood.current = DEFAULT_PLACEHOLDER;
      setCurrent(DEFAULT_PLACEHOLDER);
      if (pending.current) {
        pending.current.onload = null;
        pending.current.onerror = null;
        pending.current = null;
      }
      return;
    }
    // if src is same as current, nothing to do
    const next = normalizeSrc(src);
    if (next === current) return;

    // cancel previous pending
    if (pending.current) {
      pending.current.onload = null;
      pending.current.onerror = null;
      pending.current = null;
    }

    const img = new Image();
    pending.current = img;
    img.onload = () => {
      lastGood.current = next;
      setCurrent(next);
      pending.current = null;
    };
    img.onerror = () => {
      // keep last good image (no change). If nothing has ever loaded, fall back
      // to a local asset (site logo) to avoid broken external-placeholder DNS.
      if (!lastGood.current) {
        lastGood.current = DEFAULT_PLACEHOLDER;
        setCurrent(DEFAULT_PLACEHOLDER);
      }
      pending.current = null;
    };
    // start loading
    img.src = next;

    // cleanup if unmounted
    return () => {
      if (pending.current) {
        pending.current.onload = null;
        pending.current.onerror = null;
        pending.current = null;
      }
    };
  }, [src, current]);

  // If nothing has loaded yet, try to show the plain src so browser can attempt
  // (useful for very first render). The component will update to lastGood when loaded.
  const shown = current || normalizeSrc(src) || DEFAULT_PLACEHOLDER;

  // React expects camelCase attribute: fetchPriority. Support both prop spellings for back-compat.
  const finalFetchPriority = fpCamel ?? fpLower ?? 'low';

  return (
    <img
      src={shown || undefined}
      srcSet={typeof srcSet !== 'undefined' ? (Array.isArray(srcSet) ? srcSet.join(', ') : srcSet) : undefined}
      sizes={sizes}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding={decoding}
      fetchPriority={finalFetchPriority}
      {...rest}
    />
  );
}

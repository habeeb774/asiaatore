import React, { useEffect, useRef, useState } from 'react';

// SafeImage: keeps showing the last successfully loaded image while
// attempting to load new src values. Prevents visual flicker when
// the app briefly switches to an unavailable URL.
export default function SafeImage({ src, alt, className = '', style = {}, loading = 'lazy', decoding = 'async', fetchPriority: fpCamel, fetchpriority: fpLower, ...rest }) {
  const normalizeSrc = (input) => {
    if (!input || typeof input !== 'string') return '';
    let s = input.trim();
    // Strip accidental /api prefix for static uploads
    if (s.startsWith('/api/uploads')) s = s.replace(/^\/api/, '');
    // Ensure leading slash for uploads paths like 'uploads/...'
    if (s.startsWith('uploads/')) s = '/' + s;
    // Expand placeholder shorthand like "600x400?text=..."
    if (/^\d{2,4}x\d{2,4}(\?.*)?$/.test(s)) s = `https://via.placeholder.com/${s}`;
    return s;
  };

  const initial = normalizeSrc(src);
  const [current, setCurrent] = useState(initial || '');
  const lastGood = useRef(initial || '');
  const pending = useRef(null);

  useEffect(() => {
    // if src is same as current, nothing to do
    if (!src) return;
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
        try {
          // Prefer a neutral product fallback image to indicate missing media
          lastGood.current = '/images/product-fallback.svg';
          setCurrent(lastGood.current);
        } catch {}
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
  const shown = current || normalizeSrc(src) || '';

  // React expects camelCase attribute: fetchPriority. Support both prop spellings for back-compat.
  const finalFetchPriority = fpCamel ?? fpLower ?? 'low';

  return (
    <img
      src={shown}
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

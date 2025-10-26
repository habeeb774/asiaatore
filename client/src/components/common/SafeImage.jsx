import React, { useEffect, useRef, useState } from 'react';

// SafeImage: keeps showing the last successfully loaded image while
// attempting to load new src values. Prevents visual flicker when
// the app briefly switches to an unavailable URL.
export default function SafeImage({ src, alt, className = '', style = {}, ...rest }) {
  const [current, setCurrent] = useState(src || '');
  const lastGood = useRef(src || '');
  const pending = useRef(null);

  useEffect(() => {
    // if src is same as current, nothing to do
    if (!src) return;
    if (src === current) return;

    // cancel previous pending
    if (pending.current) {
      pending.current.onload = null;
      pending.current.onerror = null;
      pending.current = null;
    }

    const img = new Image();
    pending.current = img;
    img.onload = () => {
      lastGood.current = src;
      setCurrent(src);
      pending.current = null;
    };
    img.onerror = () => {
      // keep last good image (no change)
      pending.current = null;
    };
    // start loading
    img.src = src;

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
  const shown = current || src || '';

  return (
    <img src={shown} alt={alt} className={className} style={style} {...rest} />
  );
}

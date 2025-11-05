import React from 'react';

/**
 * ViewportGate
 * Defer rendering children until the wrapper enters the viewport.
 * Props:
 *  - threshold: number (0..1) IntersectionObserver threshold, default 0.1
 *  - once: boolean, render only once then keep mounted, default true
 *  - rootMargin: string, IO rootMargin, default '0px'
 *  - className: string
 */
export default function ViewportGate({
  children,
  threshold = 0.1,
  once = true,
  rootMargin = '0px',
  className = ''
}) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible && once) return; // already shown
    if (typeof window === 'undefined' || !ref.current) return;
    if (!('IntersectionObserver' in window)) {
      // Fallback: render immediately
      setVisible(true);
      return;
    }
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin, visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : null}
    </div>
  );
}

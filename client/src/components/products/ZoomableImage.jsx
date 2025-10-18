import React from 'react';

// ZoomableImage: pinch-zoom + pan for mobile, wheel zoom supported on desktop
// Props: src, alt, className, onError, onZoomedChange(scale>1)
export default function ZoomableImage({ src, alt = '', className = '', onError, onZoomedChange, srcSet, sizes }) {
  const imgRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const stateRef = React.useRef({ scale: 1, x: 0, y: 0, start: null, pointer2: null, lastDist: 0, lastCenter: { x: 0, y: 0 } });
  const [scale, setScale] = React.useState(1);

  const applyTransform = () => {
    const { scale, x, y } = stateRef.current;
    const el = imgRef.current;
    if (!el) return;
    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const clampPos = (nx, ny) => {
    const wrap = wrapRef.current;
    const img = imgRef.current;
    if (!wrap || !img) return { x: nx, y: ny };
    const rect = wrap.getBoundingClientRect();
    const maxX = (rect.width * (stateRef.current.scale - 1)) / 2 + 24;
    const maxY = (rect.height * (stateRef.current.scale - 1)) / 2 + 24;
    return { x: Math.max(-maxX, Math.min(maxX, nx)), y: Math.max(-maxY, Math.min(maxY, ny)) };
  };

  const onPointerDown = (e) => {
    const st = stateRef.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (st.start && !st.pointer2) {
      st.pointer2 = { id: e.pointerId, x: e.clientX, y: e.clientY };
      st.lastDist = Math.hypot(st.pointer2.x - st.start.x, st.pointer2.y - st.start.y);
      st.lastCenter = { x: (st.pointer2.x + st.start.x) / 2, y: (st.pointer2.y + st.start.y) / 2 };
    } else if (!st.start) {
      st.start = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e) => {
    const st = stateRef.current;
    if (!st.start) return;
    if (st.pointer2) {
      // Pinch
      const p1 = st.start.id === e.pointerId ? { x: e.clientX, y: e.clientY } : { x: st.start.x, y: st.start.y };
      const p2 = st.pointer2.id === e.pointerId ? { x: e.clientX, y: e.clientY } : { x: st.pointer2.x, y: st.pointer2.y };
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const ds = dist / (st.lastDist || dist);
      let newScale = Math.max(1, Math.min(3, st.scale * ds));
      // Adjust translation to zoom around center
      const dx = center.x - st.lastCenter.x;
      const dy = center.y - st.lastCenter.y;
      let nx = st.x + dx;
      let ny = st.y + dy;
      st.scale = newScale; st.x = nx; st.y = ny; st.lastDist = dist; st.lastCenter = center;
      const bounded = clampPos(st.x, st.y); st.x = bounded.x; st.y = bounded.y;
      setScale(st.scale);
      applyTransform();
      onZoomedChange?.(st.scale > 1.01);
    } else {
      // Pan when zoomed
      if (st.scale > 1.01) {
        const dx = e.clientX - st.start.x;
        const dy = e.clientY - st.start.y;
        let nx = st.x + dx;
        let ny = st.y + dy;
        const bounded = clampPos(nx, ny); st.x = bounded.x; st.y = bounded.y;
        st.start.x = e.clientX; st.start.y = e.clientY;
        applyTransform();
      }
    }
  };

  const onPointerUp = (e) => {
    const st = stateRef.current;
    if (st.pointer2 && st.pointer2.id === e.pointerId) st.pointer2 = null;
    else if (st.start && st.start.id === e.pointerId) st.start = null;
    if (!st.pointer2 && !st.start && st.scale <= 1.02) {
      st.scale = 1; st.x = 0; st.y = 0; setScale(1); applyTransform(); onZoomedChange?.(false);
    }
  };

  // Double-tap to toggle zoom
  const lastTap = React.useRef(0);
  const onDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const st = stateRef.current;
      st.scale = st.scale > 1.01 ? 1 : 2;
      st.x = 0; st.y = 0; setScale(st.scale); applyTransform(); onZoomedChange?.(st.scale > 1.01);
    }
    lastTap.current = now;
  };

  // Wheel zoom (desktop)
  const onWheel = (e) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 40) return;
    e.preventDefault();
    const st = stateRef.current;
    const delta = -e.deltaY * 0.0015; // invert typical scroll
    const ns = Math.max(1, Math.min(3, st.scale * (1 + delta)));
    st.scale = ns; setScale(ns); applyTransform(); onZoomedChange?.(ns > 1.01);
  };

  // Reset on src change
  React.useEffect(() => {
    const st = stateRef.current; st.scale = 1; st.x = 0; st.y = 0; setScale(1);
    applyTransform(); onZoomedChange?.(false);
  }, [src]);

  return (
    <div
      ref={wrapRef}
      className={"relative overflow-hidden touch-none select-none " + className}
      style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onDoubleTap}
      onWheel={onWheel}
    >
  <img ref={imgRef} src={src} srcSet={srcSet} sizes={sizes} alt={alt} onError={onError} className="w-full h-full object-contain will-change-transform" />
      {/* optional scale indicator */}
      <span className="sr-only">Zoom level {scale.toFixed(2)}</span>
    </div>
  );
}

import React, { useEffect, useRef, useState, cloneElement } from 'react';
import { createPortal } from 'react-dom';

/**
 * Lightweight tooltip with portal to avoid parent overflow clipping.
 * Props:
 * - content: string | ReactNode
 * - placement: 'right' | 'left' | 'top' | 'bottom'
 * - offset: number (px)
 * - disabled: boolean
 */
export function Tooltip({ content, children, placement = 'right', offset = 8, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let top = rect.top + rect.height / 2;
    let left = rect.left + rect.width / 2;
    switch (placement) {
      case 'left':
        left = rect.left - offset;
        top = rect.top + rect.height / 2;
        break;
      case 'right':
        left = rect.right + offset;
        top = rect.top + rect.height / 2;
        break;
      case 'top':
        left = rect.left + rect.width / 2;
        top = rect.top - offset;
        break;
      case 'bottom':
        left = rect.left + rect.width / 2;
        top = rect.bottom + offset;
        break;
      default:
        break;
    }
    setPos({ top, left });
  };

  const handleOpen = () => {
    if (disabled) return;
    updatePosition();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const child = React.isValidElement(children)
    ? cloneElement(children, {
        ref: (node) => {
          // support existing ref on child
          if (typeof children.ref === 'function') children.ref(node);
          else if (children.ref) children.ref.current = node;
          triggerRef.current = node;
        },
        onMouseEnter: (e) => { children.props?.onMouseEnter?.(e); handleOpen(); },
        onMouseLeave: (e) => { children.props?.onMouseLeave?.(e); handleClose(); },
        onFocus: (e) => { children.props?.onFocus?.(e); handleOpen(); },
        onBlur: (e) => { children.props?.onBlur?.(e); handleClose(); },
        'aria-describedby': open ? 'tooltip' : undefined,
      })
    : children;

  useEffect(() => {
    if (!open || disabled) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, disabled]);

  return (
    <>
      {child}
      {mounted && open && !disabled && createPortal(
        <div
          role="tooltip"
          id="tooltip"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform:
              placement === 'right' ? 'translate(0, -50%)' :
              placement === 'left' ? 'translate(-100%, -50%)' :
              placement === 'top' ? 'translate(-50%, -100%)' :
              'translate(-50%, 0)',
            background: 'rgba(17,17,17,0.95)',
            color: '#fff',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            lineHeight: 1.2,
            pointerEvents: 'none',
            zIndex: 2000,
            boxShadow: '0 6px 18px rgba(0,0,0,.25)'
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}

export default Tooltip;

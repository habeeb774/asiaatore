import { useEffect, useRef } from 'react';

export default function useEventListener(eventName, handler, element = typeof window !== 'undefined' ? window : null, options) {
  const savedHandler = useRef();
  useEffect(() => { savedHandler.current = handler; }, [handler]);

  useEffect(() => {
    if (!element || !element.addEventListener) return;
    const eventListener = (event) => savedHandler.current && savedHandler.current(event);
    // By default, do NOT register passive listeners so that callers can safely
    // call `event.preventDefault()` from within handlers when needed. If the
    // caller wants a passive listener for performance reasons, they can pass
    // an `options` object (e.g., { passive: true }).
    const opts = typeof options !== 'undefined' ? options : { passive: false };
    element.addEventListener(eventName, eventListener, opts);
    return () => element.removeEventListener(eventName, eventListener, opts);
  }, [eventName, element, options]);
}

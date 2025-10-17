import { useEffect, useRef } from 'react';

export default function useEventListener(eventName, handler, element = typeof window !== 'undefined' ? window : null) {
  const savedHandler = useRef();
  useEffect(() => { savedHandler.current = handler; }, [handler]);

  useEffect(() => {
    if (!element || !element.addEventListener) return;
    const eventListener = (event) => savedHandler.current && savedHandler.current(event);
    element.addEventListener(eventName, eventListener);
    return () => element.removeEventListener(eventName, eventListener);
  }, [eventName, element]);
}

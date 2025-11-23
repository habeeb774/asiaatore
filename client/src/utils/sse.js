// Lightweight SSE client helper with reconnection
export function connectSse(path = '/api/events', onEvent = () => {}, opts = {}) {
  let es;
  let reconnectTimer = null;
  let retryCount = 0;
  const retryDelay = opts.retryDelay || 2000;

  function start() {
    try {
      es = new EventSource(path, { withCredentials: true });
    } catch {
      scheduleReconnect();
      return;
    }
    es.onopen = () => {
      retryCount = 0; // Reset retry count on successful connection
      if (opts.onOpen) opts.onOpen();
    };
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent('message', data, ev);
      } catch {
        onEvent('message', ev.data, ev);
      }
    };
    es.addEventListener('notification', (ev) => {
      try { onEvent('notification', JSON.parse(ev.data), ev); } catch { onEvent('notification', ev.data, ev); }
    });
    es.addEventListener('heartbeat', (ev) => {
      try { onEvent('heartbeat', JSON.parse(ev.data), ev); } catch { onEvent('heartbeat', ev.data, ev); }
    });
    es.onerror = (err) => {
      if (opts.onError) opts.onError(err);
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (opts.maxRetries && retryCount >= opts.maxRetries) {
      if (opts.onMaxRetries) opts.onMaxRetries();
      return;
    }
    // Exponential backoff with jitter
    const baseDelay = opts.retryDelay || 2000;
    const maxDelay = 30000;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;
    
    reconnectTimer = setTimeout(() => {
      retryCount++;
      start();
    }, delay);
  }

  function close() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    try { es && es.close(); } catch {}
  }

  start();
  return { close };
}

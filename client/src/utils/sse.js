// Lightweight SSE client helper with reconnection
export function connectSse(path = '/api/events', onEvent = () => {}, opts = {}) {
  let es;
  let reconnectTimer = null;
  const retryDelay = opts.retryDelay || 2000;

  function start() {
    try {
      es = new EventSource(path, { withCredentials: true });
    } catch (e) {
      scheduleReconnect();
      return;
    }
    es.onopen = () => {
      if (opts.onOpen) opts.onOpen();
    };
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onEvent('message', data, ev);
      } catch (e) {
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
    if (es) try { es.close(); } catch {}
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => { reconnectTimer = null; start(); }, retryDelay);
  }

  function close() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    try { es && es.close(); } catch {}
  }

  start();
  return { close };
}

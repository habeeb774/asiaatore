// Unified realtime hub: supports SSE now and optional WebSockets later
// Public API:
//  - registerSse(res, user)
//  - setupWebSocket(httpServer)
//  - broadcast(event, data, predicate?)
//  - emitOrderEvent(type, order)

const sseClients = new Set();
const wsClients = new Set(); // populated only if WS is enabled

function registerSse(res, user) {
  const client = { kind: 'sse', res, userId: user?.id || 'guest', role: user?.role || 'guest' };
  sseClients.add(client);
  res.on('close', () => sseClients.delete(client));
  return client;
}

function sseSend(res, event, data) {
  try {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch { /* ignore */ }
}

function broadcast(event, data, predicate) {
  // SSE
  for (const c of sseClients) {
    if (!predicate || predicate(c)) sseSend(c.res, event, data);
  }
  // WS
  for (const c of wsClients) {
    if (c.ws?.readyState === 1) { // OPEN
      if (!predicate || predicate(c)) {
        try { c.ws.send(JSON.stringify({ event, data })); } catch { /* ignore */ }
      }
    }
  }
}

function emitOrderEvent(type, order) {
  const payload = { type, orderId: order.id, userId: order.userId, status: order.status, at: new Date().toISOString() };
  broadcast(type, payload, (c) => c.role === 'admin' || c.userId === order.userId);
}

// Optional WebSocket setup (using 'ws') attached to existing HTTP server
async function setupWebSocket(httpServer) {
  try {
    const { WebSocketServer } = await import('ws');
    const wss = new WebSocketServer({ server: httpServer, path: '/api/events' });
    wss.on('connection', (ws, req) => {
      // Parse token/user from query later; for now trust attachUser-less WS and mark guest
      const url = new URL(req.url, 'http://localhost');
      const userId = url.searchParams.get('userId') || 'guest';
      const role = url.searchParams.get('role') || 'guest';
      const client = { kind: 'ws', ws, userId, role };
      wsClients.add(client);
      // greet
      try { ws.send(JSON.stringify({ event: 'hello', data: { ok: true, t: Date.now() } })); } catch {}
      ws.on('close', () => wsClients.delete(client));
      ws.on('error', () => wsClients.delete(client));
      // We do not handle client messages now; it's broadcast-only
    });
    // Heartbeat for WS (optional)
    setInterval(() => {
      for (const c of wsClients) {
        if (c.ws?.readyState === 1) {
          try { c.ws.send(JSON.stringify({ event: 'heartbeat', data: { t: Date.now() } })); } catch {}
        }
      }
    }, 25000);
    console.log('[Realtime] WebSocket server mounted at /api/events');
  } catch (e) {
    console.warn('[Realtime] WS setup skipped:', e.message);
  }
}

// SSE heartbeat
setInterval(() => broadcast('heartbeat', { t: Date.now() }), 25000);

export { registerSse, setupWebSocket, broadcast, emitOrderEvent };
export default { registerSse, setupWebSocket, broadcast, emitOrderEvent };

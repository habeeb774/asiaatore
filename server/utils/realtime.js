// Simple Server-Sent Events (SSE) broadcaster for real-time updates
// Usage:
//  - In server/index.js, mount GET /api/events to register clients
//  - In routes (e.g., orders), call emitOrderEvent('order.created', order)

const clients = new Set();

function addClient(res, user) {
  const client = { res, userId: user?.id || 'guest', role: user?.role || 'guest', ts: Date.now() };
  clients.add(client);
  res.on('close', () => clients.delete(client));
  return client;
}

function send(res, event, data) {
  try {
    if (event) res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // ignore write after end
  }
}

function broadcast(event, data, predicate) {
  for (const c of clients) {
    if (!predicate || predicate(c)) send(c.res, event, data);
  }
}

// Convenience: emit order events to the order owner and admins
function emitOrderEvent(type, order) {
  const payload = { type, orderId: order.id, userId: order.userId, status: order.status, at: new Date().toISOString() };
  broadcast(type, payload, (c) => c.role === 'admin' || c.userId === order.userId);
}

// Heartbeat to keep connections from idling out on some proxies
setInterval(() => {
  broadcast('heartbeat', { t: Date.now() });
}, 25000);

export { addClient, broadcast, emitOrderEvent };
export default { addClient, broadcast, emitOrderEvent };

import express from 'express';

const router = express.Router();

// Simple in-memory chat store for demo purposes.
// NOTE: This is ephemeral. For production, replace with a persistent store (Redis / DB)
const chats = new Map();

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

router.post('/chats', (req, res) => {
  const { orderId, userId, driverId } = req.body || {};
  const id = makeId();
  chats.set(id, { orderId: orderId || null, userId: userId || null, driverId: driverId || null, messages: [], clients: new Set() });
  res.json({ chatId: id });
});

router.get('/chats/:id/messages', (req, res) => {
  const id = req.params.id;
  const chat = chats.get(id);
  res.json({ messages: chat ? chat.messages : [] });
});

router.post('/chats/:id/messages', (req, res) => {
  const id = req.params.id;
  const chat = chats.get(id);
  if (!chat) return res.status(404).json({ error: 'CHAT_NOT_FOUND' });
  const { from = 'driver', text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'EMPTY_MESSAGE' });
  const msg = { id: makeId(), from, text: String(text), at: Date.now() };
  chat.messages.push(msg);
  // Broadcast to SSE clients
  for (const clientRes of chat.clients) {
    try {
      clientRes.write(`event: message\n`);
      clientRes.write(`data: ${JSON.stringify(msg)}\n\n`);
    } catch (e) {
      // ignore send errors
    }
  }
  res.json({ ok: true, message: msg });
});

// SSE stream for a chat
router.get('/chats/:id/stream', (req, res) => {
  const id = req.params.id;
  const chat = chats.get(id);
  if (!chat) return res.status(404).json({ error: 'CHAT_NOT_FOUND' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // send a handshake event
  res.write(`event: ready\n`);
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);

  chat.clients.add(res);

  req.on('close', () => {
    try { chat.clients.delete(res); } catch (e) {}
  });
});

export default router;

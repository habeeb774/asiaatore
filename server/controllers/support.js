import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createTicket, addMessage, listTickets, getTicket, updateTicketStatus } from '../modules/support/service.js';

// In-memory SSE rate limiting & tracking
const sseConnectionCounts = new Map(); // key=userId|ip -> count
const ticketStreams = new Map(); // ticketId -> Set<res>
const TICKET_MAX_SUBSCRIBERS = Number(process.env.SSE_TICKET_MAX_SUBSCRIBERS || 50);
const USER_MAX_CONNECTIONS = Number(process.env.SSE_USER_MAX_CONNECTIONS || 5);
function userKey(req){ return `${req.user?.id || 'guest'}|${req.ip}`; }
function canOpenSse(req, ticketId){
  const key = userKey(req);
  const current = sseConnectionCounts.get(key) || 0;
  if (current >= USER_MAX_CONNECTIONS) return { ok:false, code:429, error:'SSE_USER_LIMIT', message:'Too many active streams' };
  const subs = ticketStreams.get(ticketId);
  if (subs && subs.size >= TICKET_MAX_SUBSCRIBERS) return { ok:false, code:429, error:'SSE_TICKET_LIMIT', message:'Ticket subscriber limit reached' };
  return { ok:true, key };
}
function inc(key){ sseConnectionCounts.set(key, (sseConnectionCounts.get(key)||0)+1); }
function dec(key){ const v=(sseConnectionCounts.get(key)||0)-1; if(v<=0) sseConnectionCounts.delete(key); else sseConnectionCounts.set(key,v); }

// Preserve existing ephemeral chat (for delivery or real-time small rooms) while adding persistent support tickets
const router = express.Router();

// ---------------- Ephemeral Chat (legacy/demo) ----------------
const chats = new Map();
function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

router.post('/chats', (req, res) => {
  const { orderId, userId, driverId } = req.body || {};
  const id = makeId();
  chats.set(id, { orderId: orderId || null, userId: userId || null, driverId: driverId || null, messages: [], clients: new Set() });
  res.json({ ok: true, chatId: id });
});

router.get('/chats/:id/messages', (req, res) => {
  const chat = chats.get(req.params.id);
  res.json({ ok: true, messages: chat ? chat.messages : [] });
});

router.post('/chats/:id/messages', (req, res) => {
  const chat = chats.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'CHAT_NOT_FOUND' });
  const { from = 'driver', text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'EMPTY_MESSAGE' });
  const msg = { id: makeId(), from, text: String(text), at: Date.now() };
  chat.messages.push(msg);
  for (const clientRes of chat.clients) {
    try {
      clientRes.write('event: message\n');
      clientRes.write(`data: ${JSON.stringify(msg)}\n\n`);
    } catch {}
  }
  res.json({ ok: true, message: msg });
});

router.get('/chats/:id/stream', (req, res) => {
  const chat = chats.get(req.params.id);
  if (!chat) return res.status(404).json({ error: 'CHAT_NOT_FOUND' });
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write('event: ready\n');
  res.write(`data: ${JSON.stringify({ ok: true })}\n\n`);
  chat.clients.add(res);
  req.on('close', () => { try { chat.clients.delete(res); } catch {} });
});

// ---------------- Persistent Support Ticketing + SSE ----------------
// (ticketStreams moved above for rate limiting access)
router.post('/tickets', requireAuth, async (req, res) => {
  try {
    const { subject, type, orderId, message, priority } = req.body || {};
    if (!subject || subject.trim().length < 3) return res.status(400).json({ error: 'INVALID_SUBJECT' });
    const ticket = await createTicket({ userId: req.user.id, subject, type, orderId, message, priority });
    res.status(201).json({ ok: true, ticket });
  } catch (e) {
    res.status(500).json({ error: 'CREATE_TICKET_FAILED', message: e.message });
  }
});

router.get('/tickets', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const data = await listTickets({ user: req.user, page, limit });
    res.json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ error: 'LIST_TICKETS_FAILED', message: e.message });
  }
});

router.get('/tickets/:id', requireAuth, async (req, res) => {
  try {
    const ticket = await getTicket({ id: req.params.id, user: req.user });
    res.json({ ok: true, ticket });
  } catch (e) {
    const code = e.message === 'FORBIDDEN' ? 403 : 404;
    res.status(code).json({ error: e.message });
  }
});

router.post('/tickets/:id/messages', requireAuth, async (req, res) => {
  try {
    const { body } = req.body || {};
    if (!body || !body.trim()) return res.status(400).json({ error: 'EMPTY_BODY' });
    // Authorization handled in service via ticket ownership check
    const msg = await addMessage({ ticketId: req.params.id, userId: req.user.id, body, fromRole: req.user.role === 'admin' ? 'agent' : 'customer' });
    // Broadcast SSE event to ticket subscribers
    const subs = ticketStreams.get(req.params.id);
    if (subs) {
      for (const clientRes of subs) {
        try {
          clientRes.write('event: ticket_message\n');
          clientRes.write(`data: ${JSON.stringify({ ticketId: req.params.id, message: msg })}\n\n`);
        } catch {}
      }
    }
    res.status(201).json({ ok: true, message: msg });
  } catch (e) {
    const code = e.message === 'FORBIDDEN' ? 403 : e.message === 'TICKET_NOT_FOUND' ? 404 : 500;
    res.status(code).json({ error: e.message });
  }
});

router.patch('/tickets/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!['open','pending','resolved','closed'].includes(status)) return res.status(400).json({ error: 'INVALID_STATUS' });
    const updated = await updateTicketStatus({ id: req.params.id, status, user: req.user });
    // Broadcast status update
    const subs = ticketStreams.get(req.params.id);
    if (subs) {
      for (const clientRes of subs) {
        try {
          clientRes.write('event: ticket_status\n');
          clientRes.write(`data: ${JSON.stringify({ ticketId: req.params.id, status: updated.status })}\n\n`);
        } catch {}
      }
    }
    res.json({ ok: true, ticket: updated });
  } catch (e) {
    const code = e.message === 'FORBIDDEN' ? 403 : e.message === 'TICKET_NOT_FOUND' ? 404 : 500;
    res.status(code).json({ error: e.message });
  }
});

// SSE stream for ticket updates (messages + status)
router.get('/tickets/:id/stream', requireAuth, async (req, res) => {
  try {
    const ticket = await getTicket({ id: req.params.id, user: req.user });
    // Rate limit check
    const allow = canOpenSse(req, ticket.id);
    if (!allow.ok) return res.status(allow.code).json({ error: allow.error, message: allow.message });
    // setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    // initial snapshot
    res.write('event: ticket_init\n');
    res.write(`data: ${JSON.stringify({ ticketId: ticket.id, status: ticket.status, messages: ticket.messages })}\n\n`);
    let subs = ticketStreams.get(ticket.id);
    if (!subs) { subs = new Set(); ticketStreams.set(ticket.id, subs); }
    subs.add(res);
    inc(allow.key);
    // Heartbeat
    const heartbeatMs = Number(process.env.SSE_HEARTBEAT_MS || 25000);
    const heartbeat = setInterval(() => {
      try { res.write('event: ping\n'); res.write(`data: {"t":${Date.now()}}\n\n`); } catch {}
    }, heartbeatMs);
    req.on('close', () => { try { subs.delete(res); if (subs.size === 0) ticketStreams.delete(ticket.id); } catch {}; clearInterval(heartbeat); dec(allow.key); });
  } catch (e) {
    const code = e.message === 'FORBIDDEN' ? 403 : e.message === 'TICKET_NOT_FOUND' ? 404 : 500;
    res.status(code).json({ error: e.message });
  }
});

export default router;

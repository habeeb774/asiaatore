import { Router } from 'express';
import prisma from '../db/client.js';
import { broadcast } from '../utils/realtimeHub.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Ensure auth for chat endpoints
function requireAuth(req, res, next) {
  if (!req.user || req.user.id === 'guest') return res.status(401).json({ ok: false, error: 'UNAUTHENTICATED' });
  next();
}

// List threads for current user (or all for admin)
router.get('/threads', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    // ignore optional ?as param for now; schema is user-owned threads
    if (user.role === 'admin') {
      const threads = await prisma.chatThread.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 });
      return res.json({ ok: true, items: threads, threads });
    }
    const threads = await prisma.chatThread.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } });
    res.json({ ok: true, items: threads, threads });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'THREADS_LIST_FAILED', message: e.message });
  }
});

// Get messages for a thread
router.get('/threads/:id/messages', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
    if (!thread) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (user.role !== 'admin' && thread.userId !== user.id) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const messages = await prisma.chatMessage.findMany({ where: { threadId: thread.id }, orderBy: { createdAt: 'asc' } });
    res.json({ ok: true, messages });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'MESSAGES_LIST_FAILED', message: e.message });
  }
});

// Send a message in a given thread (Body: { content })
router.post('/threads/:id/messages', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const threadId = req.params.id;
    const { content } = req.body || {};
    if (!content || !String(content).trim()) return res.status(400).json({ ok: false, error: 'EMPTY_MESSAGE' });
    const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    if (user.role !== 'admin' && thread.userId !== user.id) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    const msg = await prisma.chatMessage.create({ data: { threadId, fromId: user.id, fromName: user.name || user.email, text: String(content).trim() } });
    await prisma.chatThread.update({ where: { id: threadId }, data: { updatedAt: new Date() } });
    const payload = { threadId, message: { id: msg.id, fromId: msg.fromId, fromName: msg.fromName, text: msg.text, ts: msg.createdAt } };
    broadcast('chat.message', payload, (c) => c.role === 'admin' || c.userId === thread.userId);
    res.status(201).json({ ok: true, message: payload.message });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'MESSAGE_CREATE_FAILED', message: e.message });
  }
});

// Send message (auto-create thread if missing) — Body: { threadId?, text }
router.post('/send', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { threadId, text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ ok: false, error: 'MISSING_TEXT' });
    let thread = null;
    if (threadId) {
      thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
      if (!thread) return res.status(404).json({ ok: false, error: 'THREAD_NOT_FOUND' });
      if (user.role !== 'admin' && thread.userId !== user.id) return res.status(403).json({ ok: false, error: 'FORBIDDEN' });
    } else {
      thread = await prisma.chatThread.create({ data: { userId: user.id, title: `دردشة ${user.name || user.email}` } });
    }
    const msg = await prisma.chatMessage.create({ data: { threadId: thread.id, fromId: user.id, fromName: user.name || user.email, text: String(text).trim() } });
    await prisma.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    const payload = { threadId: thread.id, message: { id: msg.id, fromId: msg.fromId, fromName: msg.fromName, text: msg.text, ts: msg.createdAt } };
    broadcast('chat.message', payload, (c) => c.role === 'admin' || c.userId === thread.userId);
    res.json({ ok: true, threadId: thread.id, message: payload.message });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'SEND_FAILED', message: e.message });
  }
});

// Admin: reply to a thread
router.post('/admin/threads/:id/reply', requireAdmin, async (req, res) => {
  try {
    const admin = req.user;
    const { text } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ ok: false, error: 'MISSING_TEXT' });
    const thread = await prisma.chatThread.findUnique({ where: { id: req.params.id } });
    if (!thread) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const msg = await prisma.chatMessage.create({ data: { threadId: thread.id, fromId: admin.id, fromName: admin.name || admin.email, text: String(text).trim() } });
    await prisma.chatThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
    const payload = { threadId: thread.id, message: { id: msg.id, fromId: msg.fromId, fromName: msg.fromName, text: msg.text, ts: msg.createdAt } };
    broadcast('chat.message', payload, (c) => c.role === 'admin' || c.userId === thread.userId);
    res.json({ ok: true, message: payload.message });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'ADMIN_REPLY_FAILED', message: e.message });
  }
});

export default router;

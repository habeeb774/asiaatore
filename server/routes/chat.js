import { Router } from 'express';
import prisma from '../db/client.js';
import { broadcast } from '../utils/realtimeHub.js';

const router = Router();

// Helper to ensure user is authenticated
function requireAuth(req, res, next) {
  if (!req.user || req.user.id === 'guest') return res.status(401).json({ error: 'UNAUTHENTICATED' });
  next();
}

// Create or get a thread between current user and a counterpart
// Supported bodies:
//  - Buyer ↔ Seller: { sellerId, productId?, orderId? }
//  - Buyer ↔ Driver: { driverId, orderId }
router.post('/threads', requireAuth, async (req, res) => {
  try {
    if (!prisma?.chatThread || !prisma?.chatMessage) {
      return res.status(503).json({ ok: false, error: 'CHAT_SCHEMA_MISSING', message: 'Prisma client missing Chat models. Run: npx prisma generate && npx prisma db push' });
    }
    const caller = req.user;
    let buyerId = caller.id;
    let { sellerId = null, driverId = null, productId = null, orderId = null, buyerId: buyerIdBody = null } = req.body || {};
    // If driver is calling and no explicit driverId was provided, use caller id
    if (!driverId && caller.role === 'delivery') driverId = caller.id;
    // If caller is driver/admin and orderId provided, resolve buyerId from order
    if ((caller.role === 'delivery' || caller.role === 'admin') && orderId && (!buyerIdBody)) {
      try {
        const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
        if (order?.userId) buyerId = order.userId;
      } catch {}
    }
    if (buyerIdBody) buyerId = buyerIdBody; // explicit override when provided
    let thread = null;
    if (driverId) {
      if (!orderId) return res.status(400).json({ error: 'MISSING_ORDER_ID' });
      // Buyer-driver unique thread per order
      thread = await prisma.chatThread.findUnique({
        where: { buyerId_driverId_orderId: { buyerId, driverId, orderId } },
      }).catch(() => null);
      if (!thread) {
        thread = await prisma.chatThread.create({ data: { buyerId, driverId, orderId } });
      }
    } else {
      if (!sellerId) return res.status(400).json({ error: 'MISSING_SELLER_ID' });
      // Upsert a unique thread by buyer/seller/context
      thread = await prisma.chatThread.findUnique({
        where: { buyerId_sellerId_productId_orderId: { buyerId, sellerId, productId, orderId } },
      }).catch(() => null);
      if (!thread) {
        thread = await prisma.chatThread.create({ data: { buyerId, sellerId, productId, orderId } });
      }
    }
    return res.json({ ok: true, thread });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'THREAD_CREATE_FAILED', message: e.message });
  }
});

// List threads for current user (buyer or seller)
router.get('/threads', requireAuth, async (req, res) => {
  try {
    if (!prisma?.chatThread) {
      return res.status(503).json({ ok: false, error: 'CHAT_SCHEMA_MISSING' });
    }
    const user = req.user;
    const as = String(req.query.as || 'buyer'); // 'buyer' | 'seller' | 'delivery'
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize || '20', 10)));
    let where;
    if (as === 'seller') {
      where = { seller: { userId: user.id }, deletedAt: null };
    } else if (as === 'delivery') {
      where = { driverId: user.id, deletedAt: null };
    } else {
      where = { buyerId: user.id, deletedAt: null };
    }
    const [items, total] = await Promise.all([
      prisma.chatThread.findMany({ where, orderBy: { lastMessageAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }),
      prisma.chatThread.count({ where }),
    ]);
    res.json({ ok: true, items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'THREAD_LIST_FAILED', message: e.message });
  }
});

// Get messages in a thread; marks as read for the current side
router.get('/threads/:id/messages', requireAuth, async (req, res) => {
  try {
    if (!prisma?.chatThread || !prisma?.chatMessage) {
      return res.status(503).json({ ok: false, error: 'CHAT_SCHEMA_MISSING' });
    }
    const user = req.user;
    const threadId = req.params.id;
    const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, include: { seller: true } });
    if (!thread) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
  const isBuyer = thread.buyerId === user.id;
  const isSeller = thread.seller?.userId === user.id;
  const isDriver = thread.driverId && thread.driverId === user.id;
  if (!isBuyer && !isSeller && !isDriver && user.role !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const messages = await prisma.chatMessage.findMany({ where: { threadId, deletedAt: null }, orderBy: { createdAt: 'asc' } });
    // Mark as read
    if (isBuyer) {
      await prisma.chatThread.update({ where: { id: threadId }, data: { buyerUnread: 0 } });
    } else if (isSeller) {
      await prisma.chatThread.update({ where: { id: threadId }, data: { sellerUnread: 0 } });
    }
    res.json({ ok: true, messages });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'MESSAGE_LIST_FAILED', message: e.message });
  }
});

// Send a message in a thread
// Body: { content }
router.post('/threads/:id/messages', requireAuth, async (req, res) => {
  try {
    if (!prisma?.chatThread || !prisma?.chatMessage) {
      return res.status(503).json({ ok: false, error: 'CHAT_SCHEMA_MISSING' });
    }
    const user = req.user;
    const threadId = req.params.id;
  const { content } = req.body || {};
    if (!content || !content.trim()) return res.status(400).json({ ok: false, error: 'EMPTY_MESSAGE' });
    const thread = await prisma.chatThread.findUnique({ where: { id: threadId }, include: { seller: true } });
    if (!thread) return res.status(404).json({ ok: false, error: 'NOT_FOUND' });
    const isBuyer = thread.buyerId === user.id;
    const isSeller = thread.seller?.userId === user.id;
    const isDriver = thread.driverId && thread.driverId === user.id;
    if (!isBuyer && !isSeller && !isDriver && user.role !== 'admin') return res.status(403).json({ ok: false, error: 'FORBIDDEN' });

    const role = isBuyer ? 'buyer' : (isSeller ? 'seller' : (isDriver ? 'delivery' : 'buyer'));
    const msg = await prisma.chatMessage.create({ data: { threadId, senderId: user.id, role, content: content.trim() } });
    // Update thread unread counters and last message
    await prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: new Date(),
        lastMessage: msg.content,
        buyerUnread: role === 'seller' || role === 'delivery' ? { increment: 1 } : undefined,
        sellerUnread: role === 'buyer' ? { increment: 1 } : undefined,
      },
    });
    // Broadcast realtime event to participants
    broadcast('chat.message', { threadId, message: { ...msg, mine: true } }, (c) => c.userId === thread.buyerId || c.userId === thread.seller?.userId || c.userId === thread.driverId || c.role === 'admin');
    res.status(201).json({ ok: true, message: msg });
  } catch (e) {
    res.status(400).json({ ok: false, error: 'MESSAGE_CREATE_FAILED', message: e.message });
  }
});

export default router;

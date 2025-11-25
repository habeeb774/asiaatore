import prisma from '../../db/client.js';
import { audit } from '../../utils/audit.js';

export async function createTicket({ userId, subject, type, orderId, message, priority }) {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject: subject.trim(),
      type: type || 'general',
      orderId: orderId || null,
      priority: priority || 'normal',
      messages: message ? { create: [{ body: message.trim(), userId, fromRole: 'customer' }] } : undefined,
    },
    include: { messages: true }
  });
  await audit({ action: 'support_ticket_created', entity: 'supportTicket', entityId: ticket.id, userId, meta: { type, orderId } });
  return ticket;
}

export async function addMessage({ ticketId, userId, body, fromRole }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('TICKET_NOT_FOUND');
  const msg = await prisma.supportMessage.create({
    data: { ticketId, userId: userId || null, body: body.trim(), fromRole: fromRole || (userId ? 'customer' : 'agent') }
  });
  await audit({ action: 'support_message_added', entity: 'supportTicket', entityId: ticketId, userId, meta: { messageId: msg.id } });
  return msg;
}

export async function listTickets({ user, page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;
  const where = user.role === 'admin' ? {} : { userId: user.id };
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.supportTicket.count({ where })
  ]);
  return { tickets, page, pages: Math.ceil(total / limit), total };
}

export async function getTicket({ id, user }) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  if (!ticket) throw new Error('TICKET_NOT_FOUND');
  if (user.role !== 'admin' && ticket.userId !== user.id) throw new Error('FORBIDDEN');
  return ticket;
}

export async function updateTicketStatus({ id, status, user }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) throw new Error('TICKET_NOT_FOUND');
  if (user.role !== 'admin' && ticket.userId !== user.id) throw new Error('FORBIDDEN');
  const updated = await prisma.supportTicket.update({ where: { id }, data: { status } });
  await audit({ action: 'support_ticket_status_updated', entity: 'supportTicket', entityId: id, userId: user.id, meta: { status } });
  return updated;
}

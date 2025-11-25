import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(3),
  type: z.string().optional(),
  orderId: z.string().optional(),
  message: z.string().min(1).optional(),
  priority: z.string().optional()
});

export const addMessageSchema = z.object({
  body: z.string().min(1),
  fromRole: z.string().optional()
});

export const updateStatusSchema = z.object({
  status: z.enum(['open','pending','resolved','closed'])
});

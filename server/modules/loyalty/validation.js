import { z } from 'zod';

export const addPointsSchema = z.object({
  userId: z.string().uuid(),
  delta: z.number().int(),
  source: z.string().optional(),
  orderId: z.string().uuid().optional()
});

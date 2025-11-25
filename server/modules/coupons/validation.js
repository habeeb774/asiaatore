import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().min(3).max(32),
  type: z.enum(['percent','fixed']),
  value: z.number().positive(),
  maxUses: z.number().int().positive().optional(),
  userLimit: z.number().int().positive().optional(),
  minSubtotal: z.number().positive().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  active: z.boolean().optional()
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().nonnegative().default(0)
});

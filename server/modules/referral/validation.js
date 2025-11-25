import { z } from 'zod';

export const claimReferralSchema = z.object({
  code: z.string().min(4).max(16)
});

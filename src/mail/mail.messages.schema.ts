import { z } from 'zod';

export const verificationCodeMessage = z.object({
  email: z.string().email(),
  code: z.string(),
  timestamp: z.number(),
});

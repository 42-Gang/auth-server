// mail verification request schema
import { z } from 'zod';
import { createResponseSchema } from '../../../common/schema/core.schema.js';

export const requestVerificationCodeInputSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email(),
});

// mail verification response schema
export const requestVerificationCodeResponseSchema = createResponseSchema(z.undefined());

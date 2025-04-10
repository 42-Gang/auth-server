// signup request schema
import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

export const signupInputSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email(),
  nickname: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(3)
    .max(20),
  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  }),
  mailVerificationCode: z.string(),
});

// signup response schema
export const signupResponseSchema = createResponseSchema(z.any());

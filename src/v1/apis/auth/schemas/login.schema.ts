import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

// login request schema
export const loginInputSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email(),
  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  }),
});

export const loginServiceResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.date(),
});

export const loginResponseSchema = createResponseSchema(
  z.object({
    accessToken: z.string(),
  }),
);

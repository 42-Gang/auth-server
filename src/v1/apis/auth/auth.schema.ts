import { z } from 'zod';

import { createResponseSchema } from '../../common/schema/core.schema.js';

// login request schema
export const loginRequestSchema = z.object({
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

// login response schema

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

// signup request schema
export const signupRequestSchema = z.object({
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

// mail verification request schema
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

import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

export const handleOAuthFlowResponseSchema = createResponseSchema(
  z.object({
    accessToken: z.string(),
  }),
);

export const oauthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.date(),
});

export const handleOAuthFlowBodySchema = z.union([
  z.object({ code: z.string(), state: z.string() }),
  z.object({ error: z.string(), state: z.string() }),
]);

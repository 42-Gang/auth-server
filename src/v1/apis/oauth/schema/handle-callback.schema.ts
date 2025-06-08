import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

export const handleCallbackResponseSchema = createResponseSchema(
  z.object({
    accessToken: z.string(),
  }),
);

export const oauthTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.date(),
});

export type OAuthTokenResponseType = z.infer<typeof oauthTokenResponseSchema>;

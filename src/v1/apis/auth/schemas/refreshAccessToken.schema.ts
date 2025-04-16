import { createResponseSchema } from '../../../common/schema/core.schema.js';
import { z } from 'zod';

export const refreshAccessTokenResponseSchema = createResponseSchema(
  z.object({
    refreshToken: z.string(),
  }),
);

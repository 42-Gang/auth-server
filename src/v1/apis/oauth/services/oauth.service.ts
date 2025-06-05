import { TypeOf, z } from 'zod';
import { HandleCallbackBodyType } from '../schema/handle-callback.schema.js';

export interface OAuthCredentials {
  accessToken: string;
  scope?: string;
}

export const handleCallbackInputSchema = z.object({
  state: z.string(),
  code: z.string(),
});

export const handleCallbackResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.date(),
});

export type HandleCallbackResponseType = TypeOf<typeof handleCallbackResponseSchema>;

export type HandleCallbackInputType = TypeOf<typeof handleCallbackInputSchema>;

export interface OAuthService {
  readonly provider: string;

  getLoginUrl(): Promise<string>;

  handleCallback(input: HandleCallbackBodyType): Promise<HandleCallbackResponseType>;
}

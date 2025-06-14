import { TypeOf, z } from 'zod';

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

  getAuthUrl(redirectUri: string): Promise<string>;

  handleCallback(input: HandleCallbackInputType): Promise<HandleCallbackResponseType>;
}

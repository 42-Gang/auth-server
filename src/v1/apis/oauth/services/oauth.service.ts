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
});

export type HandleCallbackResponseType = TypeOf<typeof handleCallbackResponseSchema>;

export type HandleCallbackInputType = TypeOf<typeof handleCallbackInputSchema>;

export interface OAuthService {
  readonly provider: string;

  getLoginUrl(): Promise<string>;

  handleCallback(input: HandleCallbackInputType): Promise<HandleCallbackResponseType>;
}

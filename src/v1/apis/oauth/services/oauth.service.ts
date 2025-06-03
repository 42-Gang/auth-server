import { HandleOAuthRequest, OAuthTokenResponseType } from '../oauth.schema.js';

export interface OAuthCredentials {
  accessToken: string;
  scope?: string;
}

export interface OAuthService {
  getAuthorizationUrl(): Promise<string>;
  handleOAuthFlow(parsed: HandleOAuthRequest): Promise<OAuthTokenResponseType>;
}

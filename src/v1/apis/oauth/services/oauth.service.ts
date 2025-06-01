import { OAuthProvider } from "@prisma/client";
import { OAuthUserInfoType } from "../oauth.schema.js";

export interface OAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
}

export interface OAuthService {
  getAuthorizationUrl(): Promise<string>;
  getAccessToken(code: string): Promise<OAuthCredentials>;
  getUserInfo(tokens: OAuthCredentials): Promise<OAuthUserInfoType>;
  checkUserExists(userInfo: OAuthUserInfoType): Promise<number | null>;
  getProviderName(): Promise<OAuthProvider>;
  handleOAuthFlow(): Promise<OAuthUserInfoType | null>;
}

import { OAuthProvider } from "@prisma/client";
import { OAuthUserInfoType } from "../oauth.schema.js";

export interface OAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  [key: string]: any;
}

export interface OAuthService {
  getAuthorizationUrl(state: string): string;
  getAccessToken(code: string): Promise<OAuthCredentials>;
  getUserInfo(tokens: OAuthCredentials): Promise<OAuthUserInfoType>;
  checkUserExists(userInfo: OAuthUserInfoType): Promise<number | null>;
  oauthLogin(userId: number, userInfo: OAuthUserInfoType): Promise<any>;
  oauthSignUp(userInfo: OAuthUserInfoType): Promise<any>;
  getProviderName(): OAuthProvider;
  handleOAuthFlow(): Promise<OAuthUserInfoType | null>;
}

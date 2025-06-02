import { OAuthProvider } from "@prisma/client";
import { HandleOAuthRequest, OAuthTokenResponseType, OAuthUserInfoType } from "../oauth.schema.js";

export interface OAuthCredentials {
  accessToken: string;
  scope?: string;
}

export interface OAuthService {
  getAuthorizationUrl(): Promise<string>;
  handleOAuthFlow(parsed: HandleOAuthRequest): Promise<OAuthTokenResponseType>;
  // getCredentials(code: string): Promise<OAuthCredentials>;
  // getUserInfo(tokens: OAuthCredentials): Promise<OAuthUserInfoType>;
  // checkOAuthUserExists(userInfo: OAuthUserInfoType): Promise<number | null>;
  // checkGeneralUserExists(userInfo: OAuthUserInfoType): Promise<number | null>;
  // getProviderName(): Promise<OAuthProvider>;
  // oauthLogin(userId: number, userInfo: OAuthUserInfoType): Promise<OAuthTokenResponseType>;
  // oauthSignup(userInfo: OAuthUserInfoType): Promise<OAuthTokenResponseType>
}

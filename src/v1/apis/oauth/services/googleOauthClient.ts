import { Credentials, OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import {
  BadRequestException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
import { OAuthUserInfoSchema } from '../schema/oauth.schema.js';

export default class GoogleOauthClient {
  private readonly oAuthScopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  constructor(
    private readonly googleClientId: string,
    private readonly googleClientSecret: string,
  ) {
    if (!googleClientId || !googleClientSecret) {
      throw new BadRequestException('구글 OAuth 클라이언트 설정이 올바르지 않습니다.');
    }
  }

  public generateAuthUrl(client: OAuth2Client, state: string) {
    return client.generateAuthUrl({
      access_type: 'online',
      scope: this.oAuthScopes,
      state: state,
    });
  }

  private validateScopes(scopes: string[]) {
    for (const requiredScope of this.oAuthScopes) {
      if (!scopes.includes(requiredScope)) {
        throw new UnAuthorizedException(`Missing required scope: ${requiredScope}`);
      }
    }
  }

  public getClient(redirectUri?: string) {
    return new google.auth.OAuth2(
      this.googleClientId,
      this.googleClientSecret,
      redirectUri
    );
  }

  public async getTokens(client: OAuth2Client, code: string) {
    const tokenResponse = await client.getToken(code);
    if (!tokenResponse.tokens || !tokenResponse.tokens.access_token) {
      throw new UnAuthorizedException('Failed to retrieve access token from Google OAuth.');
    }
    return tokenResponse.tokens;
  }

  public async setCredentials(client: OAuth2Client, tokens: Credentials) {
    client.setCredentials(tokens);
  }

  public validateTokens(tokens: Credentials) {
    const { access_token, scope } = tokens;
    if (!scope) {
      throw new BadRequestException('구글 OAuth 인증에 실패했습니다. scope가 없습니다.');
    }
    this.validateScopes(scope.split(' '));
    if (!access_token) {
      throw new BadRequestException('구글 OAuth 인증에 실패했습니다. 다시 시도해주세요.');
    }
  }

  public async getUserInfo(client: OAuth2Client) {
    const userInfoResponse = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });
    const result = OAuthUserInfoSchema.safeParse(userInfoResponse.data);
    if (!result.success) {
      throw new BadRequestException('사용자 정보를 가져오는 데 실패했습니다.');
    }

    return result.data;
  }
}

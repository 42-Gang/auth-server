import { OAuthRepositoryInterface } from '../../../storage/database/interfaces/oauth.repository.interface.js';
import {
  HandleCallbackInputType,
  HandleCallbackResponseType,
  OAuthService,
} from './oauth.service.js';
import TokenService from '../../auth/services/token.service.js';
import { google } from 'googleapis';
import { OAuthProvider } from '@prisma/client';
import {
  BadRequestException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
import OAuthUserService from './oauth.user.service.js';
import { FastifyBaseLogger } from 'fastify';
import { OAuth2Client } from 'google-auth-library';
import OAuthCacheRepository from '../../../storage/cache/oauth.cache.repository.js';
import {
  oauthProviderSchema,
  OAuthUserInfoSchema,
  OAuthUserInfoType,
} from '../schema/oauth.schema.js';
import * as crypto from 'node:crypto';
import { OAuthTokenResponseType } from '../schema/handle-oauth-flow.schema.js';

export default class GoogleOauthService implements OAuthService {
  constructor(
    private readonly oauthRepository: OAuthRepositoryInterface,
    private readonly oauthCacheRepository: OAuthCacheRepository,
    private readonly tokenService: TokenService,
    private readonly oauthUserService: OAuthUserService,
    private readonly logger: FastifyBaseLogger,
    private readonly googleClientId: string,
    private readonly googleClientSecret: string,
    private readonly redirectUrl: string,
  ) {}

  readonly provider = oauthProviderSchema.enum.GOOGLE;
  private readonly oAuthScopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  async getLoginUrl(): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    await this.oauthCacheRepository.setState(this.provider, state);

    const client = this.createOAuthClient();
    return this.getGenerateLoginUrl(client, state);
  }

  private getGenerateLoginUrl(client: OAuth2Client, state: string) {
    return client.generateAuthUrl({
      access_type: 'online',
      scope: this.oAuthScopes,
      state: state,
    });
  }

  private createOAuthClient() {
    return new google.auth.OAuth2(this.googleClientId, this.googleClientSecret, this.redirectUrl);
  }

  async handleCallback({
    code,
    state,
  }: HandleCallbackInputType): Promise<HandleCallbackResponseType> {
    const client = this.createOAuthClient();

    if (!(await this.oauthCacheRepository.isExistsState(this.provider, state))) {
      throw new UnAuthorizedException('유효하지 않은 또는 만료된 state 파라미터입니다.');
    }

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    if (!tokens || !tokens.access_token) {
      throw new BadRequestException('구글 OAuth 인증에 실패했습니다. 다시 시도해주세요.');
    }

    const { access_token, scope } = tokens;
    if (!access_token) {
      throw new BadRequestException('구글 OAuth 인증에 실패했습니다. 다시 시도해주세요.');
    }
    if (!scope) {
      throw new BadRequestException('구글 OAuth 인증에 실패했습니다. scope가 없습니다.');
    }

    for (const requiredScope of this.oAuthScopes) {
      if (!scope.includes(requiredScope)) {
        throw new UnAuthorizedException(
          `구글 사용자 정보에 접근할 권한이 없습니다. 필요한 권한: ${requiredScope}`,
        );
      }
    }

    const userInfoResponse = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });
    const result = OAuthUserInfoSchema.safeParse(userInfoResponse.data);
    if (!result.success) {
      throw new BadRequestException('사용자 정보를 가져오는 데 실패했습니다.');
    }

    const oauth = await this.oauthRepository.findByProviderAndProviderId(
      this.provider,
      result.data.id,
    );
    if (oauth) {
      return await this.generateAccessToken(oauth.userId);
    }

    const userInfo = result.data;
    const userId = await this.checkOAuthUserExists(userInfo);
    if (userId) {
      return await this.generateAccessToken(userId);
    }

    const user = await this.oauthUserService.getOAuthUserByEmail({
      email: userInfo.email,
      nickname: userInfo.name,
    });
    if (user.exists && user.userId) {
      await this.oauthRepository.create({
        provider: this.provider,
        providerUserId: userInfo.id,
        userId: user.userId,
      });
      return await this.generateAccessToken(user.userId); // 일반 사용자로 존재하는 경우
    }

    const newUser = await this.oauthUserService.createOAuthUser({
      email: userInfo.email,
      nickname: userInfo.name,
    });
    if (!newUser) {
      throw new BadRequestException('사용자 생성에 실패했습니다. 다시 시도해주세요.');
    }
    await this.oauthRepository.create({
      provider: await this.getProviderName(),
      providerUserId: userInfo.id,
      userId: newUser.userId,
    });
    return await this.generateAccessToken(newUser.userId);
  }

  private async checkOAuthUserExists(userInfo: OAuthUserInfoType): Promise<number | null> {
    const provider = await this.getProviderName();
    const oauthUser = await this.oauthRepository.findByProviderAndProviderId(provider, userInfo.id);
    if (oauthUser) {
      return oauthUser.userId;
    }
    return null;
  }

  private async getProviderName(): Promise<OAuthProvider> {
    return OAuthProvider.GOOGLE;
  }

  private async generateAccessToken(userId: number): Promise<OAuthTokenResponseType> {
    await this.tokenService.expireRefreshTokens(userId);
    const tokens = await this.tokenService.generateTokens(userId);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    };
  }
}

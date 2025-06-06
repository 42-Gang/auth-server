import { OAuthRepositoryInterface } from '../../../storage/database/interfaces/oauth.repository.interface.js';
import {
  HandleCallbackInputType,
  HandleCallbackResponseType,
  OAuthService,
} from './oauth.service.js';
import TokenService from '../../auth/services/token.service.js';
import {
  BadRequestException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
import OAuthUserService from './oauth.user.service.js';
import OAuthCacheRepository from '../../../storage/cache/oauth.cache.repository.js';
import {
  oauthProviderSchema,
  OAuthUserInfoSchema,
  OAuthUserInfoType,
} from '../schema/oauth.schema.js';
import { OAuthTokenResponseType } from '../schema/handle-callback.schema.js';
import * as crypto from 'node:crypto';
import GoogleOauthClient from './googleOauthClient.js';
import { OAuth2Client } from 'google-auth-library';

export default class GoogleOauthService implements OAuthService {
  constructor(
    private readonly oauthRepository: OAuthRepositoryInterface,
    private readonly oauthCacheRepository: OAuthCacheRepository,
    private readonly tokenService: TokenService,
    private readonly oauthUserService: OAuthUserService,
    private readonly googleOauthClient: GoogleOauthClient,
  ) {}

  readonly provider = oauthProviderSchema.enum.GOOGLE;

  async getAuthUrl(): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    await this.oauthCacheRepository.setState(this.provider, state);
    const client = this.googleOauthClient.getClient();
    return this.googleOauthClient.generateAuthUrl(client, state);
  }

  async handleCallback({
    code,
    state,
  }: HandleCallbackInputType): Promise<HandleCallbackResponseType> {
    await this.validateState(state);
    const client = this.googleOauthClient.getClient();
    const googleTokens = await this.exchangeGoogleTokens(client, code);
    this.googleOauthClient.validateTokens(googleTokens);
    await this.googleOauthClient.setCredentials(client, googleTokens);
    const userInfo = await this.fetchUserInfo(client);
    const userId = await this.findOrCreateUserRecord(userInfo);
    return this.generateAccessToken(userId);
  }

  private async validateState(state: string): Promise<void> {
    const exists = await this.oauthCacheRepository.isExistsState(this.provider, state);
    if (!exists) {
      throw new UnAuthorizedException(`유효하지 않은 또는 만료된 state 파라미터입니다. ${this.provider}`);
    }
  }

  private async exchangeGoogleTokens(client: OAuth2Client, code: string) {
    return this.googleOauthClient.getTokens(client, code);
  }

  private async fetchUserInfo(client: OAuth2Client): Promise<OAuthUserInfoType> {
    const rawUserInfo = await this.googleOauthClient.getUserInfo(client);
    return OAuthUserInfoSchema.parse(rawUserInfo);
  }

  private async findOrCreateUserRecord(userInfo: OAuthUserInfoType): Promise<number> {
    const existingOauth = await this.oauthRepository.findByProviderAndProviderId(
      this.provider,
      userInfo.id,
    );
    if (existingOauth) {
      return existingOauth.userId;
    }

    const maybeUser = await this.oauthUserService.getOAuthUserByEmail({
      email: userInfo.email,
      nickname: userInfo.name,
    });

    if (maybeUser.exists && maybeUser.userId) {
      await this.oauthRepository.create({
        provider: this.provider,
        providerUserId: userInfo.id,
        userId: maybeUser.userId,
      });
      return maybeUser.userId;
    }

    const newUser = await this.oauthUserService.createOAuthUser({
      email: userInfo.email,
      nickname: userInfo.name,
    });
    if (!newUser) {
      throw new BadRequestException('사용자 서비스에서 사용자 생성에 실패했습니다. 다시 시도해주세요.');
    }

    await this.oauthRepository.create({
      provider: this.provider,
      providerUserId: userInfo.id,
      userId: newUser.userId,
    });
    return newUser.userId;
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

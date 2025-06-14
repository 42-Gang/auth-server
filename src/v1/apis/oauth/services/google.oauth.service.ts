import { OAuthRepositoryInterface } from '../../../storage/database/interfaces/oauth.repository.interface.js';
import {
  HandleCallbackInputType,
  HandleCallbackResponseType,
  OAuthService,
} from './oauth.service.js';
import TokenService from '../../auth/services/token.service.js';
import { UnAuthorizedException } from '../../../common/exceptions/core.error.js';
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
  readonly provider = oauthProviderSchema.enum.GOOGLE;

  constructor(
    private readonly oauthRepository: OAuthRepositoryInterface,
    private readonly oauthCacheRepository: OAuthCacheRepository,
    private readonly tokenService: TokenService,
    private readonly oauthUserService: OAuthUserService,
    private readonly googleOauthClient: GoogleOauthClient,
  ) {}

  async getAuthUrl(redirectUri: string): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    await this.oauthCacheRepository.setState(this.provider, state);
    const client = this.googleOauthClient.getClient(redirectUri);
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
      throw new UnAuthorizedException(
        `유효하지 않은 또는 만료된 state 파라미터입니다. ${this.provider}`,
      );
    }
  }

  private async exchangeGoogleTokens(client: OAuth2Client, code: string) {
    return this.googleOauthClient.getTokens(client, code);
  }

  private async fetchUserInfo(client: OAuth2Client): Promise<OAuthUserInfoType> {
    const googleUserData = await this.googleOauthClient.getUserInfo(client);
    return OAuthUserInfoSchema.parse(googleUserData);
  }

  private async findOrCreateUserRecord(userInfo: OAuthUserInfoType): Promise<number> {
    const userFromOauth = await this.oauthRepository.findByProviderAndProviderId(
      this.provider,
      userInfo.id,
    );
    if (userFromOauth) {
      return userFromOauth.userId;
    }

    const userFromNative = await this.oauthUserService.getOAuthUserByEmail({
      email: userInfo.email,
      nickname: userInfo.name,
    });

    if (userFromNative.exists && userFromNative.userId) {
      await this.oauthRepository.create({
        provider: this.provider,
        providerUserId: userInfo.id,
        userId: userFromNative.userId,
      });
      return userFromNative.userId;
    }

    const userCreated = await this.oauthUserService.createOAuthUser({
      email: userInfo.email,
      nickname: userInfo.name,
    });

    await this.oauthRepository.create({
      provider: this.provider,
      providerUserId: userInfo.id,
      userId: userCreated.userId,
    });
    return userCreated.userId;
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

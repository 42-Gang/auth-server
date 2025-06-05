import { OAuthRepositoryInterface } from '../../../storage/database/interfaces/oauth.repository.interface.js';
import { OAuthCredentials, OAuthService } from './oauth.service.js';
import { OAuthCacheInterface } from '../../../storage/cache/interfaces/oauth.cache.interface.js';
import TokenService from '../../auth/services/token.service.js';
import { google } from 'googleapis';
import {
  HandleOAuthRequest,
  OAuthTokenResponseType,
  OAuthUserInfoSchema,
  OAuthUserInfoType,
} from '../oauth.schema.js';
import { OAuthProvider } from '@prisma/client';
import crypto from 'crypto';
import {
  BadRequestException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
import OAuthUserService from './oauth.user.service.js';
import { FastifyBaseLogger } from 'fastify';
import { OAuth2Client } from 'google-auth-library';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const oAuthScopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export default class GoogleOauthService implements OAuthService {
  constructor(
    private readonly oauthRepository: OAuthRepositoryInterface,
    private readonly oauthCacheRepository: OAuthCacheInterface,
    private readonly tokenService: TokenService,
    private readonly oauthUserService: OAuthUserService,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async getAuthorizationUrl(): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    const scopes = oAuthScopes;

    this.oauthCacheRepository.setState(`oauth:state:${state}`, { provider: 'google' }, 300);

    const oAuthClient = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI,
    );

    return oAuthClient.generateAuthUrl({
      access_type: 'online',
      scope: scopes,
      state: state,
    });
  }

  private async getCredentials(code: string, client: OAuth2Client): Promise<OAuthCredentials> {
    this.logger.info(`code: ${code}`);
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    if (!tokens || !tokens.access_token) {
      throw new BadRequestException('구글 OAuth 인증에 실패했습니다. 다시 시도해주세요.');
    }
    return {
      accessToken: tokens.access_token,
      scope: tokens.scope,
    };
  }

  private async getUserInfo(
    tokens: OAuthCredentials,
    client: OAuth2Client,
  ): Promise<OAuthUserInfoType> {
    oAuthScopes.forEach((scope) => {
      if (!tokens.scope?.includes(scope)) {
        throw new UnAuthorizedException(
          `구글 사용자 정보에 접근할 권한이 없습니다. 필요한 권한: ${scope}`,
        );
      }
    });

    const userInfoResponse = await client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    });

    const result = OAuthUserInfoSchema.safeParse(userInfoResponse.data);
    if (!result.success) {
      throw new BadRequestException('사용자 정보를 가져오는 데 실패했습니다.');
    }

    return result.data;
  }

  private async checkOAuthUserExists(userInfo: OAuthUserInfoType): Promise<number | null> {
    const provider = await this.getProviderName();
    const oauthUser = await this.oauthRepository.findByProviderAndProviderId(provider, userInfo.id);
    if (oauthUser) {
      return oauthUser.userId;
    }
    return null;
  }

  private async checkGeneralUserExists(userInfo: OAuthUserInfoType): Promise<number | null> {
    const user = await this.oauthUserService.getOAuthUserByEmail({
      email: userInfo.email,
      nickname: userInfo.name,
    });
    if (user.exists && user.userId) {
      return user.userId;
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

  private async checkOAuthState(state: string): Promise<boolean> {
    const cachedState = await this.oauthCacheRepository.getState(`oauth:state:${state}`);
    if (!cachedState) {
      throw new UnAuthorizedException('유효하지 않은 또는 만료된 state 파라미터입니다.');
    }
    return true;
  }

  async handleOAuthFlow(parsed: HandleOAuthRequest): Promise<OAuthTokenResponseType> {
    if ('error' in parsed) {
      throw new BadRequestException(parsed.error); //TODO 에러 처리 개선 필요 (사용자 구글 auth 과정에서 생기는 모든 에러 처리)
    }

    const { code, state } = parsed;
    if (!code || !state) {
      throw new BadRequestException('유효하지 않은 OAuth 요청입니다.');
    }

    const oAuthClient = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI,
    );
    await this.checkOAuthState(state);
    const credentials = await this.getCredentials(code, oAuthClient);

    const userInfo = await this.getUserInfo(
      {
        accessToken: credentials.accessToken,
        scope: credentials.scope,
      },
      oAuthClient,
    );

    const userId = await this.checkOAuthUserExists(userInfo);
    if (userId) {
      return await this.generateAccessToken(userId); // 이미 존재하는 OAuth 사용자
    }

    const generalUserId = await this.checkGeneralUserExists(userInfo);
    if (generalUserId) {
      await this.oauthRepository.create({
        provider: await this.getProviderName(),
        providerUserId: userInfo.id,
        userId: generalUserId,
      });
      return await this.generateAccessToken(generalUserId); // 일반 사용자로 존재하는 경우
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
    return await this.generateAccessToken(newUser.userId); // 새로운 OAuth 사용자 생성
  }
}

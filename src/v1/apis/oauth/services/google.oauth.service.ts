import { OAuthRepositoryInterface } from "src/v1/storage/database/interfaces/OAuth.repository.interface.js";
import { OAuthCredentials, OAuthService } from "./oauth.service.js";
import { OAuthCacheInterface } from "src/v1/storage/cache/interfaces/oauth.cache.interface.js";
import TokenService from "../../auth/services/token.service.js";
import UserService from "../../auth/services/user.service.js";
import { google } from "googleapis";
import { HandleOAuthRequest, OAuthUserInfoSchema, OAuthUserInfoType } from "../oauth.schema.js";
import { OAuthProvider } from "@prisma/client";
import crypto from 'crypto';
import { BadRequestException, UnAuthorizedException } from "src/v1/common/exceptions/core.error.js";
import OAuthUserService from "./oauth.user.service.js";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const oAuthClient = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/v1/oauth/google-callback', // TODO: 수정 필요
);

const oAuthScopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

export default class GoogleOAuthService implements OAuthService {
     constructor(
        private readonly oauthRepository: OAuthRepositoryInterface,
        private readonly oautCacheRepository: OAuthCacheInterface,
        private readonly tokenService: TokenService,
        private readonly oauthUserService: OAuthUserService,
    ) {}
    
    async getAuthorizationUrl(): Promise<string> {
        const state = crypto.randomBytes(16).toString('hex');
        const scopes = oAuthScopes;

        this.oautCacheRepository.setState(
            `oauth:state:${state}`,
            { provider: 'GOOGLE' },
            300
        );

        const authorizationUrl = oAuthClient.generateAuthUrl({
            access_type: 'online',
            scope: scopes,
            state: state
        });

        return authorizationUrl;
    }

    async getAccessToken(code: string): Promise<OAuthCredentials> {
        const { tokens } = await oAuthClient.getToken(code);
        oAuthClient.setCredentials(tokens);
        if (!tokens || !tokens.access_token) {
            throw new BadRequestException('구글 OAuth 인증에 실패했습니다. 다시 시도해주세요.');
        }
        return { accessToken: tokens.access_token };
    }

    async getUserInfo(tokens: OAuthCredentials): Promise<OAuthUserInfoType> {
        oAuthScopes.forEach(scope => {  
            if (!tokens.scope?.includes(scope)) {
                throw new UnAuthorizedException(`구글 사용자 정보에 접근할 권한이 없습니다. 필요한 권한: ${scope}`);
            }
        });

        const userInfoResponse = await oAuthClient.request({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        });

        const result = OAuthUserInfoSchema.safeParse(userInfoResponse.data);
        if (!result.success) {
            throw new BadRequestException('사용자 정보를 가져오는 데 실패했습니다.');
        }

        return result.data;
    }

    async checkOAuthUserExists(userInfo: OAuthUserInfoType): Promise<number | null> {
        const oauthUser = await this.oauthRepository.findByProviderAndProviderId('GOOGLE', userInfo.id);
        if (oauthUser) {
            return oauthUser.userId;
        }
        return null;
    }


    async checkGeneralUserExists(userInfo: OAuthUserInfoType): Promise<number | null> {

        const user = await this.oauthUserService.getOAuthUserByEmail({
            email: userInfo.email,
            nickname: userInfo.name,
        });
        if (user.exists && user.userId) {
            return user.userId;
        }

        return null;
    }

    async getProviderName(): Promise<OAuthProvider> {
        return OAuthProvider.GOOGLE;
    }

    async generateAccessToken(userId: number): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
    }> {
        await this.tokenService.expireRefreshTokens(userId);
        return await this.tokenService.generateTokens(userId);
    }

    async handleOAuthFlow(parsed: HandleOAuthRequest): Promise<OAuthUserInfoType | null> {
        if ("error" in parsed) {
            throw new BadRequestException(parsed.error); //TODO 에러 처리 개선 필요 (사용자 구글 auth 과정에서 생기는 모든 에러 처리)
        }

        const { code, state } = parsed;
        if (!code || !state) {
            throw new BadRequestException('유효하지 않은 OAuth 요청입니다.');
        }
        
        await this.checkOAuthState(state);
        await this.getAccessToken(code);
        const userInfo = await this.getUserInfo(oAuthClient.credentials);
        const userId = await this.checkOAuthUserExists(userInfo);
        if (userId) {
            return await this.generateAccessToken(userId); // 이미 존재하는 OAuth 사용자
        }
    }
}
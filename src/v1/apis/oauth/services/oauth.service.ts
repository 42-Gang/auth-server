import { google } from "googleapis";
import { OAuthRepositoryInterface } from "src/v1/storage/database/interfaces/OAuth.repository.interface.js";
import crypto from 'crypto';
import { OAuthProvider } from "@prisma/client";
import { OAuthCacheInterface } from "src/v1/storage/cache/interfaces/oauth.cache.interface.js";
import { GoogleUserInfo, googleUserInfoSchema, HandleOAuthRequest } from "../oauth.schema.js";
import { BadRequestException, UnAuthorizedException } from "src/v1/common/exceptions/core.error.js";
import { Credentials } from "google-auth-library";
import TokenService from "../../auth/services/token.service.js";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const oAuthClient = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/v1/oauth/google-callback', // TODO: 수정 필요
);

const oAuthScopes = [
    'https://www.googleapis.com/auth/userinfo.email',
];

export default class OAuthService {
    constructor(
        private readonly oauthRepository: OAuthRepositoryInterface,
        private readonly oautCacheRepository: OAuthCacheInterface,
    ) {}
    
    async beginOAuth(provider: OAuthProvider) : Promise<string> {
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

    async checkOAuthState(state: string): Promise<boolean> {
        const cachedState = await this.oautCacheRepository.getState(`oauth:state:${state}`);
        if (!cachedState) {
            throw new UnAuthorizedException('유효하지 않은 또는 만료된 state 파라미터입니다.');
        }
        return true;
    }

    async getGoogleAccessToekn(code: string): Promise<Credentials> {
        try {
            const { tokens } = await oAuthClient.getToken(code);
            oAuthClient.setCredentials(tokens);
            return tokens;
        } catch (error) {
            throw new BadRequestException('구글 OAuth 인증에 실패했습니다. 다시 시도해주세요.');
        }
    }

    async getGoogleUserInfo(tokens: Credentials): Promise<GoogleUserInfo>  {
        if (!tokens.scope?.includes(oAuthScopes[0])) {
            throw new UnAuthorizedException('구글 사용자 정보에 접근할 권한이 없습니다. 필요한 권한을 요청해주세요.');
        }
        const userInfoResponse = await oAuthClient.request({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        });

        const result = googleUserInfoSchema.safeParse(userInfoResponse.data);
        if (!result.success) {
            throw new BadRequestException('사용자 정보를 가져오는 데 실패했습니다.');
        }

        return result.data;
    }

    async googleOAuth(parsed: HandleOAuthRequest) {
        if ("error" in parsed) {
            throw new BadRequestException(parsed.error); //TODO 에러 처리 개선 필요 (사용자 구글 auth 과정에서 생기는 모든 에러 처리)
        }

        const { code, state } = parsed;
        if (!code || !state) {
            throw new BadRequestException('유효하지 않은 OAuth 요청입니다.');
        }
        
        await this.checkOAuthState(state);
        await this.getGoogleAccessToekn(code);
        const userInfo = await this.getGoogleUserInfo(oAuthClient.credentials);
    }
}
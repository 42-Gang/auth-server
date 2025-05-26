import { google } from "googleapis";
import { OAuthRepositoryInterface } from "src/v1/storage/database/interfaces/OAuth.repository.interface.js";
import crypto from 'crypto';
import { OAuthProvider } from "@prisma/client";
import { OAuthCacheInterface } from "src/v1/storage/cache/interfaces/oauth.cache.interface.js";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const oAuthClient = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/v1/oauth/google-callback', // Redirect URI
);

export default class OAuthService {
    constructor(
        private readonly oauthRepository: OAuthRepositoryInterface,
        private readonly oautCacheRepository: OAuthCacheInterface,
    ) {}
    
    async beginOAuth(provider: OAuthProvider) : Promise<string> {
        const state = crypto.randomBytes(16).toString('hex');
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

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
}
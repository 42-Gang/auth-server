import { FastifyReply, FastifyRequest } from "fastify";
import OAuthService from "./services/oauth.service.js";
import { oAuthProviderSchema, handleOAuthRequestSchema } from "./oauth.schema.js";
import { BadRequestException } from "src/v1/common/exceptions/core.error.js";

export default class OAuthController {
    constructor(
        private readonly oauthService: OAuthService,
    ) {}

    beginOAuth = async (request: FastifyRequest, reply: FastifyReply) => {  
        const params = oAuthProviderSchema.parse(request.params);
        const oAuthUrl = await this.oauthService.beginOAuth(params.provider);
        reply.code(302).redirect(oAuthUrl);
    }

    handleOAuthFlow = async (request: FastifyRequest, reply: FastifyReply) => {
        const body = handleOAuthRequestSchema.parse(request.body);
        const provider = oAuthProviderSchema.parse(request.params).provider;

        await this.oauthService.handleOAuthFlow(provider, body);
        // if (provider == 'GOOGLE') {
        //     this.oauthService.googleOAuth(body);
        // } else {
        //     throw new BadRequestException('지원하지 않는 OAuth 제공자입니다.');
        // }
    }
}
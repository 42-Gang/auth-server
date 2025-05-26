import { FastifyReply, FastifyRequest } from "fastify";
import OAuthService from "./services/oauth.service.js";
import { beginOAuthProviderSchema } from "./schemas/beginOAuth.schema.js";

export default class OAuthController {
    constructor(
        private readonly oauthService: OAuthService,
    ) {}

    beginOAuth = async (request: FastifyRequest, reply: FastifyReply) => {  
        const params = beginOAuthProviderSchema.parse(request.params);
        const oAuthUrl = await this.oauthService.beginOAuth(params.provider);
        reply.code(302).redirect(oAuthUrl);
    }

    
}
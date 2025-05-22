import { FastifyReply, FastifyRequest } from "fastify";

export default class OAuthController {
    constructor(
        private readonly oauthService: OAuthService,
    ) {}

    beginOAuth = async (request: FastifyRequest, reply: FastifyReply) => {  
        const { provider } = request.query as { provider: string };
        const redirectUrl = await this.oauthService.getAuthorizationUrl(provider);
    }

}
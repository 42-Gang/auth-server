import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify';
import { BadRequestException } from '../../common/exceptions/core.error.js';
import { STATUS } from '../../common/constants/status.js';
import { handleCallbackInputSchema, OAuthService } from './services/oauth.service.js';
import { oauthRedirectUriBodySchema, oauthProviderParamSchema } from './schema/oauth.schema.js';

export default class OAuthController {
  constructor(
    private readonly googleOauthService: OAuthService,
    private readonly logger: FastifyBaseLogger,
  ) {}

  private getOAuthService(provider: string): OAuthService {
    if (provider === this.googleOauthService.provider) {
      return this.googleOauthService;
    }
    throw new BadRequestException(`Not supported OAuth provider ${provider}`);
  }

  getLoginUrl = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = oauthProviderParamSchema.parse(request.params);
    const body = oauthRedirectUriBodySchema.parse(request.body);

    const service = this.getOAuthService(params.provider);
    const url = await service.getAuthUrl(body.redirectUri);
    reply.code(302).redirect(url);
  };

  handleCallback = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = handleCallbackInputSchema.parse(request.body);
    const params = oauthProviderParamSchema.parse(request.params);

    const service = this.getOAuthService(params.provider);
    this.logger.info(body, 'OAuth handleCallback body');
    const { accessToken, refreshToken, refreshTokenExpiresAt } = await service.handleCallback(body);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: refreshTokenExpiresAt,
    });

    reply.status(201).send({
      status: STATUS.SUCCESS,
      message: '액세스 토큰이 성공적으로 갱신되었습니다.',
      data: {
        accessToken: accessToken,
      },
    });
  };
}

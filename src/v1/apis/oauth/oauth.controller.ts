import { FastifyReply, FastifyRequest } from 'fastify';
import { oAuthProviderSchema, handleOAuthRequestSchema } from './oauth.schema.js';
import { BadRequestException } from 'src/v1/common/exceptions/core.error.js';
import GoogleOauthService from './services/google-oauth.service.js';
import { STATUS } from 'src/v1/common/constants/status.js';

export default class OAuthController {
  constructor(private readonly googleOauthService: GoogleOauthService) {}

  private getOAuthService(provider: string) {
    switch (provider) {
      case 'google':
        return this.googleOauthService;
      default:
        throw new BadRequestException('지원하지 않는 OAuth 제공자입니다.');
    }
  }

  getAuthorizationUrl = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = oAuthProviderSchema.parse(request.params);
    const oAuthService = this.getOAuthService(params.provider);
    const oAuthUrl = await oAuthService.getAuthorizationUrl();
    reply.code(302).redirect(oAuthUrl);
  };

  handleOAuthFlow = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = handleOAuthRequestSchema.parse(request.body);
    const provider = oAuthProviderSchema.parse(request.params).provider;
    const oAuthService = this.getOAuthService(provider);
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await oAuthService.handleOAuthFlow(body);

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
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

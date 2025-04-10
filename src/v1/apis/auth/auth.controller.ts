import { FastifyReply, FastifyRequest } from 'fastify';

import AuthService from './auth.service.js';
import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';
import { signupInputSchema } from './schemas/signup.schema.js';
import { loginInputSchema, loginResponseSchema } from './schemas/login.schema.js';
import { requestVerificationCodeInputSchema } from './schemas/requestVerificationCode.schema.js';

export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signupInputSchema.parse(request.body);
    const result = await this.authService.signup(body);
    reply.status(201).send(result);
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginInputSchema.parse(request.body);
    const { refreshToken, accessToken, refreshTokenExpiresAt } = await this.authService.login(body);

    reply.header(
      'set-cookie',
      `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Secure; Path=/; Expires=${refreshTokenExpiresAt.toUTCString()}`,
    );
    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Login successful',
      data: {
        accessToken,
      },
    } as TypeOf<typeof loginResponseSchema>);
  };

  requestVerificationCode = async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = requestVerificationCodeInputSchema.parse(request.body);
    const result = await this.authService.requestVerificationCode({ email });
    reply.status(200).send(result);
  };

  refreshAccessToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const accessToken = request.headers.authorization;

    request.log.info(request.headers, 'headers');
    request.log.info(request.cookies.refreshToken, 'refresh token');
    request.log.info(accessToken, 'access token');

    // const {  } = await this.authService.refreshAccessToken(refreshToken);

    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Access token refreshed successfully',
      accessToken,
    });
  };
}

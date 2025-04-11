import { FastifyReply, FastifyRequest } from 'fastify';

import AuthService from './auth.service.js';
import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';
import { signupInputSchema } from './schemas/signup.schema.js';
import { loginInputSchema, loginResponseSchema } from './schemas/login.schema.js';
import { requestVerificationCodeInputSchema } from './schemas/requestVerificationCode.schema.js';
import { UnAuthorizedException } from '../../common/exceptions/core.error.js';

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

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: refreshTokenExpiresAt,
    });
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
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnAuthorizedException('No refresh token');
    }

    const result = await this.authService.refreshAccessToken({
      refreshToken,
    });

    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: result.refreshTokenExpiresAt,
    });
    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Access token refreshed successfully',
      data: {
        accessToken: result.accessToken,
      },
    });
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    await this.authService.logout({ userId: request.userId });
    reply.clearCookie('refreshToken');
    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Logout successful',
    });
  };

  verifyAccessToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      reply.header('X-Authenticated', 'false');
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No or invalid Authorization header');
    }
    const accessToken = authHeader.split(' ')[1];
    request.log.info(accessToken, 'accessToken');
    const result = this.authService.verifyAccessToken(accessToken);
    request.log.info(result, 'verifyAccessToken result');
    if (!result.isValid) {
      reply.header('X-Authenticated', 'false');
    }

    if (result.isValid) {
      reply.header('X-Authenticated', 'true');
      reply.header('X-User-Id', result.userId);
    }

    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Access token verified successfully',
    });
  };
}

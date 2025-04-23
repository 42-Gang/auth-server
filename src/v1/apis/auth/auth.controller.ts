import { FastifyReply, FastifyRequest } from 'fastify';

import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';
import { signupInputSchema } from './schemas/signup.schema.js';
import { loginInputSchema, loginResponseSchema } from './schemas/login.schema.js';
import { requestVerificationCodeInputSchema } from './schemas/requestVerificationCode.schema.js';
import { UnAuthorizedException } from '../../common/exceptions/core.error.js';
import AuthService from './services/auth.service.js';
import MailVerificationService from './services/mail-verification.service.js';
import TokenService from './services/token.service.js';

export default class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailVerificationService: MailVerificationService,
    private readonly tokenService: TokenService,
  ) {}

  signup = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signupInputSchema.parse(request.body);
    const result = await this.authService.signup(body);
    reply.status(201).send(result);
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginInputSchema.parse(request.body);
    const { refreshToken, accessToken, refreshTokenExpiresAt } = await this.authService.login(
      body.email,
      body.password,
    );

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
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
    const result = await this.mailVerificationService.requestVerificationCode(email);
    reply.status(200).send(result);
  };

  refreshAccessToken = async (request: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnAuthorizedException('No refresh token');
    }

    const result = await this.tokenService.refreshAccessToken(refreshToken);

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
    await this.authService.logout(request.userId);
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
      return reply.status(200).send();
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.header('X-Authenticated', 'false');
      return reply.status(200).send();
    }

    if (authHeader.split(' ').length !== 2) {
      reply.header('X-Authenticated', 'false');
      return reply.status(200).send();
    }

    const accessToken = authHeader.split(' ')[1];
    const result = this.authService.verifyAccessToken(accessToken);
    if (!result.isValid) {
      reply.header('X-Authenticated', 'false');
      return reply.status(200).send();
    }

    reply.header('X-Authenticated', 'true');
    reply.header('X-User-Id', result.userId);
    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Access token verified successfully',
    });
  };
}

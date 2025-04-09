import { FastifyReply, FastifyRequest } from 'fastify';

import { loginRequestSchema, loginResponseSchema, signupRequestSchema } from './auth.schema.js';
import AuthService from './auth.service.js';
import { TypeOf } from 'zod';
import { STATUS } from '../../common/constants/status.js';

export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  signup = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = signupRequestSchema.parse(request.body);
    const result = await this.authService.signup(body);
    reply.status(201).send(result);
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginRequestSchema.parse(request.body);
    const { refreshToken, accessToken, refreshTokenExpiresAt } = await this.authService.login(body);

    reply.header(
      'set-cookie',
      `refreshToken=${refreshToken}; HttpOnly; SameSite=Strict; Secure; Path=/; Expires=${refreshTokenExpiresAt.toUTCString()}`,
    );
    reply.status(200).send({
      status: STATUS.SUCCESS,
      message: 'Login successful',
      accessToken,
    } as TypeOf<typeof loginResponseSchema>);
  };

  requestVerificationCode = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await this.authService.requestVerificationCode();
    reply.status(200).send({ result });
  };
}

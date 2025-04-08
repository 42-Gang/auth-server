import { z } from 'zod';
import { JWT } from '@fastify/jwt';
import { v4 as uuidv4 } from 'uuid';

import {
  loginRequestSchema,
  loginResponseSchema,
  signupRequestSchema,
  signupResponseSchema,
} from './auth.schema.js';
import { STATUS } from '../../common/constants/status.js';
import { FastifyBaseLogger } from 'fastify';
import { JwtTokenRepositoryInterface } from '../../storage/database/interfaces/JwtToken.repository.interface.js';
import { MailVerificationRepositoryInterface } from '../../storage/database/interfaces/MailVerification.repository.interface.js';

export default class AuthService {
  constructor(
    private readonly jwtTokenRepository: JwtTokenRepositoryInterface,
    private readonly mailVerificationRepository: MailVerificationRepositoryInterface,
    private readonly jwt: JWT,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async signup(
    data: z.infer<typeof signupRequestSchema>,
  ): Promise<z.infer<typeof signupResponseSchema>> {
    return {
      status: STATUS.SUCCESS,
      message: 'User information retrieved successfully',
    };
  }

  async login(
    data: z.infer<typeof loginRequestSchema>,
  ): Promise<z.infer<typeof loginResponseSchema>> {
    return {
      status: STATUS.SUCCESS,
      message: 'User information retrieved successfully',
    };
  }

  async generateRefreshToken(): Promise<string> {
    return uuidv4();
  }
}

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
import { NotFoundException } from '../../common/exceptions/core.error.js';
import { FastifyBaseLogger } from 'fastify';
import UserRepositoryInterface from '../../storage/database/interfaces/user.repository.interface.js';
export default class AuthService {
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly jwt: JWT,
    private readonly logger: FastifyBaseLogger
  ) {}

  async signup(
    data: z.infer<typeof signupRequestSchema>,
  ): Promise<z.infer<typeof signupResponseSchema>> {
    const newUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      password_hash: data.password,
      two_factor_enabled: false,
    });
    if (!newUser) {
      throw new NotFoundException('User not found');
    }

    this.logger.info(`User ${newUser.id} created successfully`);
    
    return {
      status: STATUS.SUCCESS,
      message: 'User information retrieved successfully',
    };
  }

  async login(
    data: z.infer<typeof loginRequestSchema>,
  ): Promise<z.infer<typeof loginResponseSchema>> {
    const foundUser = await this.userRepository.findByEmail(data.email);
    if (!foundUser) {
      return {
        status: STATUS.ERROR,
        message: 'User not found',
      };
    }
    return {
      status: STATUS.SUCCESS,
      message: 'User information retrieved successfully',
      data: {
        accessToken: this.jwt.sign({ id: foundUser.id, email: foundUser.email }),
      },
    };
  }

  async generateRefreshToken(): Promise<string> {
    return uuidv4();
  }
}

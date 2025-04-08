import { z } from 'zod';

import {
  loginRequestSchema,
  loginServiceResponseSchema,
  signupRequestSchema,
  signupResponseSchema,
} from './auth.schema.js';
import { STATUS } from '../../common/constants/status.js';
import { RefreshTokenRepositoryInterface } from '../../storage/database/interfaces/RefreshToken.repository.interface.js';
import { GotClient } from '../../../plugins/http.client.js';
import { UnAuthorizedException } from '../../common/exceptions/core.error.js';
import TokenGenerator from './TokenGenerator.js';

export default class AuthService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryInterface,
    private readonly tokenGenerator: TokenGenerator,
    private readonly httpClient: GotClient,
  ) {}

  async signup(
    data: z.infer<typeof signupRequestSchema>,
  ): Promise<z.infer<typeof signupResponseSchema>> {
    console.log('data', data);
    return {
      status: STATUS.SUCCESS,
      message: 'User information retrieved successfully',
    };
  }

  async login(
    data: z.infer<typeof loginRequestSchema>,
  ): Promise<z.infer<typeof loginServiceResponseSchema>> {
    const authResponse = await this.sendAuthRequest(data.email, data.password);

    const userId = authResponse.body.data.userId;

    // refresh token 생성
    const createdRefreshToken = await this.refreshTokenRepository.create({
      ...this.tokenGenerator.generateRefreshToken(),
      userId,
    });

    // JWT 토큰 생성
    const accessToken = this.tokenGenerator.generateAccessToken(userId);

    return {
      accessToken,
      refreshToken: createdRefreshToken.refreshToken,
      refreshTokenExpiresAt: createdRefreshToken.expiresAt,
    };
  }

  private async sendAuthRequest(email: string, password: string) {
    const authenticateResponse = await this.httpClient.request<{
      data: {
        userId: number;
      };
    }>({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/users/authenticate',
      body: {
        email,
        password,
      },
    });
    if (authenticateResponse.statusCode !== 200) {
      throw new UnAuthorizedException('유효하지 않은 이메일 또는 비밀번호입니다.');
    }
    return authenticateResponse;
  }
}

import { TypeOf } from 'zod';

import {
  loginRequestSchema,
  loginServiceResponseSchema,
  signupRequestSchema,
  signupResponseSchema,
} from './auth.schema.js';
import { STATUS } from '../../common/constants/status.js';
import { RefreshTokenRepositoryInterface } from '../../storage/database/interfaces/RefreshToken.repository.interface.js';
import { GotClient } from '../../../plugins/http.client.js';
import { HttpException, UnAuthorizedException } from '../../common/exceptions/core.error.js';
import TokenGenerator from './TokenGenerator.js';
import { MailVerificationRepositoryInterface } from '../../storage/database/interfaces/MailVerification.repository.interface.js';

export default class AuthService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryInterface,
    private readonly tokenGenerator: TokenGenerator,
    private readonly httpClient: GotClient,
    private readonly mailVerificationRepository: MailVerificationRepositoryInterface,
  ) {}

  async signup(
    data: TypeOf<typeof signupRequestSchema>,
  ): Promise<TypeOf<typeof signupResponseSchema>> {
    // 메일 인증 코드 확인
    await this.verifyEmailCode({
      code: data.mailVerificationCode,
      email: data.email,
    });


    // 유저 생성
    await this.createUser(data);

    return {
      status: STATUS.SUCCESS,
      message: '유저를 성공적으로 생성했습니다.',
    };
  }

  async login(
    data: TypeOf<typeof loginRequestSchema>,
  ): Promise<TypeOf<typeof loginServiceResponseSchema>> {
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

  private async verifyEmailCode({ code, email }: { code: string; email: string }) {
    const foundMailVerification = await this.mailVerificationRepository.findFirstByEmail(email);
    if (!foundMailVerification) {
      throw new UnAuthorizedException('메일 인증 코드가 유효하지 않습니다.');
    }
    if (foundMailVerification.code !== code) {
      throw new UnAuthorizedException('메일 인증 코드가 유효하지 않습니다.');
    }
    if (foundMailVerification.expiresAt < new Date()) {
      throw new UnAuthorizedException('메일 인증 코드가 만료되었습니다.');
    }
  }

  private async createUser(data: TypeOf<typeof signupRequestSchema>) {
    const userResponse = await this.httpClient.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/users',
      body: {
        ...data,
      },
    });
    if (userResponse.statusCode !== 201) {
      throw new HttpException(userResponse.statusCode, '유저 생성에 실패했습니다.');
    }
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

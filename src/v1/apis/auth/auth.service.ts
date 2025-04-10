import { TypeOf } from 'zod';

import { STATUS } from '../../common/constants/status.js';
import { RefreshTokenRepositoryInterface } from '../../storage/database/interfaces/RefreshToken.repository.interface.js';
import { GotClient } from '../../../plugins/http.client.js';
import {
  HttpException,
  NotFoundException,
  UnAuthorizedException,
} from '../../common/exceptions/core.error.js';
import TokenGenerator from './TokenGenerator.js';
import { MailVerificationRepositoryInterface } from '../../storage/database/interfaces/MailVerification.repository.interface.js';
import { sendVerificationCodeMail } from '../../kafka/send.mail.kafka.js';
import { signupInputSchema, signupResponseSchema } from './schemas/signup.schema.js';
import { loginInputSchema, loginServiceResponseSchema } from './schemas/login.schema.js';
import { JwtModule } from '../../../plugins/jwt.module.js';

export default class AuthService {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepositoryInterface,
    private readonly tokenGenerator: TokenGenerator,
    private readonly httpClient: GotClient,
    private readonly mailVerificationRepository: MailVerificationRepositoryInterface,
    private readonly jwtModule: JwtModule,
  ) {}

  async signup(
    data: TypeOf<typeof signupInputSchema>,
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
    data: TypeOf<typeof loginInputSchema>,
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

  async requestVerificationCode({ email }: { email: string }) {
    const code = this.generateVerificationCode();
    await this.mailVerificationRepository.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 60 * 1000),
    });

    // 메일 전송 요청 (kafka)
    await sendVerificationCodeMail(email, code);

    return {
      status: STATUS.SUCCESS,
    };
  }

  async refreshAccessToken({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) {
    const payload = this.jwtModule.verify(accessToken);
    console.log(payload);
  }

  private async verifyEmailCode({ code, email }: { code: string; email: string }) {
    const foundMailVerification = await this.mailVerificationRepository.findFirstByEmail(email);
    if (!foundMailVerification) {
      throw new NotFoundException('인증메일을 전송하지 않았습니다.');
    }
    await this.mailVerificationRepository.update(foundMailVerification.id, {
      tryCount: foundMailVerification.tryCount + 1,
    });
    if (foundMailVerification.status === 'VERIFIED') {
      throw new UnAuthorizedException('이미 인증된 이메일입니다.');
    }
    if (foundMailVerification.code !== code) {
      throw new UnAuthorizedException('메일 인증 코드가 유효하지 않습니다.');
    }
    if (foundMailVerification.expiresAt < new Date()) {
      throw new UnAuthorizedException('메일 인증 코드가 만료되었습니다.');
    }
    if (3 <= foundMailVerification.tryCount) {
      throw new UnAuthorizedException('메일 인증 코드가 만료되었습니다.');
    }

    await this.mailVerificationRepository.update(foundMailVerification.id, {
      status: 'VERIFIED',
    });
  }

  private async createUser(data: TypeOf<typeof signupInputSchema>) {
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

  private generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += digits[Math.floor(Math.random() * digits.length)];
    }
    return result;
  }
}

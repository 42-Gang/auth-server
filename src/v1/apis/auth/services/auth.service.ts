import { TypeOf } from 'zod';
import { signupInputSchema, signupResponseSchema } from '../schemas/signup.schema.js';
import { STATUS } from '../../../common/constants/status.js';
import UserService from './user.service.js';
import TokenService from './token.service.js';
import MailVerificationService from './mail-verification.service.js';

export default class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly mailVerificationService: MailVerificationService,
  ) {}

  async login(email: string, password: string) {
    const userId = await this.userService.authenticateUser(email, password);
    await this.tokenService.expireRefreshTokens(userId);
    return await this.tokenService.generateTokens(userId);
  }

  async signup({
    email,
    password,
    nickname,
    mailVerificationCode,
  }: TypeOf<typeof signupInputSchema>): Promise<TypeOf<typeof signupResponseSchema>> {
    await this.mailVerificationService.verifyEmailCode(email, mailVerificationCode);
    await this.userService.createUser({
      email,
      password,
      nickname,
      mailVerificationCode,
    });

    return {
      status: STATUS.SUCCESS,
      message: 'User created successfully',
    };
  }

  async logout(userId: number) {
    await this.tokenService.expireRefreshTokens(userId);
  }

  async refreshAccessToken(refreshToken: string) {
    return await this.tokenService.refreshAccessToken(refreshToken);
  }

  verifyAccessToken(accessToken: string) {
    return this.tokenService.verifyAccessToken(accessToken);
  }
}

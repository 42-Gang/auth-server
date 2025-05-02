import { TypeOf } from 'zod';
import { signupInputSchema, signupResponseSchema } from '../schemas/signup.schema.js';
import { STATUS } from '../../../common/constants/status.js';
import UserService from './user.service.js';
import TokenService from './token.service.js';
import MailVerificationService from './mail-verification.service.js';
import { produceLogoutEvent } from 'src/v1/kafka/send.mail.kafka.js';

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
    const { emailCodeId } = await this.mailVerificationService.verifyEmailCode(
      email,
      mailVerificationCode,
    );
    await this.userService.createUser({
      email,
      password,
      nickname,
    });
    await this.mailVerificationService.expireEmailCode(emailCodeId);

    return {
      status: STATUS.SUCCESS,
      message: 'User created successfully',
    };
  }

  async logout(userId: number) {
    await this.tokenService.expireRefreshTokens(userId);
    await produceLogoutEvent(userId);
    // TODO: 로그아웃시 kafka 메시지 전송 -> 해당 유저의 소켓을 종료하거나, 유저 상태, userId를 blacklist에 추가 등 처리
  }

  async refreshAccessToken(refreshToken: string) {
    return await this.tokenService.refreshAccessToken(refreshToken);
  }

  verifyAccessToken(accessToken: string) {
    return this.tokenService.verifyAccessToken(accessToken);
  }
}

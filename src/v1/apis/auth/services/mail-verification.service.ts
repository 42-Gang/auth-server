import { MailVerificationRepositoryInterface } from '../../../storage/database/interfaces/MailVerification.repository.interface.js';
import { sendVerificationCodeMail } from '../../../kafka/send.mail.kafka.js';
import { NotFoundException, UnAuthorizedException } from '../../../common/exceptions/core.error.js';
import { TypeOf } from 'zod';
import { requestVerificationCodeResponseSchema } from '../schemas/requestVerificationCode.schema.js';
import { STATUS } from '../../../common/constants/status.js';
import UserService from './user.service.js';

export default class MailVerificationService {
  constructor(
    private readonly mailVerificationRepository: MailVerificationRepositoryInterface,
    private readonly userService: UserService,
  ) {}

  private readonly MAIL_VERIFICATION_CODE_EXPIRSE_IN = 1000 * 60 * 3; // 3분

  async requestVerificationCode(
    email: string,
  ): Promise<TypeOf<typeof requestVerificationCodeResponseSchema>> {
    await this.userService.validateDuplicatedEmail(email);

    // 이전 코드 만료
    await this.mailVerificationRepository.expireAllMailVerifications(email);

    const code = this.generateVerificationCode();
    await this.mailVerificationRepository.create({
      email,
      code,
      expiresAt: new Date(Date.now() + this.MAIL_VERIFICATION_CODE_EXPIRSE_IN),
    });
    await sendVerificationCodeMail(email, code);
    return {
      status: STATUS.SUCCESS,
      message: 'Verification code sent successfully.',
    };
  }

  async verifyEmailCode(email: string, code: string) {
    const verification = await this.mailVerificationRepository.findFirstByEmail(email);
    if (!verification) {
      throw new NotFoundException('Verification code not found.');
    }
    if (verification.expiresAt < new Date() || verification.tryCount >= 3) {
      throw new UnAuthorizedException('Invalid or expired verification code.');
    }

    if (verification.code !== code) {
      await this.mailVerificationRepository.update(verification.id, {
        tryCount: verification.tryCount + 1,
      });
      throw new UnAuthorizedException('Invalid verification code.');
    }

    await this.mailVerificationRepository.update(verification.id, { status: 'VERIFIED' });
  }

  private generateVerificationCode(length: number = 6): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }
}

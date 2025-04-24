import { MailVerificationRepositoryInterface } from '../../../storage/database/interfaces/MailVerification.repository.interface.js';
import { sendVerificationCodeMail } from '../../../kafka/send.mail.kafka.js';
import {
  NotFoundException,
  TooManyRequestsException,
  UnAuthorizedException,
} from '../../../common/exceptions/core.error.js';
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

    const lastVerification = await this.mailVerificationRepository.findFirstByEmail(email);
    if (lastVerification) {
      if (new Date() < lastVerification.expiresAt) {
        throw new TooManyRequestsException(
          '이미 인증 메일을 보냈습니다. 3분 뒤에 다시 시도해주세요.',
        );
      }
    }

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
      message: '인증 코드가 성공적으로 전송되었습니다.',
    };
  }

  async verifyEmailCode(email: string, code: string): Promise<{ emailCodeId: number }> {
    const verification = await this.mailVerificationRepository.findFirstByEmail(email);
    if (!verification) {
      throw new NotFoundException('인증 코드를 찾을 수 없습니다.');
    }
    if (verification.expiresAt < new Date() || verification.tryCount >= 3) {
      throw new UnAuthorizedException('유효하지 않거나 만료된 인증 코드입니다.');
    }

    if (verification.code !== code) {
      await this.mailVerificationRepository.update(verification.id, {
        tryCount: verification.tryCount + 1,
      });
      throw new UnAuthorizedException('잘못된 인증 코드입니다.');
    }

    return { emailCodeId: verification.id };
  }

  async expireEmailCode(id: number) {
    await this.mailVerificationRepository.update(id, { status: 'VERIFIED' });
  }

  private generateVerificationCode(length: number = 6): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }
}

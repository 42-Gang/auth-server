import { beforeEach, describe, expect, it, vi } from 'vitest';
import MailVerificationRepository from '../../../../src/v1/storage/database/prisma/MailVerification.repository.js';
import mockPrisma from '../../mocks/mockPrisma.js';
import MailVerificationService from '../../../../src/v1/apis/auth/services/mail-verification.service.js';
import UserService from '../../../../src/v1/apis/auth/services/user.service.js';
import { STATUS } from '../../../../src/v1/common/constants/status.js';
import {
  NotFoundException,
  TooManyRequestsException,
  UnAuthorizedException,
} from '../../../../src/v1/common/exceptions/core.error.js';
import { GotClient } from '../../../../src/plugins/http.client.js';
import { sendVerificationCodeMail } from '../../../../src/v1/kafka/send.mail.kafka.js';

// ✅ 외부 Kafka 함수 목킹
vi.mock('../../../../src/v1/kafka/send.mail.kafka.js', () => ({
  sendVerificationCodeMail: vi.fn(),
}));

let mailVerificationRepository: MailVerificationRepository;
let userService: UserService;
let gotClient: GotClient;
let mailVerificationService: MailVerificationService;

beforeEach(() => {
  mailVerificationRepository = new MailVerificationRepository(mockPrisma);

  gotClient = new GotClient({
    get throwHttpErrors() {
      return false;
    },
  });

  userService = new UserService(gotClient);
  mailVerificationService = new MailVerificationService(mailVerificationRepository, userService);
});

describe('이메일 인증 요청', () => {
  it('정상', async () => {
    userService.validateDuplicatedEmail = vi.fn().mockResolvedValue(undefined);
    mailVerificationRepository.expireAllMailVerifications = vi.fn().mockResolvedValue(undefined);
    mailVerificationRepository.create = vi.fn().mockResolvedValue(undefined);
    (sendVerificationCodeMail as any).mockResolvedValue(undefined);

    const result = await mailVerificationService.requestVerificationCode('test@naver.com');

    expect(result.status).toBe(STATUS.SUCCESS);
    expect(result.message).toBe('Verification code sent successfully.');
    expect(sendVerificationCodeMail).toHaveBeenCalled();
  });

  it('이미 인증 메일 발송', async () => {
    userService.validateDuplicatedEmail = vi.fn().mockResolvedValue(undefined);
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      expiresAt: new Date(Date.now() + 1000 * 60),
    });
    await expect(mailVerificationService.requestVerificationCode('test@naver.com')).rejects.toThrow(
      TooManyRequestsException,
    );
  });
});

describe('이메일 인증 확인', () => {
  const email = 'test@naver.com';

  it('인증 정보 없음', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue(null);

    await expect(mailVerificationService.verifyEmailCode(email, '1234')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('인증 코드 만료', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() - 1000), // 만료됨
      tryCount: 0,
    });

    await expect(mailVerificationService.verifyEmailCode(email, '1234')).rejects.toThrow(
      UnAuthorizedException,
    );
  });

  it('3회 이상 실패', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() + 1000 * 60),
      tryCount: 3,
    });

    await expect(mailVerificationService.verifyEmailCode(email, '1234')).rejects.toThrow(
      UnAuthorizedException,
    );
  });

  it('잘못된 코드 입력 → tryCount 증가', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      id: 1,
      code: 'correctCode',
      expiresAt: new Date(Date.now() + 1000 * 60),
      tryCount: 1,
    });

    mailVerificationRepository.update = vi.fn().mockResolvedValue(undefined);

    await expect(mailVerificationService.verifyEmailCode(email, 'wrongCode')).rejects.toThrow(
      UnAuthorizedException,
    );

    expect(mailVerificationRepository.update).toHaveBeenCalledWith(1, { tryCount: 2 });
  });

  it('정상 인증 → VERIFIED 처리', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      id: 1,
      code: '123456',
      expiresAt: new Date(Date.now() + 1000 * 60),
      tryCount: 0,
    });

    mailVerificationRepository.update = vi.fn().mockResolvedValue(undefined);

    await mailVerificationService.verifyEmailCode(email, '123456');

    expect(mailVerificationRepository.update).toHaveBeenCalledWith(1, { status: 'VERIFIED' });
  });
});

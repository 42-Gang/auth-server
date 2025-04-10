import { beforeEach, describe, expect, it, vi } from 'vitest';
import RefreshTokenRepository from '../../../../src/v1/storage/database/prisma/RefreshToken.repository.js';
import mockPrisma from '../../mocks/mockPrisma.js';
import TokenGenerator from '../../../../src/v1/apis/auth/TokenGenerator.js';
import { JwtModule } from '../../../../src/plugins/jwt.module.js';
import AuthService from '../../../../src/v1/apis/auth/auth.service.js';
import * as jsonwebtoken from 'jsonwebtoken';
import { GotClient } from '../../../../src/plugins/http.client.js';
import MailVerificationRepository from '../../../../src/v1/storage/database/prisma/MailVerification.repository.js';
import { RefreshTokenRepositoryInterface } from 'src/v1/storage/database/interfaces/RefreshToken.repository.interface.js';
import {
  NotFoundException,
  UnAuthorizedException,
} from '../../../../src/v1/common/exceptions/core.error.js';
import { MailVerificationRepositoryInterface } from '../../../../src/v1/storage/database/interfaces/MailVerification.repository.interface.js';
import { STATUS } from '../../../../src/v1/common/constants/status.js';

let refreshTokenRepository: RefreshTokenRepositoryInterface;
let mailVerificationRepository: MailVerificationRepositoryInterface;
let tokenGenerator;
let gotClient: GotClient;
let authService: AuthService;

const mockGotClientRequest = (requests: { statusCode: number; body: object }[]) => {
  let callIndex = 0;
  gotClient.request = vi.fn().mockImplementation(() => {
    if (callIndex >= requests.length) {
      throw new Error('No more mock requests available');
    }
    const response = requests[callIndex];
    callIndex++;
    return Promise.resolve(response);
  });
};

const mockRefreshTokenRepositoryCreate = (refreshToken: string, expiresAt: Date) => {
  refreshTokenRepository.create = vi.fn().mockResolvedValue({ refreshToken, expiresAt });
};

beforeEach(() => {
  refreshTokenRepository = new RefreshTokenRepository(mockPrisma);
  mailVerificationRepository = new MailVerificationRepository(mockPrisma);
  tokenGenerator = new TokenGenerator(new JwtModule(jsonwebtoken, 'secret', '5m'), 1000 * 60 * 60);
  gotClient = new GotClient({
    get throwHttpErrors(): boolean {
      return false;
    },
  });

  authService = new AuthService(
    refreshTokenRepository,
    tokenGenerator,
    gotClient,
    mailVerificationRepository,
  );
});

describe('로그인', () => {
  it('로그인 정상', async () => {
    mockGotClientRequest([{ statusCode: 200, body: { data: { userId: 1 } } }]);
    const expiresAt = new Date(Date.now() + 1000 * 60);
    mockRefreshTokenRepositoryCreate('refreshToken', expiresAt);

    const result = await authService.login({
      email: 'test@naver.com',
      password: '1234',
    });

    const payload = jsonwebtoken.verify(result.accessToken, 'secret');
    if (typeof payload === 'string') {
      throw new Error('Payload is not an object');
    }

    expect(result.refreshToken).toBe('refreshToken');
    expect(result.refreshTokenExpiresAt).toBe(expiresAt);
    expect(payload.userId).toBe(1);
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('로그인 실패 - 이메일, 패드워드 불일치', async () => {
    mockGotClientRequest([{ statusCode: 401, body: {} }]);
    const expiresAt = new Date(Date.now() + 1000 * 60);
    mockRefreshTokenRepositoryCreate('refreshToken', expiresAt);

    await expect(
      authService.login({
        email: 'test@naver.com',
        password: '1234',
      }),
    ).rejects.toThrow(UnAuthorizedException);
  });
});

describe('회원가입', () => {
  it('회원가입 정상', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    mockGotClientRequest([{ statusCode: 201, body: {} }]);

    const response = await authService.signup({
      email: 'test@naver.com',
      password: '1234',
      nickname: 'woonshin',
      mailVerificationCode: '1234',
    });

    expect(response.status).toBe(STATUS.SUCCESS);
  });

  it('회원가입 - 메일 인증코드 실패', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    mockGotClientRequest([{ statusCode: 201, body: {} }]);

    await expect(
      authService.signup({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'woonshin',
        mailVerificationCode: 'wrong_code',
      }),
    ).rejects.toThrow(UnAuthorizedException);
  });

  it('회원가입 - 메일 인증코드 실패 3회 실패', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      tryCount: 3,
    });
    mockGotClientRequest([{ statusCode: 201, body: {} }]);

    await expect(
      authService.signup({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'woonshin',
        mailVerificationCode: '1234',
      }),
    ).rejects.toThrow(UnAuthorizedException);
  });

  it('회원가입 - 메일 인증코드 만료', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() - 1000 * 60 * 60),
    });
    mockGotClientRequest([{ statusCode: 201, body: {} }]);

    await expect(
      authService.signup({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'woonshin',
        mailVerificationCode: '1234',
      }),
    ).rejects.toThrow(UnAuthorizedException);
  });

  it('회원가입 - 회원 생성 실패', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      code: '1234',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });
    mockGotClientRequest([{ statusCode: 400, body: {} }]);

    await expect(
      authService.signup({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'woonshin',
        mailVerificationCode: '1234',
      }),
    ).rejects.toThrowError('유저 생성에 실패했습니다.');
  });

  it('회원가입 - 메일 인증코드 없음', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue(null);

    await expect(
      authService.signup({
        email: 'test@naver.com',
        password: '1234',
        nickname: 'woonshin',
        mailVerificationCode: '1234',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('회원가입 - 코드 인증시 사용 ', async () => {
    mailVerificationRepository.findFirstByEmail = vi.fn().mockResolvedValue({
      id: 1,
      code: '1234',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      tryCount: 0,
    });
    mailVerificationRepository.update = vi.fn().mockResolvedValue(undefined);

    await authService.signup({
      email: 'test@naver.com',
      password: '1234',
      nickname: 'woonshin',
      mailVerificationCode: '1234',
    });

    expect(mailVerificationRepository.update).toHaveBeenNthCalledWith(
      1,
      1,
      expect.objectContaining({
        tryCount: 1,
      }),
    );

    expect(mailVerificationRepository.update).toHaveBeenNthCalledWith(
      2,
      1,
      expect.objectContaining({
        status: 'VERIFIED',
      }),
    );
  });
});

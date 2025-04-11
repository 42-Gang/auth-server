import { describe, it, beforeEach, expect, vi } from 'vitest';
import UserService from '../../../../src/v1/apis/auth/services/user.service.js';
import { GotClient } from '../../../../src/plugins/http.client.js';
import {
  ConflictException,
  HttpException,
  UnAuthorizedException,
} from '../../../../src/v1/common/exceptions/core.error.js';

let userService: UserService;
let gotClient: GotClient;

beforeEach(() => {
  gotClient = new GotClient({
    get throwHttpErrors() {
      return false;
    },
  });
  userService = new UserService(gotClient);
});

describe('유저 생성', () => {
  it('정상적으로 유저 생성', async () => {
    gotClient.request = vi.fn().mockResolvedValue({ statusCode: 201 });
    await expect(
      userService.createUser({
        email: 'test@example.com',
        password: '1234',
        nickname: 'tester',
        mailVerificationCode: '1234',
      }),
    ).resolves.not.toThrow();
  });

  it('유저 생성 실패 시 예외 발생', async () => {
    gotClient.request = vi.fn().mockResolvedValue({ statusCode: 400 });
    await expect(
      userService.createUser({
        email: 'test@example.com',
        password: '1234',
        nickname: 'tester',
        mailVerificationCode: '1234',
      }),
    ).rejects.toThrow(HttpException);
  });
});

describe('이메일 패스워드 검증', () => {
  it('정상적으로 인증 시 userId 반환', async () => {
    gotClient.request = vi.fn().mockResolvedValue({
      statusCode: 200,
      body: { data: { userId: 42 } },
    });

    const userId = await userService.authenticateUser('test@example.com', '1234');
    expect(userId).toBe(42);
  });

  it('인증 실패 시 UnAuthorizedException 발생', async () => {
    gotClient.request = vi.fn().mockResolvedValue({
      statusCode: 401,
      body: {},
    });

    await expect(userService.authenticateUser('test@example.com', 'wrongpass')).rejects.toThrow(
      UnAuthorizedException,
    );
  });
});

describe('이메일 중복  검사', () => {
  it('중복 아님 → 통과', async () => {
    gotClient.request = vi.fn().mockResolvedValue({ statusCode: 200 });
    await expect(userService.validateDuplicatedEmail('unique@example.com')).resolves.not.toThrow();
  });

  it('중복 이메일 → ConflictException 발생', async () => {
    gotClient.request = vi.fn().mockResolvedValue({ statusCode: 409 });
    await expect(userService.validateDuplicatedEmail('duplicate@example.com')).rejects.toThrow(
      ConflictException,
    );
  });
});

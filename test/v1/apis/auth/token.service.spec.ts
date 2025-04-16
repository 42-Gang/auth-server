import { beforeEach, describe, expect, it, vi } from 'vitest';
import TokenService from '../../../../src/v1/apis/auth/services/token.service.js';
import TokenGenerator from '../../../../src/v1/apis/auth/TokenGenerator.js';
import { JwtModule } from '../../../../src/plugins/jwt.module.js';
import * as jsonwebtoken from 'jsonwebtoken';
import { UnAuthorizedException } from '../../../../src/v1/common/exceptions/core.error.js';
import RefreshTokenRepository from '../../../../src/v1/storage/database/prisma/RefreshToken.repository.js';
import mockPrisma from '../../mocks/mockPrisma.js';

let tokenService: TokenService;
let refreshTokenRepository: RefreshTokenRepository;
let jwtModule: JwtModule;
let tokenGenerator: TokenGenerator;

beforeEach(() => {
  refreshTokenRepository = new RefreshTokenRepository(mockPrisma);
  jwtModule = new JwtModule(jsonwebtoken, 'secret', '5m');
  tokenGenerator = new TokenGenerator(jwtModule, 1000 * 60 * 60);
  tokenService = new TokenService(refreshTokenRepository, tokenGenerator, jwtModule);
});

const mockRefreshTokenRepositoryCreate = (
  refreshToken: string,
  expiresAt: Date,
  userId: number,
) => {
  refreshTokenRepository.create = vi.fn().mockResolvedValue({
    refreshToken,
    expiresAt,
    userId,
  });
};

describe('generateTokens', () => {
  it('정상', async () => {
    const refreshToken = 'refreshToken';
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    const accessToken = 'accessToken';

    tokenGenerator.generateAccessToken = vi.fn().mockReturnValue(accessToken);
    tokenGenerator.generateRefreshToken = vi.fn().mockReturnValue({
      refreshToken,
      expiresAt,
    });
    mockRefreshTokenRepositoryCreate(refreshToken, expiresAt, 1);

    const result = await tokenService.generateTokens(1);

    expect(result.accessToken).toBe(accessToken);
    expect(result.refreshToken).toBe(refreshToken);
    expect(result.refreshTokenExpiresAt).toBe(expiresAt);
  });
});

describe('refreshAccessToken', () => {
  it('정상', async () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
    const foundToken = {
      id: 1,
      userId: 1,
      refreshToken: 'validRefreshToken',
      expiresAt,
    };
    const accessToken = 'accessToken';
    const newRefreshToken = 'newRefreshToken';
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60);

    refreshTokenRepository.findByRefreshToken = vi.fn().mockResolvedValue(foundToken);
    refreshTokenRepository.update = vi.fn().mockResolvedValue(undefined);
    tokenGenerator.generateAccessToken = vi.fn().mockReturnValue(accessToken);
    tokenGenerator.generateRefreshToken = vi.fn().mockReturnValue({
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
    });
    refreshTokenRepository.create = vi.fn().mockResolvedValue({
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
    });

    const result = await tokenService.refreshAccessToken('validRefreshToken');

    expect(result.accessToken).toBe(accessToken);
    expect(result.refreshToken).toBe(newRefreshToken);
    expect(result.refreshTokenExpiresAt).toBe(newExpiresAt);
    expect(refreshTokenRepository.update).toHaveBeenCalledWith(1, { status: 'INACTIVE' });
  });

  it('만료된 토큰 예외', async () => {
    refreshTokenRepository.findByRefreshToken = vi.fn().mockResolvedValue({
      id: 1,
      userId: 1,
      refreshToken: 'expiredToken',
      expiresAt: new Date(Date.now() - 1000 * 60),
    });

    await expect(tokenService.refreshAccessToken('expiredToken')).rejects.toThrow(
      UnAuthorizedException,
    );
  });

  it('존재하지 않는 토큰 예외', async () => {
    refreshTokenRepository.findByRefreshToken = vi.fn().mockResolvedValue(null);

    await expect(tokenService.refreshAccessToken('invalidToken')).rejects.toThrow(
      UnAuthorizedException,
    );
  });
});

describe('expireRefreshTokens', () => {
  it('정상', async () => {
    refreshTokenRepository.expireAllRefreshTokens = vi.fn().mockResolvedValue(undefined);

    await expect(tokenService.expireRefreshTokens(1)).resolves.not.toThrow();
    expect(refreshTokenRepository.expireAllRefreshTokens).toHaveBeenCalledWith(1);
  });
});

describe('verifyAccessToken', () => {
  it('정상 검증', () => {
    jwtModule.verify = vi.fn().mockReturnValue(true);
    jwtModule.decode = vi.fn().mockReturnValue({ userId: '1' });

    const result = tokenService.verifyAccessToken('validToken');
    expect(result).toEqual({
      isValid: true,
      userId: '1',
    });
  });

  it('문자열 반환 시 false', () => {
    jwtModule.verify = vi.fn().mockReturnValue(true);
    jwtModule.decode = vi.fn().mockReturnValue('some string');

    const result = tokenService.verifyAccessToken('invalidToken');
    expect(result).toEqual({
      isValid: false,
    });
  });

  it('decode null 반환 시 false', () => {
    jwtModule.verify = vi.fn().mockReturnValue(true);
    jwtModule.decode = vi.fn().mockReturnValue(null);

    const result = tokenService.verifyAccessToken('invalidToken');
    expect(result).toEqual({
      isValid: false,
    });
  });

  it('verify 예외 시 false', () => {
    jwtModule.verify = vi.fn(() => {
      throw new Error('invalid token');
    });

    const result = tokenService.verifyAccessToken('invalidToken');
    expect(result).toEqual({
      isValid: false,
    });
  });
});

import { RefreshTokenRepositoryInterface } from '../../../storage/database/interfaces/RefreshToken.repository.interface.js';
import TokenGenerator from '../TokenGenerator.js';
import { JwtModule } from '../../../../plugins/jwt.module.js';
import { UnAuthorizedException } from '../../../common/exceptions/core.error.js';

export default class TokenService {
  constructor(
    private refreshTokenRepository: RefreshTokenRepositoryInterface,
    private tokenGenerator: TokenGenerator,
    private jwtModule: JwtModule,
  ) {}

  async generateTokens(userId: number) {
    const refreshTokenData = await this.refreshTokenRepository.create({
      ...this.tokenGenerator.generateRefreshToken(),
      userId,
    });

    const accessToken = this.tokenGenerator.generateAccessToken(userId);
    // TODO: redis의 blacklist에 해당 ID가 있다면 삭제 -> accessToken 사용 허용한다는 의미

    return {
      accessToken,
      refreshToken: refreshTokenData.refreshToken,
      refreshTokenExpiresAt: refreshTokenData.expiresAt,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const foundToken = await this.refreshTokenRepository.findByRefreshToken(refreshToken);
    if (!foundToken || foundToken.expiresAt < new Date()) {
      throw new UnAuthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    await this.refreshTokenRepository.update(foundToken.id, { status: 'INACTIVE' });
    return this.generateTokens(foundToken.userId);
  }

  async expireRefreshTokens(userId: number) {
    await this.refreshTokenRepository.expireAllRefreshTokens(userId);
  }

  verifyAccessToken(accessToken: string): {
    isValid: boolean;
    userId?: string;
  } {
    // TODO: redis의 blacklist 확인하기 -> 해당 id가 blacklist에 있으면 false
    try {
      this.jwtModule.verify(accessToken);
      const decoded = this.jwtModule.decode(accessToken);
      if (!decoded) {
        return {
          isValid: false,
        };
      }
      if (typeof decoded === 'string') {
        return {
          isValid: false,
        };
      }

      return {
        isValid: true,
        userId: decoded.userId,
      };
    } catch (error) {
      return {
        isValid: false,
      };
    }
  }
}

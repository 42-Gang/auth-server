import { v4 as uuidv4 } from 'uuid';
import { JwtModule } from '../../../plugins/jwt.module.js';

export default class TokenGenerator {
  constructor(
    private readonly jwtModule: JwtModule,
    private readonly refreshTokenExpiresIn: number,
  ) {}

  generateAccessToken(userId: number) {
    return this.jwtModule.sign({
      userId,
    });
  }

  generateRefreshToken(): { refreshToken: string; expiresAt: Date } {
    const refreshToken = this.generateUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * this.refreshTokenExpiresIn);
    return {
      refreshToken,
      expiresAt,
    };
  }

  private generateUUID(): string {
    return uuidv4();
  }
}

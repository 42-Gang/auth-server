import process from 'node:process';
import { v4 as uuidv4 } from 'uuid';
import { JwtModule } from '../../../plugins/jwt.module.js';

export default class TokenGenerator {
  constructor(private readonly jwtModule: JwtModule) {}

  generateAccessToken(userId: number) {
    return this.jwtModule.sign({
      userId,
    });
  }

  generateRefreshToken(): { refreshToken: string; expiresAt: Date } {
    const refreshToken = this.generateUUID();
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * Number(process.env.JWT_REFRESH_EXPIRES_IN),
    );
    return {
      refreshToken,
      expiresAt,
    };
  }

  private generateUUID(): string {
    return uuidv4();
  }
}

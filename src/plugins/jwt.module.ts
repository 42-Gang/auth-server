import * as jsonwebtoken from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

export class JwtModule {
  constructor(
    private readonly jwt: typeof jsonwebtoken,
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: SignOptions['expiresIn'],
  ) {}

  sign(payload: object) {
    const options: SignOptions = {
      expiresIn: this.jwtExpiresIn,
      algorithm: 'HS256',
    };
    return this.jwt.sign(payload, this.jwtSecret, options);
  }

  verify(token: string) {
    return this.jwt.verify(token, this.jwtSecret);
  }
}

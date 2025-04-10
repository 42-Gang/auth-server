import { BaseRepositoryInterface } from './base.repository.interface.js';
import { Prisma, RefreshToken } from '@prisma/client';

export interface RefreshTokenRepositoryInterface
  extends BaseRepositoryInterface<
    RefreshToken,
    Prisma.RefreshTokenCreateInput,
    Prisma.RefreshTokenUpdateInput
  > {
  findByRefreshToken(refreshToken: string): Promise<RefreshToken | null>;

  findByUserIdWithStatus(userId: number, status: string): Promise<RefreshToken[] | null>;
}

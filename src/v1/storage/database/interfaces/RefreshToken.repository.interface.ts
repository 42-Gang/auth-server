import { BaseRepositoryInterface } from './base.repository.interface.js';
import { Prisma, RefreshToken } from '@prisma/client';

export interface RefreshTokenRepositoryInterface
  extends BaseRepositoryInterface<
    RefreshToken,
    Prisma.RefreshTokenCreateInput,
    Prisma.RefreshTokenUpdateInput
  > {}

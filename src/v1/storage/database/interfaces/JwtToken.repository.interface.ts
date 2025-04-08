import { BaseRepositoryInterface } from './base.repository.interface.js';
import { Prisma, JwtToken } from '@prisma/client';

export interface JwtTokenRepositoryInterface
  extends BaseRepositoryInterface<
    JwtToken,
    Prisma.JwtTokenCreateInput,
    Prisma.JwtTokenUpdateInput
  > {}

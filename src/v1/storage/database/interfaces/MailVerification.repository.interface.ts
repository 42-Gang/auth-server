import { BaseRepositoryInterface } from './base.repository.interface.js';
import { MailVerification, Prisma } from '@prisma/client';

export interface MailVerificationRepositoryInterface
  extends BaseRepositoryInterface<
    MailVerification,
    Prisma.MailVerificationCreateInput,
    Prisma.MailVerificationUpdateInput
  > {
  findFirstByEmail(email: string): Promise<MailVerification | null>;
}

import { MailVerificationRepositoryInterface } from '../interfaces/MailVerification.repository.interface.js';
import { MailVerification, Prisma, PrismaClient } from '@prisma/client';

export default class MailVerificationRepository implements MailVerificationRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.MailVerificationCreateInput): Promise<MailVerification> {
    return this.prisma.mailVerification.create({ data });
  }

  delete(id: number): Promise<MailVerification> {
    return this.prisma.mailVerification.delete({ where: { id } });
  }

  findAll(): Promise<MailVerification[]> {
    return this.prisma.mailVerification.findMany();
  }

  findById(id: number): Promise<MailVerification | null> {
    return this.prisma.mailVerification.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.MailVerificationUpdateInput): Promise<MailVerification> {
    return this.prisma.mailVerification.update({ where: { id }, data });
  }

  findFirstByEmail(email: string): Promise<MailVerification | null> {
    return this.prisma.mailVerification.findFirst({
      where: {
        email,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

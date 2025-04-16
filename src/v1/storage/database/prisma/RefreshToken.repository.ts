import { RefreshTokenRepositoryInterface } from '../interfaces/RefreshToken.repository.interface.js';
import { Prisma, PrismaClient, RefreshToken } from '@prisma/client';

export default class RefreshTokenRepository implements RefreshTokenRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data });
  }

  delete(id: number): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({ where: { id } });
  }

  findAll(): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany();
  }

  findById(id: number): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.RefreshTokenUpdateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({ where: { id }, data });
  }

  findByRefreshToken(refreshToken: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: {
        refreshToken: refreshToken,
        status: 'ACTIVE',
      },
    });
  }

  async expireAllRefreshTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'INACTIVE',
      },
    });
  }
}

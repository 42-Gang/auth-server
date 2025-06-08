import { OAuthProvider, Prisma, PrismaClient, UserOAuth } from '@prisma/client';
import { OAuthRepositoryInterface } from '../interfaces/oauth.repository.interface.js';

export default class OAuthRepository implements OAuthRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: number): Promise<UserOAuth | null> {
    return this.prisma.userOAuth.findUnique({
      where: { id },
    });
  }

  create(data: Prisma.UserOAuthCreateInput): Promise<UserOAuth> {
    return this.prisma.userOAuth.create({
      data,
    });
  }

  update(id: number, data: Prisma.UserOAuthUpdateInput): Promise<UserOAuth> {
    return this.prisma.userOAuth.update({
      where: { id },
      data,
    });
  }

  delete(id: number): Promise<UserOAuth> {
    return this.prisma.userOAuth.delete({
      where: { id },
    });
  }

  findAll(): Promise<UserOAuth[]> {
    return this.prisma.userOAuth.findMany();
  }

  findByProviderAndProviderId(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<UserOAuth | null> {
    return this.prisma.userOAuth.findFirst({
      where: {
        provider,
        providerUserId,
      },
    });
  }
}

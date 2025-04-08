import { JwtTokenRepositoryInterface } from '../interfaces/JwtToken.repository.interface.js';
import { JwtToken, Prisma, PrismaClient } from '@prisma/client';

export default class JwtTokenRepository implements JwtTokenRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  create(data: Prisma.JwtTokenCreateInput): Promise<JwtToken> {
    return this.prisma.jwtToken.create({ data });
  }

  delete(id: number): Promise<JwtToken> {
    return this.prisma.jwtToken.delete({ where: { id } });
  }

  findAll(): Promise<JwtToken[]> {
    return this.prisma.jwtToken.findMany();
  }

  findById(id: number): Promise<JwtToken | null> {
    return this.prisma.jwtToken.findUnique({ where: { id } });
  }

  update(id: number, data: Prisma.JwtTokenUpdateInput): Promise<JwtToken> {
    return this.prisma.jwtToken.update({ where: { id }, data });
  }
}

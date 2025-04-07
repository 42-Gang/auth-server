import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import { UnAuthorizedException } from '../v1/common/exceptions/core.error.js';
import prisma from './prisma.js';
import * as process from 'node:process';

const jwtPlugin = async (fastify: FastifyInstance) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'secret',
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '5m' },
  });

  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    request.jwt = fastify.jwt;
  });

  fastify.decorate('authenticate', async (request: FastifyRequest) => {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      request.authorized = false;
      return;
    }

    const token = extractToken(authHeader);
    await verifyToken(request);

    const payload = decodeToken(request, token);
    const user = await fetchUser(payload.id);

    request.authorized = true;
    request.me = user;
  });
};

// Extract token from the Authorization header
function extractToken(authHeader: string): string {
  return authHeader.split(' ')[1];
}

// Verify the token using Fastify's JWT plugin
async function verifyToken(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch (err) {
    request.log.error(err);
    throw new UnAuthorizedException('Invalid token');
  }
}

// Decode the token and validate its payload
function decodeToken(request: FastifyRequest, token: string): { id: number } {
  const payload = request.jwt.decode(token);
  if (!isValidPayload(payload)) {
    throw new UnAuthorizedException('Invalid token');
  }
  return payload;
}

// Validate the payload structure
function isValidPayload(payload: unknown): payload is { id: number } {
  return payload !== null && typeof payload === 'object' && 'id' in payload;
}

// Fetch the user from the database by ID
async function fetchUser(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnAuthorizedException('Invalid token');
  }
  return user;
}

export default fp(jwtPlugin);

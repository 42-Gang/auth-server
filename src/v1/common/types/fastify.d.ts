import 'fastify';

import { User } from '@prisma/client';
import { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    jwt: JWT;
    authorized: boolean;
    me: User;
  }
}

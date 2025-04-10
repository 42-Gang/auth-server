import 'fastify';

import { User } from '@prisma/client';
import { JWT } from '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    headers: {
      'X-Authenticated': string | undefined | string[];
      'X-User-Id': string | undefined;
    };

    authenticated: boolean;
    userId: number | undefined;
  }
}

import { FastifyInstance } from 'fastify';

import authRoutes from './apis/auth/auth.route.js';
import oauthRoutes from './apis/oauth/oauth.route.js';
import { context, trace } from '@opentelemetry/api';

export default async function routeV1(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, _) => {
    const span = trace.getSpan(context.active());
    if (!span) return;

    span.updateName(`${request.method} ${request.url}`);
  });

  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(oauthRoutes, { prefix: '/oauth' });
}

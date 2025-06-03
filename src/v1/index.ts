import { FastifyInstance } from 'fastify';

import authRoutes from './apis/auth/auth.route.js';
import oauthRoutes from './apis/oauth/oauth.route.js';

export default async function routeV1(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(oauthRoutes, { prefix: '/oauth' });
}

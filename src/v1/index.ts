import { FastifyInstance } from 'fastify';

import authRoutes from './apis/auth/auth.route.js';

export default async function routeV1(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/auth' });
}

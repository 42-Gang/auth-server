import { FastifyInstance } from 'fastify';

import authRoutes from './apis/auth/auth.route.js';
import usersRoutes from './apis/users/users.route.js';

export default async function routeV1(fastify: FastifyInstance) {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(usersRoutes, { prefix: '/users' });
}

import { FastifyInstance } from 'fastify';

import AuthController from '../../apis/auth/auth.controller.js';
import {
  loginRequestSchema,
  loginResponseSchema,
  signupRequestSchema,
  signupResponseSchema,
} from './auth.schema.js';
import { addRoutes, Route } from '../../../plugins/router.js';

export default async function authRoutes(fastify: FastifyInstance) {
  const authController: AuthController = fastify.diContainer.resolve('authController');

  const routes: Array<Route> = [
    {
      method: 'POST',
      url: '/',
      handler: authController.signup,
      options: {
        schema: {
          tags: ['auth'],
          body: signupRequestSchema,
          response: {
            201: signupResponseSchema,
          },
        },
      },
    },
    {
      method: 'POST',
      url: '/login',
      handler: authController.login,
      options: {
        schema: {
          tags: ['auth'],
          body: loginRequestSchema,
          response: {
            201: loginResponseSchema,
          },
        },
      },
    },
  ];
  await addRoutes(fastify, routes);
}

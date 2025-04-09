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
          description: '회원가입',
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
          description: '로그인',
          tags: ['auth'],
          body: loginRequestSchema,
          response: {
            201: loginResponseSchema,
          },
        },
      },
    },
    {
      method: 'POST',
      url: '/mail',
      handler: authController.requestVerificationCode,
      options: {},
    },
  ];
  await addRoutes(fastify, routes);
}

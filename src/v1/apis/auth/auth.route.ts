import { FastifyInstance } from 'fastify';

import AuthController from '../../apis/auth/auth.controller.js';
import { addRoutes, Route } from '../../../plugins/router.js';
import { signupInputSchema, signupResponseSchema } from './schemas/signup.schema.js';
import { loginInputSchema, loginResponseSchema } from './schemas/login.schema.js';
import {
  requestVerificationCodeInputSchema,
  requestVerificationCodeResponseSchema,
} from './schemas/requestVerificationCode.schema.js';

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
          body: signupInputSchema,
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
          body: loginInputSchema,
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
      options: {
        schema: {
          description: '메일 인증 요청',
          tags: ['auth'],
          body: requestVerificationCodeInputSchema,
          response: {
            200: requestVerificationCodeResponseSchema,
          },
        },
      },
    },
  ];
  await addRoutes(fastify, routes);
}

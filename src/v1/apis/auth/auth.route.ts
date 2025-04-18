import { FastifyInstance } from 'fastify';

import AuthController from '../../apis/auth/auth.controller.js';
import { addRoutes, Route } from '../../../plugins/router.js';
import { signupInputSchema, signupResponseSchema } from './schemas/signup.schema.js';
import { loginInputSchema, loginResponseSchema } from './schemas/login.schema.js';
import {
  requestVerificationCodeInputSchema,
  requestVerificationCodeResponseSchema,
} from './schemas/requestVerificationCode.schema.js';
import { coreResponseSchema } from '../../common/schema/core.schema.js';

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
        auth: false, // 회원가입은 인증이 필요하지 않음
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
        auth: false, // 로그인은 인증이 필요하지 않음
      },
    },
    {
      method: 'GET',
      url: '/logout',
      handler: authController.logout,
      options: {
        schema: {
          description: '로그아웃',
          tags: ['auth'],
        },
        auth: true, // 로그아웃은 인증이 필요함
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
        auth: false, // 메일 인증 요청은 인증이 필요하지 않음
      },
    },
    {
      method: 'POST',
      url: '/refresh-token',
      handler: authController.refreshAccessToken,
      options: {
        schema: {
          description: 'Access token 재발급',
          tags: ['auth'],
          response: {
            200: loginResponseSchema,
          },
        },
        auth: false, // Access token 재발급은 인증이 필요하지 않음
      },
    },
    {
      method: '*',
      url: '/validate-token',
      handler: authController.verifyAccessToken,
      options: {
        schema: {
          description: 'Access token 검증',
          tags: ['auth - validate token (internal)'],
          response: {
            200: coreResponseSchema,
          },
        },
        auth: false,
      },
    },
    {
      method: 'GET',
      url: '/health-check',
      handler: () => 'hello world',
      options: {
        auth: false,
      },
    },
  ];
  await addRoutes(fastify, routes);
}

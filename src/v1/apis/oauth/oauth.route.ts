import { FastifyInstance } from 'fastify';
import { addRoutes, Route } from '../../../plugins/router.js';
import OAuthController from './oauth.controller.js';
import { oauthProviderParamSchema } from './schema/oauth.schema.js';
import { handleCallbackBodySchema } from './schema/handle-callback.schema.js';
import { handleCallbackResponseSchema } from './services/oauth.service.js';

export default async function oauthRoutes(fastify: FastifyInstance) {
  const oauthController: OAuthController = fastify.diContainer.resolve('oauthController');

  const routes: Array<Route> = [
    {
      method: 'GET',
      url: '/:provider',
      handler: oauthController.getLoginUrl,
      options: {
        schema: {
          tags: ['oauth'],
          description: 'OAuth 시작',
          params: oauthProviderParamSchema,
          response: {
            302: { type: 'null' },
          },
        },
        auth: false,
      },
    },
    {
      method: 'POST',
      url: '/:provider/token',
      handler: oauthController.handleCallback,
      options: {
        schema: {
          tags: ['oauth'],
          description: 'OAuth 인증 후 회원가입 또는 로그인 처리',
          params: oauthProviderParamSchema,
          body: handleCallbackBodySchema,
          response: {
            201: handleCallbackResponseSchema,
          },
        },
        auth: false,
      },
    },
  ];
  await addRoutes(fastify, routes);
}

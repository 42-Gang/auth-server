import { FastifyInstance } from 'fastify';
import { addRoutes, Route } from '../../../plugins/router.js';
import OAuthController from './oauth.controller.js';
import {
  handleOAuthFlowBodySchema,
  handleOAuthFlowResponseSchema,
} from './schema/handle-oauth-flow.schema.js';
import { oauthProviderParamSchema } from './schema/oauth.schema.js';

export default async function oauthRoutes(fastify: FastifyInstance) {
  const oauthController: OAuthController = fastify.diContainer.resolve('oauthController');

  const routes: Array<Route> = [
    {
      method: 'GET',
      url: '/:provider',
      handler: oauthController.getAuthorizationUrl,
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
      handler: oauthController.handleOAuthFlow,
      options: {
        schema: {
          tags: ['oauth'],
          description: 'OAuth 인증 후 회원가입 또는 로그인 처리',
          params: oauthProviderParamSchema,
          body: handleOAuthFlowBodySchema,
          response: {
            201: handleOAuthFlowResponseSchema,
          },
        },
        auth: false,
      },
    },
  ];
  await addRoutes(fastify, routes);
}

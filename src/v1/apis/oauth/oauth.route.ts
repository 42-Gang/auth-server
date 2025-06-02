import { FastifyInstance } from 'fastify';
import { addRoutes, Route } from 'src/plugins/router.js';
import OAuthController from './oauth.controller.js';
import {
  oAuthProviderSchema,
  handleOAuthRequestSchema,
  handleOAuthResponseSchema,
} from './oauth.schema.js';

export default async function oauthRoutes(fastify: FastifyInstance) {
  const oauthController: OAuthController = fastify.diContainer.resolve('oauthController');

  const routes: Array<Route> = [
    {
      method: 'GET',
      url: '/oauth/:provider',
      handler: oauthController.getAuthorizationUrl,
      options: {
        schema: {
          tags: ['oauth'],
          description: 'OAuth 시작',
          params: oAuthProviderSchema,
          response: {
            302: { type: 'null' }, // Redirect는 응답 본문이 없으므로 null로 설정
          },
        },
        auth: false,
      },
    },
    {
      method: 'POST',
      url: '/oauth/:provider/token',
      handler: oauthController.handleOAuthFlow,
      options: {
        schema: {
          tags: ['oauth'],
          description: 'OAuth 인증 후 회원가입 또는 로그인 처리',
          params: oAuthProviderSchema,
          body: handleOAuthRequestSchema,
          response: {
            200: handleOAuthResponseSchema,
          },
        },
        auth: false,
      },
    },
  ];
  await addRoutes(fastify, routes);
}

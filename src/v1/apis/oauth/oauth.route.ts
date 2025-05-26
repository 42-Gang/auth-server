import { FastifyInstance } from 'fastify';
import { Route } from 'src/plugins/router.js';
import OAuthController from './oauth.controller.js';
import { beginOAuthProviderSchema, beginOAuthResponseSchema } from './schemas/beginOAuth.schema.js';

export default async function oauthRoutes(fastify: FastifyInstance) {
    const oauthController: OAuthController = fastify.diContainer.resolve('oauthController');

    const routes: Array<Route> = [
        {
            method: 'GET',
            url: '/',
            handler: oauthController.beginOAuth,
            options: {
                schema: {
                    tags: ['oauth'],
                    description: 'OAuth 시작',
                    params: beginOAuthProviderSchema,
                    response: {
                        302: beginOAuthResponseSchema,
                    },
                    headers: 

                },
                auth: false,
            } 
        }
    ];
}    
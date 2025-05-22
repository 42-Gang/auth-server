import { FastifyInstance } from 'fastify';
import { Route } from 'src/plugins/router.js';
import OAuthController from './oauth.controller.js';

export default async function oauthRoutes(fastify: FastifyInstance) {
    const oauthController: OAuthController = fastify.diContainer.resolve('oauthController');

    const routes: Array<Route> = [
        {
            method: 'GET',
            url: '/',
            handler: oauthController.beginOAuth(),
            options: {
                schema: {
                    querystring: 
                }
            } 
        }
    ];
}
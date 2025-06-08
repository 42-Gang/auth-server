import { FastifyInstance } from 'fastify';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { asClass, asValue, Lifetime } from 'awilix';
import prisma from './prisma.js';
import { GotClient } from './http.client.js';
import TokenGenerator from '../v1/apis/auth/TokenGenerator.js';
import jwt from 'jsonwebtoken';
import { JwtModule } from './jwt.module.js';
import { jwtConfig } from '../config.js';
import GoogleOauthClient from '../v1/apis/oauth/services/googleOauthClient.js';

export async function setDiContainer(server: FastifyInstance) {
  server.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
    strictBooleanEnforced: true,
  });
  diContainer.register({
    prisma: asValue(prisma),
    logger: asValue(server.log),
    redisClient: asValue(server.redis),
    httpClient: asValue(
      new GotClient({
        get throwHttpErrors(): boolean {
          return false;
        },
      }),
    ),
  });
  diContainer.register({
    jwt: asValue(jwt),
    jwtSecret: asValue(jwtConfig.secret),
    jwtExpiresIn: asValue(jwtConfig.expiresIn),
    refreshTokenExpiresIn: asValue(process.env.JWT_REFRESH_EXPIRES_IN),
    jwtModule: asClass(JwtModule, {
      injectionMode: 'CLASSIC',
      lifetime: Lifetime.SINGLETON,
    }),
    tokenGenerator: asClass(TokenGenerator, {
      injectionMode: 'CLASSIC',
      lifetime: Lifetime.SINGLETON,
    }),
  });
  diContainer.register({
    googleClientId: asValue(process.env.GOOGLE_CLIENT_ID),
    googleClientSecret: asValue(process.env.GOOGLE_CLIENT_SECRET),
    googleRedirectUrl: asValue(process.env.GOOGLE_REDIRECT_URI),
    googleOauthClient: asClass(GoogleOauthClient, {
      injectionMode: 'CLASSIC',
      lifetime: Lifetime.SINGLETON,
    }),
  });

  const NODE_EXTENSION = process.env.NODE_ENV == 'dev' ? 'ts' : 'js';
  await diContainer.loadModules(
    [
      `./**/src/**/*.repository.${NODE_EXTENSION}`,
      `./**/src/**/*.controller.${NODE_EXTENSION}`,
      `./**/src/**/*.service.${NODE_EXTENSION}`,
    ],
    {
      esModules: true,
      formatName: 'camelCase',
      resolverOptions: {
        lifetime: Lifetime.SINGLETON,
        register: asClass,
        injectionMode: 'CLASSIC',
      },
    },
  );
}

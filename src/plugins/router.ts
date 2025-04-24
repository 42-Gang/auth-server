import { RouteShorthandOptions, RouteHandlerMethod } from 'fastify';
import { FastifyInstance } from 'fastify/types/instance.js';

// 권한 필요 여부를 표현할 때 추가 옵션 타입 확장
interface RouteOptions extends RouteShorthandOptions {
  auth?: boolean; // 권한 필요 여부 (옵셔널)
  internalOnly?: boolean; // 내부 API 여부 (옵셔널)
  description?: string; // 설명 (옵셔널)
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '*';
  url: string;
  handler: RouteHandlerMethod;
  options: RouteOptions;
}

export async function addRoutes(fastify: FastifyInstance, routes: Route[]) {
  routes.forEach((route) => {
    const method =
      route.method === '*'
        ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']
        : [route.method];

    if (route.options.internalOnly === true) {
      fastify.route({
        method,
        url: route.url,
        handler: route.handler,
        schema: route.options.schema,
        onRequest: fastify.internalOnly,
      });
      return;
    }

    // 권한 필요 없으면 그대로 등록
    if (route.options.auth === false) {
      fastify.route({
        method,
        url: route.url,
        handler: route.handler,
        schema: route.options.schema,
      });
      return;
    }

    fastify.route({
      method: route.method,
      url: route.url,
      handler: route.handler,
      schema: route.options.schema,
      preHandler: fastify.authenticate, // ✅ 권한 확인 미들웨어
    });
  });
}

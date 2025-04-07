import { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import routeV1 from './v1/index.js';
import { STATUS } from './v1/common/constants/status.js';

function setErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    fastify.log.error(error);

    const statusCode: number = error.statusCode || 500;
    reply.code(statusCode).send({
      status: STATUS.ERROR,
      message: error.message,
    });
  });
}

export default async function app(fastify: FastifyInstance) {
  setErrorHandler(fastify);

  fastify.register(routeV1, { prefix: '/v1' });
}

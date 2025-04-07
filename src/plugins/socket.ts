import { Server } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { registerSocketGateway } from '../v1/sockets/gateway.js';

export function createSocketServer(fastify: FastifyInstance) {
  const socket = new Server(fastify.server, {
    cors: {
      origin: '*',
    },
  });

  socket.on('connection', (socket) => {
    fastify.log.info('Client connected');
    socket.on('disconnect', () => {
      fastify.log.info('Client disconnected');
    });
  });
  registerSocketGateway(socket);
  return socket;
}

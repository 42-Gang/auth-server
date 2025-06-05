import closeWithGrace from 'close-with-grace';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import app from './app.js';
import { setDiContainer } from './plugins/container.js';
import { FastifyInstance } from 'fastify';
import { fastifyRedis } from '@fastify/redis';
import swaggerPlugin from './plugins/swagger/swagger-plugin.js';
import { Server } from 'socket.io';
import { connectKafkaProducer } from './plugins/kafka.js';
import { fastifyCookie } from '@fastify/cookie';
import { startMailConsumer } from './mail/mail.consumer.js';
import fastifyCors from '@fastify/cors';

export async function configureServer(server: FastifyInstance) {
  server.setValidatorCompiler(validatorCompiler); // Fastify 유효성 검사기 설정
  server.setSerializerCompiler(serializerCompiler); // 응답 데이터 직렬화 설정
  server.withTypeProvider<ZodTypeProvider>(); // Zod 타입 프로바이더 설정
}

export async function registerPlugins(server: FastifyInstance) {
  await server.register(fastifyCors, {
    origin: 'http://localhost:4242',
    credentials: true,
  });
  await server.register(fastifyCookie);
  await registerRedisPlugin(server); // Redis 플러그인 등록
  await setDiContainer(server); // 의존성 주입 컨테이너 설정
  await registerSwaggerPlugin(server); // Swagger 플러그인 등록
  await connectKafkaProducer(); // Kafka 프로듀서 연결
  await server.register(app, { prefix: '/api' }); // REST API 라우트 등록
  startMailConsumer();
}

export async function setupGracefulShutdown(server: FastifyInstance, socket: Server) {
  closeWithGrace(
    {
      delay: Number(process.env.FASTIFY_CLOSE_GRACE_PERIOD) || 500,
    },
    async ({ err }) => {
      if (err != null) {
        server.log.error(err);
      }
      await server.close();
      await socket.close();
    },
  );
}

async function registerRedisPlugin(server: FastifyInstance) {
  await server.register(fastifyRedis, {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    logLevel: 'trace',
  });
}

async function registerSwaggerPlugin(server: FastifyInstance) {
  await server.register(swaggerPlugin);
}

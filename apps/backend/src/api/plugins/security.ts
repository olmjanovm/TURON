import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import { env } from '../../config.js';

export default fp(async function securityPlugin(fastify: FastifyInstance) {
  // 1. Security Headers
  await fastify.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  });

  // 2. Rate Limiting
  await fastify.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Sekundiga so'rovlar soni oshib ketdi. Iltimos ${context.after} kutib turing.`
    })
  });
});

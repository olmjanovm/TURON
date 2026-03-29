import { FastifyInstance } from 'fastify';
import { telegramAuthHandler } from './auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/telegram', {
    schema: {
      body: {
        type: 'object',
        required: ['initData'],
        properties: {
          initData: { type: 'string' }
        }
      }
    }
  }, telegramAuthHandler);
}

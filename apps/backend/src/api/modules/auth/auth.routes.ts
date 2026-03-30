import { FastifyInstance } from 'fastify';
import { telegramAuthHandler } from './auth.controller';
import { TelegramAuthSchema } from '../../utils/schemas';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/telegram', {
    schema: {
      body: TelegramAuthSchema
    }
  }, telegramAuthHandler);
}

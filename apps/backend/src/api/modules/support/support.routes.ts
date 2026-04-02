import { FastifyInstance } from 'fastify';
import { getSupportThread, postSupportMessage } from './support.controller.js';
import { SupportMessageSchema, SupportThreadQuerySchema } from '../../utils/schemas.js';

export default async function supportRoutes(fastify: FastifyInstance) {
  fastify.get('/thread', {
    schema: {
      querystring: SupportThreadQuerySchema,
    },
  }, getSupportThread);

  fastify.post('/messages', {
    schema: {
      body: SupportMessageSchema,
    },
  }, postSupportMessage);
}

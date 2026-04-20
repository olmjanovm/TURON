import { FastifyInstance } from 'fastify';
import { UserRoleEnum } from '@turon/shared';
import { getSettings, updateSettings, getOpenStatus } from './restaurant.controller.js';

export default async function restaurantRoutes(fastify: FastifyInstance) {
  // Admin-only routes
  fastify.addHook('preHandler', fastify.authorize([UserRoleEnum.ADMIN]));

  fastify.get('/settings', getSettings);
  fastify.patch('/settings', updateSettings);
  fastify.get('/open-status', getOpenStatus);
}

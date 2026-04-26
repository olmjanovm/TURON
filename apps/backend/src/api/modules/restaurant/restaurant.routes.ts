import { FastifyInstance } from 'fastify';
import { UserRoleEnum } from '@turon/shared';
import { getSettings, updateSettings, getOpenStatus, uploadLogo } from './restaurant.controller.js';
import { RestaurantSettingsPatchSchema } from '../../utils/schemas.js';

export default async function restaurantRoutes(fastify: FastifyInstance) {
  // Admin-only routes
  fastify.addHook('preHandler', fastify.authorize([UserRoleEnum.ADMIN]));

  fastify.get('/settings', getSettings);
  fastify.patch('/settings', {
    schema: {
      body: RestaurantSettingsPatchSchema,
    },
  }, updateSettings);
  fastify.post('/logo', uploadLogo);
  fastify.get('/open-status', getOpenStatus);
}

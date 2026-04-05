import { FastifyInstance } from 'fastify';
import { reportsRoutes as controller } from './reports.controller.js';
import { UserRoleEnum } from '@turon/shared';

export default async function reportsRoutes(fastify: FastifyInstance) {
  fastify.register(async (admin) => {
    // Only admins can access reports
    admin.addHook('preHandler', admin.authorize([UserRoleEnum.ADMIN]));
    
    // Register the routes defined in the controller
    admin.register(controller);
  });
}

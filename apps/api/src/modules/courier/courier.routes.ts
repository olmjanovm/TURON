import { FastifyInstance } from 'fastify';
import { getCourierOrders, getCourierOrderDetail, updateOrderStage } from './courier.controller';
import { UserRoleEnum } from '@turon/shared';

export default async function courierRoutes(fastify: FastifyInstance) {
  // All routes in this module require COURIER role
  fastify.addHook('preHandler', fastify.authorize([UserRoleEnum.COURIER, UserRoleEnum.ADMIN]));

  fastify.get('/orders', getCourierOrders);
  fastify.get('/order/:id', getCourierOrderDetail);
  fastify.patch('/order/:id/stage', {
    schema: {
        body: {
            type: 'object',
            required: ['stage'],
            properties: {
                stage: { type: 'string' }
            }
        }
    }
  }, updateOrderStage);
}

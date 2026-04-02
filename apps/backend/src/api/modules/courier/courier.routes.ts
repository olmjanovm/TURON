import { FastifyInstance } from 'fastify';
import { getCourierOrders, getCourierOrderDetail, updateOrderStage, updateCourierLocation } from './courier.controller';
import { IdParamSchema, TrackingLocationSchema, UpdateDeliveryStageSchema } from '../../utils/schemas';
import { UserRoleEnum } from '@turon/shared';

export default async function courierRoutes(fastify: FastifyInstance) {
  // All routes in this module require COURIER role
  fastify.addHook('preHandler', fastify.authorize([UserRoleEnum.COURIER]));

  fastify.get('/orders', getCourierOrders);
  
  fastify.get('/order/:id', {
    schema: {
      params: IdParamSchema
    }
  }, getCourierOrderDetail);
  
  fastify.patch('/order/:id/stage', {
    schema: {
      params: IdParamSchema,
      body: UpdateDeliveryStageSchema
    }
  }, updateOrderStage);

  fastify.patch('/order/:id/location', {
    schema: {
      params: IdParamSchema,
      body: TrackingLocationSchema,
    }
  }, updateCourierLocation);
}

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth';
import authRoutes from './modules/auth/auth.routes';
import courierRoutes from './modules/courier/courier.routes';

export default fp(async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  // 1. Basic Plugins
  fastify.register(cors);
  
  // 2. Auth Plugin (JWT + Guards)
  fastify.register(authPlugin);

  // 3. Register Modules
  fastify.register(authRoutes, { prefix: '/auth' });
  
  // Register courier module with authentication guard
  fastify.register(async (instance) => {
    instance.addHook('preHandler', instance.authenticate);
    instance.register(courierRoutes, { prefix: '/courier' });
  });

  // 4. Health Check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
});

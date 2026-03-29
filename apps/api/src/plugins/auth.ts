import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserRoleEnum } from '@turon/shared';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key'
  });

  // Authenticate middleware
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // Role guard middleware
  fastify.decorate('authorize', function (allowedRoles: UserRoleEnum[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user as any;
      if (!user || !allowedRoles.includes(user.role)) {
        return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
      }
    };
  };
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
    authorize: (allowedRoles: UserRoleEnum[]) => any;
  }
}

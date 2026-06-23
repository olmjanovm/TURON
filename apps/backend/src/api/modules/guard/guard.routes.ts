import { FastifyInstance } from 'fastify';
import { approveMyJoinRequests } from './guard.controller.js';

export default async function guardRoutes(fastify: FastifyInstance) {
  // Authenticated (app.ts `authenticated` guruhida ro'yxatdan o'tadi).
  fastify.post('/approve', approveMyJoinRequests);
}

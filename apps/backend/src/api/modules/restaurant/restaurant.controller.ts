import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getRestaurantOpenStatus,
  getRestaurantSettings,
  patchRestaurantSettings,
  type PatchRestaurantSettings,
} from '../../../services/restaurant-settings.service.js';

export async function getSettings(_request: FastifyRequest, reply: FastifyReply) {
  const settings = await getRestaurantSettings();
  return reply.send(settings);
}

export async function updateSettings(
  request: FastifyRequest<{ Body: PatchRestaurantSettings }>,
  reply: FastifyReply,
) {
  const user = request.user as any;
  const settings = await patchRestaurantSettings(request.body, user?.id);
  return reply.send(settings);
}

export async function getOpenStatus(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send(await getRestaurantOpenStatus());
}

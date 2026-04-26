import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getRestaurantOpenStatus,
  getRestaurantSettings,
  patchRestaurantSettings,
  type PatchRestaurantSettings,
} from '../../../services/restaurant-settings.service.js';
import { StorageService } from '../../../services/storage.service.js';

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

export async function uploadLogo(
  request: FastifyRequest<{ Body: { imageBase64: string } }>,
  reply: FastifyReply,
) {
  const imageBase64 = request.body?.imageBase64;

  if (!imageBase64) {
    return reply.code(400).send({ message: 'Rasm yuborilmadi' });
  }

  const url = await StorageService.uploadBase64(imageBase64, 'menu');
  if (!url) {
    return reply.code(500).send({ message: 'Logo yuklab bo‘lmadi' });
  }

  return reply.send({ url });
}

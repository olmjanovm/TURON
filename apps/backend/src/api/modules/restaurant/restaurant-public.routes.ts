import type { FastifyInstance } from 'fastify';
import { getRestaurantSettings } from '../../../services/restaurant-settings.service.js';

/**
 * Public restaurant routes — auth talab qilmaydi.
 * Customer/courier panel'lari restoran nomi va logosini olish uchun ishlatadi.
 *
 * Maxsus admin sozlamalari (telefon, manzil, ishlash vaqti) bu yerda yo'q —
 * faqat ommaviy identity (name + logoUrl).
 */
export default async function restaurantPublicRoutes(fastify: FastifyInstance) {
  fastify.get('/identity', async (_request, reply) => {
    const settings = await getRestaurantSettings();
    return reply
      .header('cache-control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
      .send({
        name: settings.name,
        logoUrl: settings.logoUrl ?? null,
        cardNumber: settings.cardNumber ?? '',
      });
  });
}

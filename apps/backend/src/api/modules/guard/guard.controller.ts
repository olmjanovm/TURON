import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { getBotState } from '../../../services/telegram-bot.service.js';
import { approvePendingJoinRequests } from '../../../services/bot/guard-mode.service.js';

/**
 * POST /guard/approve — Mini App signali. Foydalanuvchi ro'yxatdan/loyallikdan
 * o'tgach chaqiriladi. FAQAT o'z (JWT) telegramId'si bo'yicha kutilayotgan
 * join so'rovlarini tasdiqlaydi → approveChatJoinRequest. Boshqa birovnikini emas.
 */
export async function approveMyJoinRequests(request: FastifyRequest, reply: FastifyReply) {
  const requester = request.user as { id: string };

  const user = await prisma.user.findUnique({
    where: { id: requester.id },
    select: { telegramId: true },
  });
  if (!user?.telegramId) {
    return reply.status(400).send({ error: 'Telegram hisobi topilmadi' });
  }

  try {
    const approved = await approvePendingJoinRequests(getBotState().bot.telegram, {
      userTelegramId: user.telegramId,
      userId: requester.id,
    });
    return reply.send({ approved });
  } catch (error) {
    return reply
      .status(500)
      .send({ error: error instanceof Error ? error.message : "Tasdiqlab bo'lmadi" });
  }
}

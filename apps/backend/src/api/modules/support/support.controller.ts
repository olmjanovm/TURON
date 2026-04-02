import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { forwardSupportMessageToAdmin } from '../../../services/telegram-bot.service.js';
import { SupportService } from '../../../services/support.service.js';

async function ensureOwnedOrder(orderId: string, requester: any) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      orderNumber: true,
    },
  });

  if (!order || order.userId !== requester.id) {
    return null;
  }

  return order;
}

export async function getSupportThread(
  request: FastifyRequest<{
    Querystring: {
      orderId?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const orderId = request.query.orderId || null;

  if (orderId) {
    const order = await ensureOwnedOrder(orderId, requester);
    if (!order) {
      return reply.status(404).send({ error: 'Buyurtma topilmadi yoki sizga tegishli emas' });
    }
  }

  const thread = await SupportService.getCustomerThread(requester.id, orderId);
  return reply.send(thread);
}

export async function postSupportMessage(
  request: FastifyRequest<{
    Body: {
      orderId?: string;
      text: string;
      topic?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const orderId = request.body.orderId || null;
  const trimmedText = request.body.text.trim();
  const topic = request.body.topic?.trim();

  let orderNumber: string | undefined;
  if (orderId) {
    const order = await ensureOwnedOrder(orderId, requester);
    if (!order) {
      return reply.status(404).send({ error: 'Buyurtma topilmadi yoki sizga tegishli emas' });
    }

    orderNumber = String(order.orderNumber);
  }

  const result = await SupportService.createCustomerMessage({
    userId: requester.id,
    orderId,
    senderLabel: requester.fullName || 'Mijoz',
    text: trimmedText,
  });

  try {
    const telegramMeta = await forwardSupportMessageToAdmin({
      orderNumber,
      customerName: requester.fullName,
      senderLabel: requester.fullName || 'Mijoz',
      text: trimmedText,
      topic,
    });

    if (result.messageId) {
      await SupportService.attachTelegramMetadata(result.messageId, {
        telegramChatId: telegramMeta.chatId,
        telegramMessageId: telegramMeta.messageId,
      });
    }
  } catch (error) {
    console.error('Failed to forward support message to Telegram admin chat.', error);
    return reply.status(503).send({
      error: "Support operatoriga ulanishda muammo bo'ldi. Birozdan so'ng qayta urinib ko'ring.",
    });
  }

  const thread = await SupportService.getCustomerThread(requester.id, orderId);
  return reply.status(201).send(thread);
}

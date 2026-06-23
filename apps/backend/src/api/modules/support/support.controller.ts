import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { forwardSupportMessageToAdmin } from '../../../services/telegram-bot.service.js';
import { SupportService } from '../../../services/support.service.js';
import { OrderChatService } from '../../../services/order-chat.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

// ── Kuryer chatlar (xabarlar markazi #5) ────────────────────────────────────

/** GET /support/courier-threads — mijoz yozishган kuryerlar ro'yxati. */
export async function getCourierThreads(request: FastifyRequest, reply: FastifyReply) {
  const requester = request.user as any;
  const threads = await OrderChatService.getCustomerCourierThreads(requester.id);
  return reply.send(threads);
}

/** GET /support/courier-threads/:courierId/messages — bitta kuryer bilan suhbat tarixi. */
export async function getCourierThread(
  request: FastifyRequest<{ Params: { courierId: string } }>,
  reply: FastifyReply,
) {
  const requester = request.user as any;
  const { courierId } = request.params;
  if (!UUID_RE.test(courierId)) {
    return reply.status(404).send({ error: 'Kuryer topilmadi' });
  }

  const thread = await OrderChatService.getCustomerCourierThread(requester.id, courierId);
  if (!thread || thread.messages.length === 0) {
    return reply.status(404).send({ error: 'Kuryer bilan suhbat topilmadi' });
  }

  // Ochilganda kuryerning o'qilmagan xabarlarini read qilamiz
  await OrderChatService.markCustomerCourierRead(requester.id, courierId);
  return reply.send(thread);
}

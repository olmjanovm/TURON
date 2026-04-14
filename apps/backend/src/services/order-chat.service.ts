import { ChatSenderRoleEnum } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { orderTrackingService } from './order-tracking.service.js';

export interface ChatMessageDto {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'COURIER' | 'CUSTOMER';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

function serializeChatMessage(msg: any): ChatMessageDto {
  return {
    id: msg.id,
    orderId: msg.orderId,
    senderId: msg.senderId,
    senderRole: msg.senderRole as 'COURIER' | 'CUSTOMER',
    senderName: msg.sender?.fullName ?? 'Foydalanuvchi',
    content: msg.content,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
  };
}

export class OrderChatService {
  /**
   * Verify the caller has access to this order's chat.
   * - CUSTOMER: must be the order owner
   * - COURIER: must have been assigned at any point
   */
  static async verifyAccess(orderId: string, userId: string, role: 'COURIER' | 'CUSTOMER') {
    if (role === 'CUSTOMER') {
      const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
      return order !== null;
    }
    const assignment = await prisma.courierAssignment.findFirst({
      where: { orderId, courierId: userId },
    });
    return assignment !== null;
  }

  static async getMessages(orderId: string): Promise<ChatMessageDto[]> {
    const messages = await prisma.orderChatMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true } } },
    });
    return messages.map(serializeChatMessage);
  }

  static async sendMessage(
    orderId: string,
    senderId: string,
    senderRole: 'COURIER' | 'CUSTOMER',
    content: string,
  ): Promise<ChatMessageDto> {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 500) {
      throw new Error('Xabar 1–500 belgi bo\'lishi kerak');
    }

    const msg = await prisma.orderChatMessage.create({
      data: {
        orderId,
        senderId,
        senderRole: senderRole as ChatSenderRoleEnum,
        content: trimmed,
      },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    const dto = serializeChatMessage(msg);

    // Publish via SSE so the other party receives it instantly
    orderTrackingService.publishChatMessage(orderId, dto);

    // ── 60-second unread reminder ────────────────────────────────────────────
    // If the recipient hasn't opened the chat after 1 minute, push a
    // "chat.unread_reminder" event so the frontend can show a "call?" prompt.
    const recipientRole: 'COURIER' | 'CUSTOMER' =
      senderRole === 'COURIER' ? 'CUSTOMER' : 'COURIER';
    const msgId = msg.id;

    setTimeout(async () => {
      try {
        const stillUnread = await prisma.orderChatMessage.findFirst({
          where: { id: msgId, isRead: false },
          select: { id: true },
        });
        if (stillUnread) {
          orderTrackingService.publishChatUnreadReminder(orderId, recipientRole, msgId);
        }
      } catch { /* best-effort — never crash the process */ }
    }, 60_000);

    return dto;
  }

  static async markRead(orderId: string, readerRole: 'COURIER' | 'CUSTOMER') {
    // Mark all messages sent by the OTHER role as read
    const senderRole: ChatSenderRoleEnum =
      readerRole === 'COURIER' ? ChatSenderRoleEnum.CUSTOMER : ChatSenderRoleEnum.COURIER;

    const updated = await prisma.orderChatMessage.updateMany({
      where: { orderId, senderRole, isRead: false },
      data: { isRead: true },
    });

    // Notify the sender their messages were read (read receipt)
    if (updated.count > 0) {
      orderTrackingService.publishChatRead(orderId, readerRole);
    }
  }

  static async getUnreadCount(orderId: string, readerRole: 'COURIER' | 'CUSTOMER'): Promise<number> {
    const senderRole: ChatSenderRoleEnum =
      readerRole === 'COURIER' ? ChatSenderRoleEnum.CUSTOMER : ChatSenderRoleEnum.COURIER;

    return prisma.orderChatMessage.count({
      where: { orderId, senderRole, isRead: false },
    });
  }
}

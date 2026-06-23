import { ChatSenderRoleEnum, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { orderTrackingService } from './order-tracking.service.js';
import { scheduleFallback, cancelFallbacksForOrder, getFallbackDelayMs } from './admin-chat-fallback.service.js';
import { SupportService } from './support.service.js';
import { SocketEvents } from './socket-events.service.js';

export interface ChatMessageDto {
  id: string;
  orderId: string;
  senderId: string;
  senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN';
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  /** Only set on ADMIN messages. null = visible to all parties. */
  targetRole: 'COURIER' | 'CUSTOMER' | null;
}

function serializeChatMessage(msg: any): ChatMessageDto {
  return {
    id: msg.id,
    orderId: msg.orderId,
    senderId: msg.senderId,
    senderRole: msg.senderRole as 'COURIER' | 'CUSTOMER' | 'ADMIN',
    senderName: msg.sender?.fullName ?? 'Foydalanuvchi',
    content: msg.content,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
    targetRole: (msg.targetRole as 'COURIER' | 'CUSTOMER' | null) ?? null,
  };
}

export class OrderChatService {
  /**
   * Verify the caller has access to this order's chat.
   * - CUSTOMER: must be the order owner
   * - COURIER: must have been assigned at any point
   * - ADMIN: always has access
   */
  static async verifyAccess(orderId: string, userId: string, role: 'COURIER' | 'CUSTOMER' | 'ADMIN') {
    if (role === 'ADMIN') return true;
    if (role === 'CUSTOMER') {
      const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
      return order !== null;
    }
    const assignment = await prisma.courierAssignment.findFirst({
      where: { orderId, courierId: userId },
    });
    return assignment !== null;
  }

  /**
   * Resolve who should receive a realtime chat event for this order.
   * Admins always (role room). Customer = order owner; courier = most-recent
   * assignment. `targetRole` (admin-directed messages) narrows the peer set so
   * an admin→courier message is never pushed to the customer (and vice versa).
   * Read receipts pass targetRole=null to reach every participant.
   */
  private static async resolveRecipients(
    orderId: string,
    targetRole: 'COURIER' | 'CUSTOMER' | null,
  ): Promise<{ userIds: string[]; roles: Array<'ADMIN'> }> {
    const userIds: string[] = [];

    if (targetRole !== 'COURIER') {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
      if (order?.userId) userIds.push(order.userId);
    }
    if (targetRole !== 'CUSTOMER') {
      const assignment = await prisma.courierAssignment.findFirst({
        where: { orderId },
        orderBy: { assignedAt: 'desc' },
        select: { courierId: true },
      });
      if (assignment?.courierId) userIds.push(assignment.courierId);
    }

    return { userIds, roles: ['ADMIN'] };
  }

  /**
   * Fetch messages for an order, filtered by the requester's role.
   * - ADMIN sees ALL messages.
   * - COURIER sees: non-admin messages + admin messages targeted at COURIER (or null).
   * - CUSTOMER sees: non-admin messages + admin messages targeted at CUSTOMER (or null).
   */
  static async getMessages(
    orderId: string,
    readerRole: 'COURIER' | 'CUSTOMER' | 'ADMIN' = 'ADMIN',
  ): Promise<ChatMessageDto[]> {
    const where =
      readerRole === 'ADMIN'
        ? { orderId }
        : {
            orderId,
            OR: [
              // Non-admin messages: always visible
              { senderRole: { in: [ChatSenderRoleEnum.COURIER, ChatSenderRoleEnum.CUSTOMER] as ChatSenderRoleEnum[] } },
              // Admin messages with no specific target (broadcast)
              { senderRole: ChatSenderRoleEnum.ADMIN, targetRole: null },
              // Admin messages specifically for this role
              { senderRole: ChatSenderRoleEnum.ADMIN, targetRole: readerRole as ChatSenderRoleEnum },
            ],
          };

    const messages = await prisma.orderChatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, fullName: true } } },
    });
    return messages.map(serializeChatMessage);
  }

  static async sendMessage(
    orderId: string,
    senderId: string,
    senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN',
    content: string,
    options?: {
      telegramMessageId?: bigint;
      /** Which party the admin is directing this message to. Only meaningful when senderRole === 'ADMIN'. */
      targetRole?: 'COURIER' | 'CUSTOMER' | null;
    },
  ): Promise<ChatMessageDto> {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 500) {
      throw new Error('Xabar 1–500 belgi bo\'lishi kerak');
    }

    // targetRole is only stored for ADMIN messages
    const targetRole =
      senderRole === 'ADMIN' ? (options?.targetRole ?? null) : null;

    const msg = await prisma.orderChatMessage.create({
      data: {
        orderId,
        senderId,
        senderRole: senderRole as ChatSenderRoleEnum,
        targetRole: targetRole ? (targetRole as ChatSenderRoleEnum) : null,
        content: trimmed,
        telegramMessageId: options?.telegramMessageId ?? null,
      },
      include: { sender: { select: { id: true, fullName: true } } },
    });

    const dto = serializeChatMessage(msg);

    // Publish via SSE so the other party receives it instantly (legacy channel)
    orderTrackingService.publishChatMessage(orderId, dto);

    // Realtime via Socket.io gateway — recipient-targeted (targetRole-aware).
    // Fire-and-forget: a missing gateway is a graceful no-op (30s poll fallback).
    void (async () => {
      const recipients = await this.resolveRecipients(orderId, targetRole);
      void SocketEvents.chatMessage(recipients, dto);
    })();

    if (senderRole === 'ADMIN') {
      // Admin sent a message → cancel any pending fallbacks
      cancelFallbacksForOrder(orderId);

      // Schedule 60-second unread reminder for the targeted role
      if (targetRole && (targetRole === 'COURIER' || targetRole === 'CUSTOMER')) {
        const msgId = msg.id;
        const reminderRole = targetRole;
        setTimeout(async () => {
          try {
            const stillUnread = await prisma.orderChatMessage.findFirst({
              where: { id: msgId, isRead: false },
              select: { id: true },
            });
            if (stillUnread) {
              orderTrackingService.publishChatUnreadReminder(orderId, reminderRole, msgId);
            }
          } catch { /* best-effort */ }
        }, 60_000);
      }
    } else {
      // Courier or Customer sent → schedule fallback to Telegram group if admin doesn't read
      const delayMs = getFallbackDelayMs();
      scheduleFallback(msg.id, orderId, senderRole, delayMs);

      // Also schedule 60-second unread reminder for ADMIN (the recipient)
      // Note: we only remind courier/customer (not admin) via SSE unread reminder
      // Admin fallback is handled separately via the Telegram group fallback service
    }

    return dto;
  }

  static async markRead(orderId: string, readerRole: 'COURIER' | 'CUSTOMER' | 'ADMIN') {
    let senderRoles: ChatSenderRoleEnum[];

    if (readerRole === 'ADMIN') {
      // Admin reading → mark all COURIER and CUSTOMER messages as read
      senderRoles = [ChatSenderRoleEnum.COURIER, ChatSenderRoleEnum.CUSTOMER];
      // Cancel pending fallbacks since admin is now reading
      cancelFallbacksForOrder(orderId);
    } else {
      // Courier/Customer reading → mark ADMIN messages targeted at them + null-target admin messages
      // plus any messages from the other peer role
      senderRoles = [ChatSenderRoleEnum.ADMIN];
      const otherPeer =
        readerRole === 'COURIER' ? ChatSenderRoleEnum.CUSTOMER : ChatSenderRoleEnum.COURIER;
      senderRoles.push(otherPeer);
    }

    const updated = await prisma.orderChatMessage.updateMany({
      where: { orderId, senderRole: { in: senderRoles }, isRead: false },
      data: { isRead: true },
    });

    // Broadcast read receipt to all parties on the SSE stream
    if (updated.count > 0) {
      orderTrackingService.publishChatRead(orderId, readerRole);

      // Realtime read receipt via Socket.io gateway → all participants.
      void (async () => {
        const recipients = await this.resolveRecipients(orderId, null);
        void SocketEvents.chatRead(recipients, {
          orderId,
          readerRole,
          readAt: new Date().toISOString(),
        });
      })();
    }
  }

  static async getUnreadCount(orderId: string, readerRole: 'COURIER' | 'CUSTOMER' | 'ADMIN'): Promise<number> {
    if (readerRole === 'ADMIN') {
      // Admin sees unread messages from couriers and customers
      return prisma.orderChatMessage.count({
        where: {
          orderId,
          senderRole: { in: [ChatSenderRoleEnum.COURIER, ChatSenderRoleEnum.CUSTOMER] },
          isRead: false,
        },
      });
    }

    // Courier/customer: unread = admin messages (targeted at them or null) + other peer messages
    const otherPeer =
      readerRole === 'COURIER' ? ChatSenderRoleEnum.CUSTOMER : ChatSenderRoleEnum.COURIER;

    return prisma.orderChatMessage.count({
      where: {
        orderId,
        isRead: false,
        OR: [
          { senderRole: otherPeer },
          { senderRole: ChatSenderRoleEnum.ADMIN, targetRole: null },
          { senderRole: ChatSenderRoleEnum.ADMIN, targetRole: readerRole as ChatSenderRoleEnum },
        ],
      },
    });
  }

  /**
   * Find a message by its Telegram message ID (for bot reply routing).
   */
  static async findByTelegramMessageId(
    telegramMessageId: bigint,
  ): Promise<{ id: string; orderId: string; senderRole: 'COURIER' | 'CUSTOMER' | 'ADMIN' } | null> {
    return prisma.orderChatMessage.findFirst({
      where: { telegramMessageId },
      select: { id: true, orderId: true, senderRole: true },
    });
  }

  /**
   * Get orders that have unread messages from couriers or customers (for admin inbox).
   */
  static async getAdminInbox(): Promise<{
    courierMessages: Array<{ orderId: string; orderNumber: string; unreadCount: number; lastMessage: string; lastAt: string }>;
    customerMessages: Array<{ orderId: string; orderNumber: string; unreadCount: number; lastMessage: string; lastAt: string }>;
  }> {
    const unreadMessages = await prisma.orderChatMessage.findMany({
      where: {
        senderRole: { in: [ChatSenderRoleEnum.COURIER, ChatSenderRoleEnum.CUSTOMER] },
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { id: true, orderNumber: true } },
      },
    });

    const courierMap = new Map<string, { orderId: string; orderNumber: string; unreadCount: number; lastMessage: string; lastAt: string }>();
    const customerMap = new Map<string, { orderId: string; orderNumber: string; unreadCount: number; lastMessage: string; lastAt: string }>();

    for (const msg of unreadMessages) {
      const map = msg.senderRole === ChatSenderRoleEnum.COURIER ? courierMap : customerMap;
      const existing = map.get(msg.orderId);
      if (existing) {
        existing.unreadCount++;
      } else {
        map.set(msg.orderId, {
          orderId: msg.orderId,
          orderNumber: String(msg.order.orderNumber),
          unreadCount: 1,
          lastMessage: msg.content.slice(0, 100),
          lastAt: msg.createdAt.toISOString(),
        });
      }
    }

    // ── Merge in support thread inbox so admin sees them under "Mijozlar" ──
    // Support entries are tagged with orderId = "support:<threadId>" so the
    // frontend can route to the support endpoints when opened.
    try {
      const supportEntries = await SupportService.getAdminInbox();
      for (const entry of supportEntries) {
        const orderLabel = entry.orderNumber
          ? `${entry.orderNumber} · ${entry.customerName}`
          : `Support · ${entry.customerName}`;
        customerMap.set(`support:${entry.threadId}`, {
          orderId: `support:${entry.threadId}`,
          orderNumber: orderLabel,
          unreadCount: entry.unreadCount,
          lastMessage: entry.lastMessage,
          lastAt: entry.lastAt,
        });
      }
    } catch (error) {
      // Support inbox is best-effort; never break the order chat inbox
      console.error('Failed to merge support inbox into admin inbox.', error);
    }

    return {
      courierMessages: Array.from(courierMap.values()),
      customerMessages: Array.from(customerMap.values()).sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime(),
      ),
    };
  }

  // ── Customer messages hub: kuryerlar bo'yicha guruhlangan chatlar (#5) ──────
  // Mijozning barcha buyurtmalaridagi kuryer suhbatlarini KURYER bo'yicha
  // birlashtiradi (bir kuryer bilan turli buyurtmalardagi xabarlar = bitta thread).

  /** Mijoz yozishган kuryerlar ro'yxati (oxirgi xabar, o'qilmaganlar soni, faol buyurtma). */
  static async getCustomerCourierThreads(customerId: string): Promise<Array<{
    courierId: string;
    courierName: string;
    courierPhone: string | null;
    lastMessage: string;
    lastAt: string;
    unreadCount: number;
    activeOrderId: string | null;
  }>> {
    const rows = await prisma.$queryRaw<Array<{
      courier_id: string;
      courier_name: string | null;
      courier_phone: string | null;
      last_message: string | null;
      last_at: Date;
      unread_count: bigint;
      active_order_id: string | null;
    }>>(Prisma.sql`
      with cust_orders as (
        select o.id as order_id, o.status::text as order_status,
               (select ca.courier_id from public.courier_assignments ca
                where ca.order_id = o.id order by ca.assigned_at desc limit 1) as courier_id
        from public.orders o
        where o.user_id = ${customerId}::uuid
      ),
      msgs as (
        select co.courier_id, co.order_id, co.order_status,
               m.content, m.created_at, m.sender_role::text as sender_role, m.is_read
        from cust_orders co
        join public.order_chat_messages m on m.order_id = co.order_id
        where co.courier_id is not null
          and m.sender_role in ('COURIER','CUSTOMER')
      ),
      agg as (
        select courier_id, max(created_at) as last_at,
               count(*) filter (where sender_role = 'COURIER' and is_read = false) as unread_count
        from msgs group by courier_id
      ),
      last_msg as (
        select distinct on (courier_id) courier_id, content
        from msgs order by courier_id, created_at desc
      ),
      active as (
        select distinct on (courier_id) courier_id, order_id
        from msgs where order_status not in ('DELIVERED','CANCELLED')
        order by courier_id, created_at desc
      )
      select a.courier_id, u.full_name as courier_name, u.phone as courier_phone,
             a.last_at, a.unread_count, lm.content as last_message, ac.order_id as active_order_id
      from agg a
      join public.users u on u.id = a.courier_id
      left join last_msg lm on lm.courier_id = a.courier_id
      left join active ac on ac.courier_id = a.courier_id
      order by a.last_at desc
    `);

    return rows.map((r) => ({
      courierId: r.courier_id,
      courierName: r.courier_name || 'Kuryer',
      courierPhone: r.courier_phone,
      lastMessage: (r.last_message || '').slice(0, 120),
      lastAt: r.last_at.toISOString(),
      unreadCount: Number(r.unread_count),
      activeOrderId: r.active_order_id,
    }));
  }

  /** Bitta kuryer bilan to'liq suhbat tarixi (barcha buyurtmalar bo'ylab) + faol buyurtma. */
  static async getCustomerCourierThread(customerId: string, courierId: string): Promise<{
    courierId: string;
    courierName: string;
    courierPhone: string | null;
    activeOrderId: string | null;
    messages: ChatMessageDto[];
  } | null> {
    const courierRows = await prisma.$queryRaw<Array<{
      full_name: string | null;
      phone: string | null;
      active_order_id: string | null;
    }>>(Prisma.sql`
      select u.full_name, u.phone,
        (select co.id from public.orders co
         where co.user_id = ${customerId}::uuid
           and co.status not in ('DELIVERED','CANCELLED')
           and (select ca.courier_id from public.courier_assignments ca
                where ca.order_id = co.id order by ca.assigned_at desc limit 1) = ${courierId}::uuid
         order by co.created_at desc limit 1) as active_order_id
      from public.users u where u.id = ${courierId}::uuid limit 1
    `);
    const courier = courierRows[0];
    if (!courier) return null;

    const msgRows = await prisma.$queryRaw<Array<{
      id: string; order_id: string; sender_id: string; sender_role: string;
      content: string; is_read: boolean; created_at: Date; sender_name: string | null;
    }>>(Prisma.sql`
      select m.id, m.order_id, m.sender_id, m.sender_role::text as sender_role,
             m.content, m.is_read, m.created_at, s.full_name as sender_name
      from public.order_chat_messages m
      join public.orders o on o.id = m.order_id
      join public.users s on s.id = m.sender_id
      where o.user_id = ${customerId}::uuid
        and m.sender_role in ('COURIER','CUSTOMER')
        and (select ca.courier_id from public.courier_assignments ca
             where ca.order_id = o.id order by ca.assigned_at desc limit 1) = ${courierId}::uuid
      order by m.created_at asc
    `);

    return {
      courierId,
      courierName: courier.full_name || 'Kuryer',
      courierPhone: courier.phone,
      activeOrderId: courier.active_order_id,
      messages: msgRows.map((m) => ({
        id: m.id,
        orderId: m.order_id,
        senderId: m.sender_id,
        senderRole: m.sender_role as 'COURIER' | 'CUSTOMER' | 'ADMIN',
        senderName: m.sender_name || 'Foydalanuvchi',
        content: m.content,
        isRead: m.is_read,
        createdAt: m.created_at.toISOString(),
        targetRole: null,
      })),
    };
  }

  /** Mijoz kuryer thread'ini ochganda — o'sha kuryerning o'qilmagan xabarlarini read qiladi. */
  static async markCustomerCourierRead(customerId: string, courierId: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      update public.order_chat_messages m
      set is_read = true
      from public.orders o
      where m.order_id = o.id
        and o.user_id = ${customerId}::uuid
        and m.sender_role = 'COURIER'
        and m.is_read = false
        and (select ca.courier_id from public.courier_assignments ca
             where ca.order_id = o.id order by ca.assigned_at desc limit 1) = ${courierId}::uuid
    `);
  }
}

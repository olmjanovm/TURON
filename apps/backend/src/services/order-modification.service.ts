import {
  OrderStatusEnum,
  NotificationTypeEnum,
  UserRoleEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
} from '@turon/shared';
import { prisma } from '../lib/prisma.js';
import { StorageService } from './storage.service.js';
import { AuditService } from './audit.service.js';
import { InAppNotificationsService } from './in-app-notifications.service.js';
import { orderTrackingService } from './order-tracking.service.js';
import { ORDER_INCLUDE, serializeOrder } from '../api/modules/orders/order-helpers.js';
import { sendAdminAlert, syncTelegramOrderStatus } from './telegram-bot.service.js';

/**
 * Yandex Eats / Uber Eats stilidagi buyurtmani o'zgartirish so'rovlari.
 *
 * Ikki rejim:
 *   1. Auto-approve  — order PENDING bo'lsa, mijoz darhol bekor qila oladi
 *      (admin tasdiqlamagani uchun ovqat tayyorlanmagan, risk yo'q).
 *   2. Manual review — order PREPARING / READY_FOR_PICKUP / DELIVERING bo'lsa,
 *      so'rov adminga yetkaziladi va admin approve / reject qiladi.
 *
 * DELIVERED va CANCELLED order'lar uchun hech qanday so'rov qabul qilinmaydi.
 */

export type ModificationType =
  | 'CANCEL'
  | 'ADDRESS_CHANGE'
  | 'PAYMENT_METHOD_CHANGE'
  | 'ITEMS_CHANGE'
  | 'OTHER';
export type ModificationStatus = 'PENDING' | 'AUTO_APPROVED' | 'APPROVED' | 'REJECTED';

export interface ModificationRequestDto {
  id: string;
  orderId: string;
  type: ModificationType;
  status: ModificationStatus;
  payload: any;
  reason: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface CreateRequestInput {
  orderId: string;
  customerId: string;
  type: ModificationType;
  reason?: string;
  payload?: Record<string, unknown>;
}

export interface DecideInput {
  requestId: string;
  adminId: string;
  approve: boolean;
  decisionNote?: string;
}

const TERMINAL_ORDER_STATUSES = new Set<string>([
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.CANCELLED,
]);

function serialize(row: any): ModificationRequestDto {
  return {
    id: row.id,
    orderId: row.orderId,
    type: row.type as ModificationType,
    status: row.status as ModificationStatus,
    payload: row.payload ?? null,
    reason: row.reason ?? null,
    decisionNote: row.decisionNote ?? null,
    decidedAt: row.decidedAt ? new Date(row.decidedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

/**
 * Resolve the active modification window for a given order status.
 * Returns 'AUTO' (instant) | 'MANUAL' (admin must decide) | 'CLOSED' (refuse).
 */
function resolveDecisionMode(orderStatus: string): 'AUTO' | 'MANUAL' | 'CLOSED' {
  if (TERMINAL_ORDER_STATUSES.has(orderStatus)) return 'CLOSED';
  if (orderStatus === OrderStatusEnum.PENDING) return 'AUTO';
  return 'MANUAL';
}

export class OrderModificationService {
  /** List all modification requests for an order, newest first. */
  static async listForOrder(orderId: string): Promise<ModificationRequestDto[]> {
    const rows = await prisma.orderModificationRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(serialize);
  }

  /** List pending requests across all orders — admin dashboard. */
  static async listPendingForAdmin(): Promise<ModificationRequestDto[]> {
    const rows = await prisma.orderModificationRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(serialize);
  }

  /**
   * Customer creates a modification request. Auto-approves for PENDING orders,
   * otherwise stores the request and notifies the admin for manual review.
   */
  static async create(
    input: CreateRequestInput,
  ): Promise<{ request: ModificationRequestDto; mode: 'AUTO' | 'MANUAL' }> {
    const { orderId, customerId, type, reason, payload } = input;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, orderNumber: true, paymentMethod: true },
    });
    if (!order) {
      throw new Error('Buyurtma topilmadi');
    }
    if (order.userId !== customerId) {
      throw new Error('Bu buyurtma sizniki emas');
    }

    // Mode bo'yicha:
    //  ADDRESS_CHANGE        → AUTO (kuryer yo'lda bo'lsa ham), faqat yakunlanmagan.
    //  PAYMENT_METHOD_CHANGE → MANUAL (admin chekni tekshirib tasdiqlaydi), yakunlanmagan.
    //  Boshqalar             → status bo'yicha (PENDING:AUTO, aks:MANUAL).
    const mode =
      type === 'ADDRESS_CHANGE'
        ? (TERMINAL_ORDER_STATUSES.has(order.status) ? 'CLOSED' : 'AUTO')
        : type === 'PAYMENT_METHOD_CHANGE' || type === 'ITEMS_CHANGE'
          ? (TERMINAL_ORDER_STATUSES.has(order.status) ? 'CLOSED' : 'MANUAL')
          : resolveDecisionMode(order.status);
    if (mode === 'CLOSED') {
      throw new Error("Bu holatdagi buyurtmani o'zgartirib bo'lmaydi");
    }

    // To'lov usulini o'zgartirish — faqat naqd buyurtmani kartaga (chek bilan).
    if (type === 'PAYMENT_METHOD_CHANGE' && order.paymentMethod !== PaymentMethodEnum.CASH) {
      throw new Error("Faqat naqd to'lovni kartaga o'zgartirish mumkin");
    }

    // PAYMENT_METHOD_CHANGE: chek rasmini (base64) yuklab, payload'da URL saqlaymiz.
    let storedPayload: any = payload ?? null;
    if (type === 'PAYMENT_METHOD_CHANGE') {
      const base64 = (payload as any)?.receiptImageBase64;
      let receiptUrl: string | null = null;
      if (typeof base64 === 'string' && base64.trim()) {
        try {
          receiptUrl = await StorageService.uploadBase64(base64, 'receipts');
        } catch {
          receiptUrl = null;
        }
      }
      storedPayload = {
        to: PaymentMethodEnum.MANUAL_TRANSFER,
        amount: (payload as any)?.amount ?? null,
        receiptUrl,
      };
    }

    // Taom o'zgartirish — yangi to'liq mahsulot ro'yxati. Narxlarni SERVER hisoblaydi
    // (FE narxiga ishonmaymiz), delta>0 bo'lsa chek (kartaga) talab qilinadi.
    if (type === 'ITEMS_CHANGE') {
      const rawItems = Array.isArray((payload as any)?.items) ? (payload as any).items : [];
      const cleaned = rawItems
        .map((i: any) => ({
          menuItemId: String(i.menuItemId ?? ''),
          quantity: Math.max(1, Math.floor(Number(i.quantity) || 0)),
        }))
        .filter((i: any) => i.menuItemId && i.quantity > 0);
      if (cleaned.length === 0) throw new Error("Kamida bitta mahsulot bo'lishi kerak");

      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: cleaned.map((c: any) => c.menuItemId) } },
      });
      const byId = new Map(menuItems.map((m) => [m.id, m]));
      const builtItems = cleaned.map((c: any) => {
        const mi = byId.get(c.menuItemId);
        if (!mi || !mi.isActive) throw new Error('Tanlangan mahsulot mavjud emas');
        const price = Number(mi.price);
        return {
          menuItemId: mi.id,
          itemName: (mi as any).nameUz ?? 'Taom',
          priceAtOrder: price,
          quantity: c.quantity,
          totalPrice: price * c.quantity,
          imageUrl: (mi as any).imageUrl ?? null,
        };
      });
      const newSubtotal = builtItems.reduce((s: number, it: any) => s + it.totalPrice, 0);

      const cur = await prisma.order.findUnique({
        where: { id: orderId },
        select: { deliveryFee: true, discountAmount: true, totalAmount: true },
      });
      const deliveryFee = Number(cur?.deliveryFee ?? 0);
      const discountAmount = Number(cur?.discountAmount ?? 0);
      const oldTotal = Number(cur?.totalAmount ?? 0);
      const newTotal = Math.max(0, newSubtotal + deliveryFee - discountAmount);
      const delta = newTotal - oldTotal;

      let receiptUrl: string | null = null;
      const base64 = (payload as any)?.receiptImageBase64;
      if (typeof base64 === 'string' && base64.trim()) {
        try {
          receiptUrl = await StorageService.uploadBase64(base64, 'receipts');
        } catch {
          receiptUrl = null;
        }
      }

      storedPayload = {
        items: builtItems,
        newSubtotal,
        deliveryFee,
        discountAmount,
        newTotal,
        oldTotal,
        delta,
        receiptUrl,
      };
    }

    // Block duplicate active requests of the same type so the customer
    // can't spam admin notifications.
    const existing = await prisma.orderModificationRequest.findFirst({
      where: {
        orderId,
        type,
        status: 'PENDING',
      },
    });
    if (existing) {
      throw new Error("So'rov allaqachon yuborilgan, kuting");
    }

    const initialStatus: ModificationStatus =
      mode === 'AUTO' ? 'AUTO_APPROVED' : 'PENDING';

    const created = await prisma.orderModificationRequest.create({
      data: {
        orderId,
        requestedBy: customerId,
        type,
        payload: storedPayload as any,
        status: initialStatus,
        reason: reason ?? null,
        // For AUTO_APPROVED also stamp decision time so the timeline reads cleanly.
        decidedAt: mode === 'AUTO' ? new Date() : null,
      },
    });

    if (mode === 'AUTO') {
      await this.applySideEffects(created.id);
    } else {
      await this.notifyAdminPending(created.id, type, order.orderNumber);
    }

    await AuditService.record({
      userId: customerId,
      actorRole: UserRoleEnum.CUSTOMER,
      action: mode === 'AUTO' ? 'ORDER_MODIFICATION_AUTO' : 'ORDER_MODIFICATION_REQUEST',
      entity: 'Order',
      entityId: orderId,
      newValue: { type, status: initialStatus, reason: reason ?? null },
      metadata: { requestId: created.id, mode },
    }).catch(() => {});

    return { request: serialize(created), mode };
  }

  /**
   * Admin approves or rejects a pending request. Approval applies the
   * modification side-effects (cancel the order, swap address, ...).
   */
  static async decide(input: DecideInput): Promise<ModificationRequestDto> {
    const { requestId, adminId, approve, decisionNote } = input;

    const row = await prisma.orderModificationRequest.findUnique({
      where: { id: requestId },
    });
    if (!row) {
      throw new Error("So'rov topilmadi");
    }
    if (row.status !== 'PENDING') {
      throw new Error("So'rov allaqachon hal qilingan");
    }

    const nextStatus: ModificationStatus = approve ? 'APPROVED' : 'REJECTED';
    const updated = await prisma.orderModificationRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        decidedBy: adminId,
        decidedAt: new Date(),
        decisionNote: decisionNote ?? null,
      },
    });

    if (approve) {
      await this.applySideEffects(requestId);
    } else {
      // Notify customer of the rejection so they aren't left waiting.
      const order = await prisma.order.findUnique({
        where: { id: row.orderId },
        select: { userId: true, orderNumber: true },
      });
      if (order) {
        await InAppNotificationsService.notifyUser({
          userId: order.userId,
          roleTarget: UserRoleEnum.CUSTOMER,
          type: NotificationTypeEnum.WARNING,
          title: "So'rov rad etildi",
          message:
            decisionNote
              ? `#${String(order.orderNumber)} buyurtma uchun so'rovingiz rad etildi: ${decisionNote}`
              : `#${String(order.orderNumber)} buyurtma uchun so'rovingiz rad etildi`,
          relatedOrderId: row.orderId,
        }).catch(() => {});
      }
    }

    await AuditService.record({
      userId: adminId,
      actorRole: UserRoleEnum.ADMIN,
      action: approve ? 'ORDER_MODIFICATION_APPROVE' : 'ORDER_MODIFICATION_REJECT',
      entity: 'Order',
      entityId: row.orderId,
      oldValue: { status: row.status },
      newValue: { status: nextStatus, decisionNote: decisionNote ?? null },
      metadata: { requestId },
    }).catch(() => {});

    return serialize(updated);
  }

  /**
   * Apply the modification's domain effect — only called after the request
   * has reached AUTO_APPROVED or APPROVED status.
   */
  private static async applySideEffects(requestId: string): Promise<void> {
    const row = await prisma.orderModificationRequest.findUnique({
      where: { id: requestId },
    });
    if (!row) return;

    if (row.type === 'CANCEL') {
      await this.applyCancel(row.orderId, row.reason ?? 'customer_requested');
      return;
    }

    if (row.type === 'ADDRESS_CHANGE') {
      await this.applyAddressChange(row.orderId, row.payload);
      return;
    }

    if (row.type === 'PAYMENT_METHOD_CHANGE') {
      await this.applyPaymentMethodChange(row.orderId, row.payload);
      return;
    }

    if (row.type === 'ITEMS_CHANGE') {
      await this.applyItemsChange(row.orderId, row.payload);
      return;
    }

    // OTHER → no automatic effect, the conversation continues in support.
  }

  /** Cancel the order on behalf of the customer. */
  private static async applyCancel(orderId: string, reason: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { courierAssignments: true },
    });
    if (!order) return;
    if (TERMINAL_ORDER_STATUSES.has(order.status)) return;

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatusEnum.CANCELLED as any,
          cancellationReason: reason,
          cancelledByRole: 'customer',
        },
      });

      // Free the promo code, if any
      if (order.promoCodeId) {
        await tx.promoCode.update({
          where: { id: order.promoCodeId },
          data: { timesUsed: { decrement: 1 } },
        });
      }

      // Cancel any in-flight courier assignments
      const activeStatuses = ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERING'];
      const assignments = order.courierAssignments.filter((a: any) =>
        activeStatuses.includes(a.status),
      );

      if (assignments.length > 0) {
        await tx.courierAssignment.updateMany({
          where: { orderId, status: { in: activeStatuses as any } },
          data: { status: 'CANCELLED' as any, cancelledAt: now },
        });
        await tx.courierAssignmentEvent.createMany({
          data: assignments.map((a: any) => ({
            assignmentId: a.id,
            orderId,
            courierId: a.courierId,
            eventType: 'CANCELLED' as any,
            eventAt: now,
            payload: { reason: `customer_${reason}` },
          })),
        });
      }
    });

    // Push the new state to all SSE listeners so the courier / admin UI updates.
    try {
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        include: ORDER_INCLUDE as any,
      });
      if (refreshed) {
        const payload = {
          ...serializeOrder(refreshed),
          tracking: await orderTrackingService.getSnapshot(orderId),
        };
        orderTrackingService.publishOrderUpdate(orderId, payload);
      }
    } catch {
      /* non-critical */
    }

    // Telegram bot xabarini yangilaymiz: tasdiqlash/bekor tugmalari olib tashlanadi
    // va holat "Mijoz tomonidan bekor qilindi" ga o'zgaradi (real-time, mos).
    await syncTelegramOrderStatus(
      orderId,
      OrderStatusEnum.CANCELLED,
      'Mijoz tomonidan bekor qilindi',
    ).catch(() => {});

    // Tell admins it happened (so they don't keep cooking).
    await InAppNotificationsService.notifyAdmins({
      type: NotificationTypeEnum.WARNING,
      title: 'Mijoz buyurtmani bekor qildi',
      message: `#${String(order.orderNumber)} mijoz tomonidan bekor qilindi (${reason})`,
      relatedOrderId: orderId,
    }).catch(() => {});
  }

  /**
   * Mijoz buyurtma manzilini o'zgartiradi (kuryer yo'lda bo'lsa ham).
   * deliveryAddressId + destination koordinatalari yangilanadi, so'ng kuryer/admin'ga
   * real-time snapshot push qilinadi — kuryer navigatsiyasi yangi manzilga reroute qiladi.
   */
  private static async applyAddressChange(orderId: string, payload: any): Promise<void> {
    const addressId = typeof payload?.addressId === 'string' ? payload.addressId : null;
    if (!addressId) throw new Error("Yangi manzil ko'rsatilmadi");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { courierAssignments: true },
    });
    if (!order) throw new Error('Buyurtma topilmadi');
    if (TERMINAL_ORDER_STATUSES.has(order.status)) {
      throw new Error("Yakunlangan buyurtma manzilini o'zgartirib bo'lmaydi");
    }

    const address = await prisma.deliveryAddress.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== order.userId) {
      throw new Error('Yangi manzil topilmadi');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryAddressId: addressId,
        destinationLat: address.latitude,
        destinationLng: address.longitude,
      },
    });

    // Real-time: kuryer (yo'lda bo'lsa ham) + admin yangi manzilni darhol oladi.
    try {
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        include: ORDER_INCLUDE as any,
      });
      if (refreshed) {
        const snapshot = {
          ...serializeOrder(refreshed),
          tracking: await orderTrackingService.getSnapshot(orderId),
        };
        orderTrackingService.publishOrderUpdate(orderId, snapshot);
      }
    } catch {
      /* non-critical */
    }

    const orderNumber = String(order.orderNumber);

    // Faol kuryerni xabardor qilamiz — yangi manzilga yo'l olsin.
    const activeStatuses = ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERING'];
    const activeAssignment = order.courierAssignments.find((a: any) =>
      activeStatuses.includes(a.status),
    );
    if (activeAssignment) {
      await InAppNotificationsService.notifyUser({
        userId: activeAssignment.courierId,
        roleTarget: UserRoleEnum.COURIER,
        type: NotificationTypeEnum.WARNING,
        title: "Manzil o'zgardi",
        message: `#${orderNumber} buyurtma manzili o'zgartirildi: ${address.address}. Yangi manzilga yo'l oling.`,
        relatedOrderId: orderId,
      }).catch(() => {});
    }

    // Admin xabardor.
    await InAppNotificationsService.notifyAdmins({
      type: NotificationTypeEnum.WARNING,
      title: "Manzil o'zgartirildi",
      message: `#${orderNumber} buyurtma manzili mijoz tomonidan o'zgartirildi: ${address.address}`,
      relatedOrderId: orderId,
    }).catch(() => {});
  }

  /**
   * Admin tasdiqlagach: buyurtma to'lov usulini naqd → karta (MANUAL_TRANSFER) ga
   * o'tkazadi, to'lovni COMPLETED qiladi, chekni Payment'ga yozadi. Mijoz kutmaydi —
   * so'rov yuborilgach "tasdiqlangach o'zgaradi" deydi; bu yerda real o'zgartiriladi.
   */
  private static async applyPaymentMethodChange(orderId: string, payload: any): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new Error('Buyurtma topilmadi');
    if (TERMINAL_ORDER_STATUSES.has(order.status)) {
      throw new Error("Yakunlangan buyurtma to'lovini o'zgartirib bo'lmaydi");
    }

    const receiptUrl = typeof payload?.receiptUrl === 'string' ? payload.receiptUrl : null;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: PaymentMethodEnum.MANUAL_TRANSFER as any,
          paymentStatus: PaymentStatusEnum.COMPLETED as any,
        },
      });

      await tx.payment.upsert({
        where: { orderId },
        update: {
          method: PaymentMethodEnum.MANUAL_TRANSFER as any,
          status: PaymentStatusEnum.COMPLETED as any,
          receiptImageBase64: receiptUrl ?? (order.payment as any)?.receiptImageBase64 ?? null,
          verifiedAt: now,
        },
        create: {
          orderId,
          method: PaymentMethodEnum.MANUAL_TRANSFER as any,
          status: PaymentStatusEnum.COMPLETED as any,
          amount: order.totalAmount,
          receiptImageBase64: receiptUrl ?? null,
          verifiedAt: now,
        },
      });
    });

    // Real-time snapshot (admin/kuryer ko'radi) + Telegram bot xabari holatini sync.
    try {
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        include: ORDER_INCLUDE as any,
      });
      if (refreshed) {
        const snapshot = {
          ...serializeOrder(refreshed),
          tracking: await orderTrackingService.getSnapshot(orderId),
        };
        orderTrackingService.publishOrderUpdate(orderId, snapshot);
      }
    } catch {
      /* non-critical */
    }

    // Mijozni xabardor qilamiz — to'lov usuli kartaga o'zgardi.
    await InAppNotificationsService.notifyUser({
      userId: order.userId,
      roleTarget: UserRoleEnum.CUSTOMER,
      type: NotificationTypeEnum.SUCCESS,
      title: "To'lov usuli o'zgartirildi",
      message: `#${String(order.orderNumber)} buyurtma uchun to'lov karta orqali tasdiqlandi.`,
      relatedOrderId: orderId,
    }).catch(() => {});
  }

  /**
   * Admin tasdiqlagach: buyurtma mahsulotlarini yangi ro'yxatga almashtiradi,
   * subtotal/jami'ni yangilaydi. delta>0 chek bo'lsa Payment'ga biriktiradi.
   */
  private static async applyItemsChange(orderId: string, payload: any): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new Error('Buyurtma topilmadi');
    if (TERMINAL_ORDER_STATUSES.has(order.status)) {
      throw new Error("Yakunlangan buyurtmani o'zgartirib bo'lmaydi");
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];
    if (items.length === 0) throw new Error('Mahsulot ro\'yxati bo\'sh');

    const newSubtotal = Number(payload?.newSubtotal ?? 0);
    const newTotal = Number(payload?.newTotal ?? 0);
    const receiptUrl = typeof payload?.receiptUrl === 'string' ? payload.receiptUrl : null;

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.orderItem.createMany({
        data: items.map((it: any) => ({
          orderId,
          menuItemId: it.menuItemId ?? null,
          itemName: it.itemName ?? 'Taom',
          priceAtOrder: it.priceAtOrder ?? 0,
          quantity: it.quantity ?? 1,
          totalPrice: it.totalPrice ?? 0,
          imageUrl: it.imageUrl ?? null,
        })),
      });
      await tx.order.update({
        where: { id: orderId },
        data: { subtotal: newSubtotal, totalAmount: newTotal },
      });
      if (receiptUrl && order.payment) {
        await tx.payment.update({
          where: { orderId },
          data: { receiptImageBase64: receiptUrl },
        });
      }
    });

    try {
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        include: ORDER_INCLUDE as any,
      });
      if (refreshed) {
        const snapshot = {
          ...serializeOrder(refreshed),
          tracking: await orderTrackingService.getSnapshot(orderId),
        };
        orderTrackingService.publishOrderUpdate(orderId, snapshot);
      }
    } catch {
      /* non-critical */
    }

    await InAppNotificationsService.notifyUser({
      userId: order.userId,
      roleTarget: UserRoleEnum.CUSTOMER,
      type: NotificationTypeEnum.SUCCESS,
      title: 'Buyurtma yangilandi',
      message: `#${String(order.orderNumber)} buyurtma tarkibi yangilandi. Yangi jami: ${newTotal.toLocaleString('uz-UZ')} so'm.`,
      relatedOrderId: orderId,
    }).catch(() => {});
  }

  private static async notifyAdminPending(
    requestId: string,
    type: ModificationType,
    orderNumber: bigint | number,
  ): Promise<void> {
    const orderNumberStr = String(orderNumber);
    const typeLabel =
      type === 'CANCEL'
        ? 'Bekor qilish'
        : type === 'ADDRESS_CHANGE'
          ? "Manzilni o'zgartirish"
          : type === 'PAYMENT_METHOD_CHANGE'
            ? "To'lov usuli (naqd→karta, chek bilan)"
            : type === 'ITEMS_CHANGE'
              ? 'Taom tarkibini o\'zgartirish'
              : 'Boshqa';

    await InAppNotificationsService.notifyAdmins({
      type: NotificationTypeEnum.WARNING,
      title: "Mijozdan so'rov",
      message: `#${orderNumberStr} — mijoz "${typeLabel}" so'rovini yubordi. Tasdiqlang yoki rad eting.`,
      relatedOrderId: undefined,
    }).catch(() => {});

    await sendAdminAlert(
      `📝 <b>Mijoz so'rovi</b>\n\n` +
        `📦 Buyurtma: <b>#${orderNumberStr}</b>\n` +
        `📨 Turi: <b>${typeLabel}</b>\n\n` +
        `Admin paneldan tasdiqlang yoki rad eting.`,
    ).catch(() => {});

    void requestId; // request ID is in audit log; admin panel filters by status
  }
}

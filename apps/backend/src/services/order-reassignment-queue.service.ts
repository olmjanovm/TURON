/**
 * OrderReassignmentQueue
 *
 * In-process retry queue that auto-reassigns an order when a courier declines.
 *
 * Architecture mirrors a real job queue (enqueue → process → retry → dead-letter).
 * Upgrade path: replace setTimeout/Map with BullMQ + Redis — interfaces stay the same.
 *
 * Flow:
 *   courier declines
 *     → enqueue(orderId)
 *     → attempt 1: immediate       — autoAssignOrder (excluding all declined couriers)
 *     → attempt 2: +15 s           — retry if no eligible courier found
 *     → attempt 3: +45 s           — last retry
 *     → dead-letter: notify admin + Telegram
 */

import { NotificationTypeEnum } from '@turon/shared';
import { prisma } from '../lib/prisma.js';
import { CourierAssignmentService } from './courier-assignment.service.js';
import { InAppNotificationsService } from './in-app-notifications.service.js';
import { orderTrackingService } from './order-tracking.service.js';
import { sendAdminAlert } from './telegram-bot.service.js';
import { ORDER_INCLUDE, serializeOrder } from '../api/modules/orders/order-helpers.js';

// ── Config ────────────────────────────────────────────────────────────────────

/** Milliseconds to wait before each retry (index 0 = after 1st failure). */
const RETRY_DELAYS_MS = [15_000, 45_000] as const;

/** Total attempts before giving up and notifying admin. */
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1; // = 3

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReassignmentJob {
  orderId: string;
  orderNumber: string;
  attempts: number;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class OrderReassignmentQueue {
  /** In-flight jobs keyed by orderId — prevents duplicate processing. */
  private static readonly pending = new Map<string, ReassignmentJob>();

  /**
   * Schedule auto-reassignment for an order whose courier just declined.
   * Idempotent: duplicate calls for the same orderId are silently ignored.
   */
  static enqueue(orderId: string, orderNumber: string | number): void {
    if (this.pending.has(orderId)) {
      return;
    }

    const job: ReassignmentJob = {
      orderId,
      orderNumber: String(orderNumber),
      attempts: 0,
    };

    this.pending.set(orderId, job);

    // First attempt fires immediately on the next event-loop tick
    setImmediate(() => {
      void this._process(job);
    });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private static _scheduleRetry(job: ReassignmentJob): void {
    const delay = RETRY_DELAYS_MS[job.attempts - 1] ?? 45_000;
    console.warn(
      `[ReassignQueue] No eligible courier for #${job.orderNumber} — ` +
      `retry in ${delay / 1000}s (attempt ${job.attempts}/${MAX_ATTEMPTS})`,
    );
    setTimeout(() => {
      void this._process(job);
    }, delay);
  }

  private static async _process(job: ReassignmentJob): Promise<void> {
    job.attempts++;

    try {
      // Guard 1 — stop if order was already closed or manually reassigned
      const order = await prisma.order.findUnique({
        where: { id: job.orderId },
        include: {
          courierAssignments: {
            where: {
              status: { in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERING'] as any },
            },
            take: 1,
          },
        },
      });

      if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        this.pending.delete(job.orderId);
        return;
      }

      if ((order.courierAssignments as any[]).length > 0) {
        // Someone already reassigned manually while we were waiting
        this.pending.delete(job.orderId);
        return;
      }

      // Exclude every courier who already declined this order
      const declinedRows = await prisma.courierAssignment.findMany({
        where: { orderId: job.orderId, status: 'REJECTED' as any },
        select: { courierId: true },
      });
      const excludeIds = declinedRows.map((r: any) => r.courierId);

      // Attempt auto-assignment
      const result = await CourierAssignmentService.autoAssignOrder(
        job.orderId,
        prisma,
        excludeIds,
      );

      if (result.assignment) {
        console.log(
          `[ReassignQueue] ✓ Order #${job.orderNumber} → ${result.assignment.courierName} ` +
          `(attempt ${job.attempts})`,
        );
        this.pending.delete(job.orderId);
        await this._publishUpdate(job.orderId);
        return;
      }

      // No eligible courier — retry or dead-letter
      if (job.attempts < MAX_ATTEMPTS) {
        this._scheduleRetry(job);
      } else {
        await this._deadLetter(job);
      }
    } catch (err) {
      console.error(
        `[ReassignQueue] Error on attempt ${job.attempts} for order ${job.orderId}:`,
        err,
      );
      if (job.attempts < MAX_ATTEMPTS) {
        this._scheduleRetry(job);
      } else {
        await this._deadLetter(job).catch(() => {});
      }
    }
  }

  /** Broadcast the updated order state so connected clients see the new assignment. */
  private static async _publishUpdate(orderId: string): Promise<void> {
    try {
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        include: ORDER_INCLUDE as any,
      });
      if (!refreshed) return;
      const serialized = {
        ...serializeOrder(refreshed),
        tracking: await orderTrackingService.getSnapshot(orderId),
      };
      orderTrackingService.publishOrderUpdate(orderId, serialized);
    } catch {
      // Non-critical — UI will recover on next poll
    }
  }

  /** All retries exhausted — notify admin for manual action. */
  private static async _deadLetter(job: ReassignmentJob): Promise<void> {
    this.pending.delete(job.orderId);
    console.error(
      `[ReassignQueue] ✗ Exhausted ${MAX_ATTEMPTS} attempts for order #${job.orderNumber} — notifying admin`,
    );

    await InAppNotificationsService.notifyAdmins({
      type: NotificationTypeEnum.WARNING,
      title: "Kuryer topilmadi — qo'lda biriktiring",
      message:
        `#${job.orderNumber} buyurtma rad etildi. ` +
        `${MAX_ATTEMPTS} ta avtomatik biriktirish urinildi, lekin hech qanday bo'sh kuryer topilmadi. ` +
        `Iltimos, qo'lda biriktiring.`,
      relatedOrderId: job.orderId,
    }).catch(() => {});

    await sendAdminAlert(
      `🚨 <b>Kuryer topilmadi!</b>\n\n` +
      `📦 Buyurtma: <b>#${job.orderNumber}</b>\n` +
      `🔄 ${MAX_ATTEMPTS} marta avtomatik biriktirish urinildi\n` +
      `❌ Hech qanday bo'sh kuryer yo'q\n\n` +
      `⚠️ Iltimos, tizimga kirib qo'lda kuryer biriktiring!`,
    ).catch(() => {});
  }
}

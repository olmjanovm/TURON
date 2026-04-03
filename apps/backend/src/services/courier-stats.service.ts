import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

type DbClient = Prisma.TransactionClient | typeof prisma;
const TASHKENT_UTC_OFFSET = '+05:00';

function getTashkentDayRange() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    const fallback = new Date();
    return {
      start: new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate()),
      end: new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate() + 1),
    };
  }

  const start = new Date(`${year}-${month}-${day}T00:00:00${TASHKENT_UTC_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === 'number' ? value : Number(value);
}

function averageFromValues(values: number[]) {
  if (!values.length) {
    return null;
  }

  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  return Math.round(sum / values.length);
}

export class CourierStatsService {
  static async getTodayStats(courierId: string, db: DbClient = prisma) {
    const { start, end } = getTashkentDayRange();
    const deliveredAssignments = await db.courierAssignment.findMany({
      where: {
        courierId,
        status: 'DELIVERED' as any,
        deliveredAt: {
          gte: start,
          lt: end,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            deliveryFee: true,
            paymentMethod: true,
            status: true,
          },
        },
      },
      orderBy: {
        deliveredAt: 'desc',
      },
    });

    const completedCount = deliveredAssignments.length;
    const deliveredOrderAmountTotal = deliveredAssignments.reduce(
      (sum, assignment) => sum + decimalToNumber(assignment.order?.totalAmount),
      0,
    );
    const deliveryFeesTotal = deliveredAssignments.reduce(
      (sum, assignment) => sum + decimalToNumber(assignment.order?.deliveryFee),
      0,
    );
    const fulfillmentDurations = deliveredAssignments
      .filter((assignment) => assignment.deliveredAt && (assignment.acceptedAt || assignment.assignedAt))
      .map((assignment) => {
        const startedAt = assignment.acceptedAt || assignment.assignedAt;
        return Math.max(
          0,
          Math.round((assignment.deliveredAt!.getTime() - startedAt.getTime()) / 60000),
        );
      });
    const deliveryLegDurations = deliveredAssignments
      .filter((assignment) => assignment.deliveredAt && assignment.deliveringAt)
      .map((assignment) =>
        Math.max(
          0,
          Math.round((assignment.deliveredAt!.getTime() - assignment.deliveringAt!.getTime()) / 60000),
        ),
      );
    const firstDeliveredAt =
      deliveredAssignments.length > 0
        ? deliveredAssignments[deliveredAssignments.length - 1]?.deliveredAt?.toISOString() ?? null
        : null;
    const lastDeliveredAt = deliveredAssignments[0]?.deliveredAt?.toISOString() ?? null;

    return {
      courierId,
      dayStartAt: start.toISOString(),
      dayEndAt: end.toISOString(),
      completedCount,
      activeCount: await db.courierAssignment.count({
        where: {
          courierId,
          status: {
            in: ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERING'] as any,
          },
        },
      }),
      deliveredOrderAmountTotal,
      deliveryFeesTotal,
      averageFulfillmentMinutes: averageFromValues(fulfillmentDurations),
      averageDeliveryLegMinutes: averageFromValues(deliveryLegDurations),
      firstDeliveredAt,
      lastDeliveredAt,
      payoutSummary: {
        isDefined: false,
        label: 'Kuryer ulushi hali alohida qoidaga ulanmagan',
      },
      recentCompletedOrders: deliveredAssignments.slice(0, 5).map((assignment) => ({
        assignmentId: assignment.id,
        orderId: assignment.orderId,
        orderNumber: String(assignment.order.orderNumber),
        deliveredAt: assignment.deliveredAt?.toISOString() ?? assignment.updatedAt.toISOString(),
        total: decimalToNumber(assignment.order.totalAmount),
        deliveryFee: decimalToNumber(assignment.order.deliveryFee),
        paymentMethod: assignment.order.paymentMethod,
        orderStatus: assignment.order.status,
      })),
    };
  }
}

import { SpecialEventTypeEnum } from '@turon/shared';
import { prisma } from '../lib/prisma.js';

export interface EventBenefit {
  type: SpecialEventTypeEnum;
  name: string;
  description: string | null;
  discountPercent: number;
  discountAmount: number;
  freeItemIds: string[];
}

export class SpecialEventsService {
  /**
   * Checks for active special events applicable to the user today.
   */
  static async getActiveBenefits(userId: string): Promise<EventBenefit[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { birthday: true },
    });

    const now = new Date();
    const todayMonthDay = now.toISOString().slice(5, 10); // "MM-DD"
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    
    // Prisma dayOfWeek is typically 1 (Mon) to 7 (Sun) or similar depending on DB
    // Let's assume 1-7 (Mon-Sun) to match standard business logic
    const prismaDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    const activeEvents = await prisma.specialEvent.findMany({
      where: {
        isActive: true,
      },
    });

    const benefits: EventBenefit[] = [];

    for (const event of activeEvents) {
      let isApplicable = false;

      // 1. One-time date check
      if (event.occursDate) {
        const eventDate = new Date(event.occursDate).toISOString().slice(0, 10);
        const todayDate = now.toISOString().slice(0, 10);
        if (eventDate === todayDate) isApplicable = true;
      }

      // 2. Day of week check (e.g., Friday = 5)
      if (event.occursDayOfWeek === prismaDayOfWeek) {
        isApplicable = true;
      }

      // 3. Birthday check
      if (event.type === SpecialEventTypeEnum.BIRTHDAY && user?.birthday) {
        const userBirthdayMonthDay = new Date(user.birthday).toISOString().slice(5, 10);
        if (userBirthdayMonthDay === todayMonthDay) {
          isApplicable = true;
        }
      }

      if (isApplicable) {
        benefits.push({
          type: event.type as SpecialEventTypeEnum,
          name: event.name,
          description: event.description,
          discountPercent: Number(event.discountPercent || 0),
          discountAmount: Number(event.discountAmount || 0),
          freeItemIds: event.freeItemIds,
        });
      }
    }

    return benefits;
  }
}

import { OrderStatusEnum, DeliveryStageEnum } from '@turon/shared';

export class StatusService {
  /**
   * Validates if the order status transition is permissible.
   */
  static validateOrderStatusTransition(from: OrderStatusEnum, to: OrderStatusEnum): boolean {
    if (from === to) return true;

    const allowedTransitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.PENDING]: [OrderStatusEnum.PREPARING, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.PREPARING]: [OrderStatusEnum.READY_FOR_PICKUP, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.READY_FOR_PICKUP]: [OrderStatusEnum.DELIVERING, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.DELIVERING]: [OrderStatusEnum.DELIVERED, OrderStatusEnum.CANCELLED],
      [OrderStatusEnum.DELIVERED]: [], // Terminal state
      [OrderStatusEnum.CANCELLED]: [], // Terminal state
    };

    return allowedTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Validates if the delivery stage transition is permissible.
   */
  static validateDeliveryStageTransition(from: DeliveryStageEnum, to: DeliveryStageEnum): boolean {
    if (from === to) return true;

    const sequence = [
      DeliveryStageEnum.IDLE,
      DeliveryStageEnum.GOING_TO_RESTAURANT,
      DeliveryStageEnum.ARRIVED_AT_RESTAURANT,
      DeliveryStageEnum.PICKED_UP,
      DeliveryStageEnum.DELIVERING,
      DeliveryStageEnum.ARRIVED_AT_DESTINATION,
      DeliveryStageEnum.DELIVERED,
    ];

    const fromIndex = sequence.indexOf(from);
    const toIndex = sequence.indexOf(to);

    return toIndex === fromIndex + 1;
  }

  /**
   * Maps a DeliveryStage update to a potential OrderStatus update.
   */
  static mapStageToOrderStatus(stage: DeliveryStageEnum): OrderStatusEnum | null {
    switch (stage) {
      case DeliveryStageEnum.PICKED_UP:
      case DeliveryStageEnum.DELIVERING:
      case DeliveryStageEnum.ARRIVED_AT_DESTINATION:
        return OrderStatusEnum.DELIVERING;
      case DeliveryStageEnum.DELIVERED:
        return OrderStatusEnum.DELIVERED;
      default:
        return null; // No transition for other stages
    }
  }
}

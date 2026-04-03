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

    const allowedTransitions: Partial<Record<DeliveryStageEnum, DeliveryStageEnum[]>> = {
      [DeliveryStageEnum.IDLE]: [DeliveryStageEnum.GOING_TO_RESTAURANT, DeliveryStageEnum.ARRIVED_AT_RESTAURANT],
      [DeliveryStageEnum.GOING_TO_RESTAURANT]: [DeliveryStageEnum.ARRIVED_AT_RESTAURANT],
      [DeliveryStageEnum.ARRIVED_AT_RESTAURANT]: [DeliveryStageEnum.PICKED_UP],
      [DeliveryStageEnum.PICKED_UP]: [DeliveryStageEnum.DELIVERING],
      [DeliveryStageEnum.DELIVERING]: [DeliveryStageEnum.ARRIVED_AT_DESTINATION, DeliveryStageEnum.DELIVERED],
      [DeliveryStageEnum.ARRIVED_AT_DESTINATION]: [DeliveryStageEnum.DELIVERED],
    };

    return allowedTransitions[from]?.includes(to) ?? false;
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

  /**
   * Maps an operational courier assignment status from the database
   * to the Mini App delivery stage used by the existing frontend.
   */
  static mapAssignmentStatusToDeliveryStage(
    assignmentStatus?: string | null,
    orderStatus?: OrderStatusEnum,
    latestEventType?: string | null,
  ): DeliveryStageEnum {
    if (orderStatus === OrderStatusEnum.DELIVERED) {
      return DeliveryStageEnum.DELIVERED;
    }

    switch (latestEventType) {
      case 'ARRIVED_AT_RESTAURANT':
        return DeliveryStageEnum.ARRIVED_AT_RESTAURANT;
      case 'PICKED_UP':
        return DeliveryStageEnum.PICKED_UP;
      case 'DELIVERING':
        return DeliveryStageEnum.DELIVERING;
      case 'ARRIVED_AT_DESTINATION':
        return DeliveryStageEnum.ARRIVED_AT_DESTINATION;
      case 'DELIVERED':
        return DeliveryStageEnum.DELIVERED;
      case 'ACCEPTED':
        return DeliveryStageEnum.GOING_TO_RESTAURANT;
      default:
        break;
    }

    switch (assignmentStatus) {
      case 'ASSIGNED':
        return DeliveryStageEnum.IDLE;
      case 'ACCEPTED':
        return DeliveryStageEnum.GOING_TO_RESTAURANT;
      case 'PICKED_UP':
        return DeliveryStageEnum.PICKED_UP;
      case 'DELIVERING':
        return DeliveryStageEnum.DELIVERING;
      case 'DELIVERED':
        return DeliveryStageEnum.DELIVERED;
      default:
        return DeliveryStageEnum.IDLE;
    }
  }

  /**
   * Maps an app-level delivery stage to the concrete courier assignment status
   * stored in Supabase.
   */
  static mapStageToAssignmentStatus(stage: DeliveryStageEnum): string | null {
    switch (stage) {
      case DeliveryStageEnum.GOING_TO_RESTAURANT:
        return 'ASSIGNED';
      case DeliveryStageEnum.ARRIVED_AT_RESTAURANT:
        return 'ACCEPTED';
      case DeliveryStageEnum.PICKED_UP:
        return 'PICKED_UP';
      case DeliveryStageEnum.DELIVERING:
      case DeliveryStageEnum.ARRIVED_AT_DESTINATION:
        return 'DELIVERING';
      case DeliveryStageEnum.DELIVERED:
        return 'DELIVERED';
      default:
        return null;
    }
  }

  static isActiveAssignmentStatus(status?: string | null): boolean {
    return ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERING'].includes(status ?? '');
  }
}

import { OrderStatusEnum, DeliveryStageEnum } from '@turon/shared';
export declare class StatusService {
    /**
     * Validates if the order status transition is permissible.
     */
    static validateOrderStatusTransition(from: OrderStatusEnum, to: OrderStatusEnum): boolean;
    /**
     * Validates if the delivery stage transition is permissible.
     */
    static validateDeliveryStageTransition(from: DeliveryStageEnum, to: DeliveryStageEnum): boolean;
    /**
     * Maps a DeliveryStage update to a potential OrderStatus update.
     */
    static mapStageToOrderStatus(stage: DeliveryStageEnum): OrderStatusEnum | null;
}
//# sourceMappingURL=status.service.d.ts.map
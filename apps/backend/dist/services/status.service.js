"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusService = void 0;
const shared_1 = require("@turon/shared");
class StatusService {
    /**
     * Validates if the order status transition is permissible.
     */
    static validateOrderStatusTransition(from, to) {
        if (from === to)
            return true;
        const allowedTransitions = {
            [shared_1.OrderStatusEnum.PENDING]: [shared_1.OrderStatusEnum.PREPARING, shared_1.OrderStatusEnum.CANCELLED],
            [shared_1.OrderStatusEnum.PREPARING]: [shared_1.OrderStatusEnum.READY_FOR_PICKUP, shared_1.OrderStatusEnum.CANCELLED],
            [shared_1.OrderStatusEnum.READY_FOR_PICKUP]: [shared_1.OrderStatusEnum.DELIVERING, shared_1.OrderStatusEnum.CANCELLED],
            [shared_1.OrderStatusEnum.DELIVERING]: [shared_1.OrderStatusEnum.DELIVERED, shared_1.OrderStatusEnum.CANCELLED],
            [shared_1.OrderStatusEnum.DELIVERED]: [], // Terminal state
            [shared_1.OrderStatusEnum.CANCELLED]: [], // Terminal state
        };
        return allowedTransitions[from]?.includes(to) ?? false;
    }
    /**
     * Validates if the delivery stage transition is permissible.
     */
    static validateDeliveryStageTransition(from, to) {
        if (from === to)
            return true;
        const sequence = [
            shared_1.DeliveryStageEnum.IDLE,
            shared_1.DeliveryStageEnum.GOING_TO_RESTAURANT,
            shared_1.DeliveryStageEnum.ARRIVED_AT_RESTAURANT,
            shared_1.DeliveryStageEnum.PICKED_UP,
            shared_1.DeliveryStageEnum.DELIVERING,
            shared_1.DeliveryStageEnum.ARRIVED_AT_DESTINATION,
            shared_1.DeliveryStageEnum.DELIVERED,
        ];
        const fromIndex = sequence.indexOf(from);
        const toIndex = sequence.indexOf(to);
        return toIndex === fromIndex + 1;
    }
    /**
     * Maps a DeliveryStage update to a potential OrderStatus update.
     */
    static mapStageToOrderStatus(stage) {
        switch (stage) {
            case shared_1.DeliveryStageEnum.PICKED_UP:
            case shared_1.DeliveryStageEnum.DELIVERING:
            case shared_1.DeliveryStageEnum.ARRIVED_AT_DESTINATION:
                return shared_1.OrderStatusEnum.DELIVERING;
            case shared_1.DeliveryStageEnum.DELIVERED:
                return shared_1.OrderStatusEnum.DELIVERED;
            default:
                return null; // No transition for other stages
        }
    }
}
exports.StatusService = StatusService;
//# sourceMappingURL=status.service.js.map
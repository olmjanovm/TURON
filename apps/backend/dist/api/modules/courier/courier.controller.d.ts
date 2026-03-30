import { FastifyReply, FastifyRequest } from 'fastify';
import { DeliveryStageEnum } from '@turon/shared';
export declare function getCourierOrders(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getCourierOrderDetail(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function updateOrderStage(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: {
        stage: DeliveryStageEnum;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=courier.controller.d.ts.map
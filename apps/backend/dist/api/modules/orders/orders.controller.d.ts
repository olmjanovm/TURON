import { FastifyReply, FastifyRequest } from 'fastify';
export declare function handleCreateOrder(request: FastifyRequest<{
    Body: any;
}>, reply: FastifyReply): Promise<never>;
export declare function getMyOrders(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getOrderDetail(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function handleUpdateStatus(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: any;
}>, reply: FastifyReply): Promise<never>;
export declare function handleAssignCourier(request: FastifyRequest<{
    Params: {
        id: string;
    };
    Body: {
        courierId: string;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=orders.controller.d.ts.map
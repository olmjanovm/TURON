import { FastifyReply, FastifyRequest } from 'fastify';
export declare function validatePromoCode(request: FastifyRequest<{
    Body: {
        code: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function getAllPromos(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function handleCreatePromo(request: FastifyRequest<{
    Body: any;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=promos.controller.d.ts.map
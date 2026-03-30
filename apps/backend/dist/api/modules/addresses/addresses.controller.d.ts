import { FastifyReply, FastifyRequest } from 'fastify';
export declare function getAddresses(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function handleCreateAddress(request: FastifyRequest<{
    Body: any;
}>, reply: FastifyReply): Promise<never>;
export declare function handleDeleteAddress(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=addresses.controller.d.ts.map
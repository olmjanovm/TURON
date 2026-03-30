import { FastifyReply, FastifyRequest } from 'fastify';
export declare function getCategories(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getProducts(request: FastifyRequest, reply: FastifyReply): Promise<never>;
export declare function getProductById(request: FastifyRequest<{
    Params: {
        id: string;
    };
}>, reply: FastifyReply): Promise<never>;
export declare function handleCreateCategory(request: FastifyRequest<{
    Body: any;
}>, reply: FastifyReply): Promise<never>;
export declare function handleCreateProduct(request: FastifyRequest<{
    Body: any;
}>, reply: FastifyReply): Promise<never>;
//# sourceMappingURL=menu.controller.d.ts.map
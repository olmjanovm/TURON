"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = orderRoutes;
const orders_controller_1 = require("./orders.controller");
const schemas_1 = require("../../utils/schemas");
const shared_1 = require("@turon/shared");
async function orderRoutes(fastify) {
    // Routes for all roles (Authenticated)
    fastify.get('/my', orders_controller_1.getMyOrders);
    fastify.get('/:id', {
        schema: { params: schemas_1.IdParamSchema }
    }, orders_controller_1.getOrderDetail);
    fastify.post('/', {
        schema: { body: schemas_1.CreateOrderSchema }
    }, orders_controller_1.handleCreateOrder);
    // Admin operational routes
    fastify.register(async (admin) => {
        admin.addHook('preHandler', admin.authorize([shared_1.UserRoleEnum.ADMIN]));
        admin.patch('/:id/status', {
            schema: { params: schemas_1.IdParamSchema, body: schemas_1.UpdateOrderStatusSchema }
        }, orders_controller_1.handleUpdateStatus);
        admin.patch('/:id/assign-courier', {
            schema: {
                params: schemas_1.IdParamSchema,
                body: { type: 'object', required: ['courierId'], properties: { courierId: { type: 'string' } } }
            }
        }, orders_controller_1.handleAssignCourier);
    });
}
//# sourceMappingURL=orders.routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = courierRoutes;
const courier_controller_1 = require("./courier.controller");
const schemas_1 = require("../../utils/schemas");
const shared_1 = require("@turon/shared");
async function courierRoutes(fastify) {
    // All routes in this module require COURIER role
    fastify.addHook('preHandler', fastify.authorize([shared_1.UserRoleEnum.COURIER, shared_1.UserRoleEnum.ADMIN]));
    fastify.get('/orders', courier_controller_1.getCourierOrders);
    fastify.get('/order/:id', {
        schema: {
            params: schemas_1.IdParamSchema
        }
    }, courier_controller_1.getCourierOrderDetail);
    fastify.patch('/order/:id/stage', {
        schema: {
            params: schemas_1.IdParamSchema,
            body: schemas_1.UpdateDeliveryStageSchema
        }
    }, courier_controller_1.updateOrderStage);
}
//# sourceMappingURL=courier.routes.js.map
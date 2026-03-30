"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = promoRoutes;
const promos_controller_1 = require("./promos.controller");
const schemas_1 = require("../../utils/schemas");
const shared_1 = require("@turon/shared");
async function promoRoutes(fastify) {
    // Public validation
    fastify.post('/validate', {
        schema: { body: schemas_1.ValidatePromoSchema }
    }, promos_controller_1.validatePromoCode);
    // Admin management
    fastify.register(async (admin) => {
        admin.addHook('preHandler', admin.authorize([shared_1.UserRoleEnum.ADMIN]));
        admin.get('/', promos_controller_1.getAllPromos);
        admin.post('/', {
            schema: { body: schemas_1.PromoCodeSchema }
        }, promos_controller_1.handleCreatePromo);
    });
}
//# sourceMappingURL=promos.routes.js.map
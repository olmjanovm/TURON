"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addressRoutes;
const addresses_controller_1 = require("./addresses.controller");
const schemas_1 = require("../../utils/schemas");
async function addressRoutes(fastify) {
    // All address routes require authentication (added in app.ts registration)
    fastify.get('/', addresses_controller_1.getAddresses);
    fastify.post('/', {
        schema: { body: schemas_1.AddressSchema }
    }, addresses_controller_1.handleCreateAddress);
    fastify.delete('/:id', {
        schema: { params: schemas_1.IdParamSchema }
    }, addresses_controller_1.handleDeleteAddress);
}
//# sourceMappingURL=addresses.routes.js.map
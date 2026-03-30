"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const auth_controller_1 = require("./auth.controller");
const schemas_1 = require("../../utils/schemas");
async function authRoutes(fastify) {
    fastify.post('/telegram', {
        schema: {
            body: schemas_1.TelegramAuthSchema
        }
    }, auth_controller_1.telegramAuthHandler);
}
//# sourceMappingURL=auth.routes.js.map
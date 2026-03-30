"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const cors_1 = __importDefault(require("@fastify/cors"));
const auth_1 = __importDefault(require("./plugins/auth"));
const security_1 = __importDefault(require("./plugins/security"));
const validation_1 = __importDefault(require("./plugins/validation"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const courier_routes_1 = __importDefault(require("./modules/courier/courier.routes"));
const menu_routes_1 = __importDefault(require("./modules/menu/menu.routes"));
const orders_routes_1 = __importDefault(require("./modules/orders/orders.routes"));
const addresses_routes_1 = __importDefault(require("./modules/addresses/addresses.routes"));
const promos_routes_1 = __importDefault(require("./modules/promos/promos.routes"));
exports.default = (0, fastify_plugin_1.default)(async function (fastify, opts) {
    // 1. Core Plugins
    fastify.register(cors_1.default);
    fastify.register(security_1.default);
    fastify.register(validation_1.default);
    // 2. Auth Plugin (JWT + Guards)
    fastify.register(auth_1.default);
    const api = fastify.withTypeProvider();
    // 3. Register Modules
    api.register(auth_routes_1.default, { prefix: '/auth' });
    api.register(menu_routes_1.default, { prefix: '/menu' });
    api.register(promos_routes_1.default, { prefix: '/promos' });
    // Authenticated Protected Modules
    api.register(async (authenticated) => {
        authenticated.addHook('preHandler', authenticated.authenticate);
        authenticated.register(courier_routes_1.default, { prefix: '/courier' });
        authenticated.register(orders_routes_1.default, { prefix: '/orders' });
        authenticated.register(addresses_routes_1.default, { prefix: '/addresses' });
    });
    // 4. Health Check
    fastify.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
});
//# sourceMappingURL=app.js.map
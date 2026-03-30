"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
exports.default = (0, fastify_plugin_1.default)(async function authPlugin(fastify) {
    fastify.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || 'super-secret-key'
    });
    // Authenticate middleware
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send(err);
        }
    });
    // Role guard middleware
    fastify.decorate('authorize', function (allowedRoles) {
        return async (request, reply) => {
            const user = request.user;
            if (!user || !allowedRoles.includes(user.role)) {
                return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
            }
        };
    });
});
//# sourceMappingURL=auth.js.map
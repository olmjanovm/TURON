"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const config_1 = require("../../config");
exports.default = (0, fastify_plugin_1.default)(async function securityPlugin(fastify) {
    // 1. Security Headers
    await fastify.register(helmet_1.default, {
        contentSecurityPolicy: config_1.env.NODE_ENV === 'production' ? undefined : false,
    });
    // 2. Rate Limiting
    await fastify.register(rate_limit_1.default, {
        max: config_1.env.RATE_LIMIT_MAX,
        timeWindow: '1 minute',
        errorResponseBuilder: (request, context) => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Sekundiga so'rovlar soni oshib ketdi. Iltimos ${context.after} kutib turing.`
        })
    });
});
//# sourceMappingURL=security.js.map
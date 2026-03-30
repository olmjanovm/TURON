"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
dotenv_1.default.config({ path: '../../../.env' });
const server = (0, fastify_1.default)({
    logger: true
});
// Environment Validation
const requiredEnv = ['DATABASE_URL', 'BOT_TOKEN', 'JWT_SECRET'];
requiredEnv.forEach(env => {
    if (!process.env[env]) {
        console.error(`❌ Missing required environment variable: ${env}`);
        process.exit(1);
    }
});
async function main() {
    try {
        // 1. Register App
        await server.register(app_1.default);
        // 2. Start Listening
        const port = Number(process.env.PORT) || 3000;
        const host = process.env.API_HOST || '0.0.0.0';
        await server.listen({ port, host });
        console.log(`🚀 Turon API is running at http://${host}:${port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map
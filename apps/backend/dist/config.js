"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const configSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().url(),
    BOT_TOKEN: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(8),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
});
const _env = configSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
    process.exit(1);
}
exports.env = _env.data;
//# sourceMappingURL=config.js.map
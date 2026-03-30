import { z } from 'zod';
declare const configSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<{
        development: "development";
        production: "production";
        test: "test";
    }>>;
    PORT: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    DATABASE_URL: z.ZodString;
    BOT_TOKEN: z.ZodString;
    JWT_SECRET: z.ZodString;
    CORS_ORIGIN: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const env: z.infer<typeof configSchema>;
export {};
//# sourceMappingURL=config.d.ts.map
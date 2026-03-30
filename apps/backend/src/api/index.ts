import fastify from 'fastify';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({ path: '../../../.env' });

const server = fastify({
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
    await server.register(app);

    // 2. Start Listening
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.API_HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 Turon API is running at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();

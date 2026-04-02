import fastify from 'fastify';
import { env } from '../config.js';
import app from './app.js';
import { launchTelegramBot, stopTelegramBot } from '../services/telegram-bot.service.js';

const server = fastify({
  logger: true
});

// Environment Validation is now handled in config.ts

async function main() {
  try {
    // 1. Register App
    await server.register(app);

    if (env.NODE_ENV === 'production') {
      try {
        await launchTelegramBot('api');
      } catch (botError) {
        server.log.error(botError, 'Telegram bot failed to launch inside API process');
      }
    }

    // 2. Start Listening
    const port = env.PORT;
    const host = env.API_HOST;

    await server.listen({ port, host });
    console.log(`🚀 Turon API is running at http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();

process.once('SIGINT', () => {
  void stopTelegramBot('SIGINT');
});

process.once('SIGTERM', () => {
  void stopTelegramBot('SIGTERM');
});

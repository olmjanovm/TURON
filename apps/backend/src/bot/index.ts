import { env } from '../config.js';
import { launchTelegramBot, stopTelegramBot } from '../services/telegram-bot.service.js';

if (!env.BOT_TOKEN) {
  console.error('BOT_TOKEN is missing in the environment.');
  process.exit(1);
}

if (!env.WEB_APP_URL) {
  console.error('WEB_APP_URL is missing in the environment.');
  process.exit(1);
}

launchTelegramBot('bot').catch((error) => {
  console.error('Telegram bot failed to launch.', error);
  process.exit(1);
});

process.once('SIGINT', () => {
  void stopTelegramBot('SIGINT');
});

process.once('SIGTERM', () => {
  void stopTelegramBot('SIGTERM');
});

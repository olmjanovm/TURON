// Ensure environment variables are loaded
require('dotenv').config();

module.exports = {
  // Telegram Bot Token
  botToken: process.env.BOT_TOKEN,

  // Database Connection URL
  databaseUrl: process.env.DATABASE_URL,

  // Redis Connection URL
  redisUrl: process.env.REDIS_URL,

  // Telegram Mini App URL
  webAppUrl: process.env.WEB_APP_URL,
};

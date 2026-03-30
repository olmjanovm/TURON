"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const client_1 = require("@prisma/client");
const shared_1 = require("@turon/shared");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '../../../.env' });
const botToken = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://your-ngrok-url.ngrok-free.dev';
if (!botToken) {
    console.error('❌ BOT_TOKEN is missing in .env');
    process.exit(1);
}
const bot = new telegraf_1.Telegraf(botToken);
const prisma = new client_1.PrismaClient();
// --- Auth Utilities ---
async function getUserRole(telegramId) {
    const user = await prisma.user.findUnique({
        where: { telegramId },
        include: { roles: true }
    });
    if (!user || user.roles.length === 0)
        return shared_1.UserRoleEnum.CUSTOMER;
    const roles = user.roles.map(r => r.role);
    if (roles.includes(shared_1.UserRoleEnum.ADMIN))
        return shared_1.UserRoleEnum.ADMIN;
    if (roles.includes(shared_1.UserRoleEnum.COURIER))
        return shared_1.UserRoleEnum.COURIER;
    return shared_1.UserRoleEnum.CUSTOMER;
}
// --- Commands ---
bot.start(async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const role = await getUserRole(telegramId);
    let message = "Assalomu alaykum! Turon kafesi botiga xush kelibsiz. 🥘\n\nQuyidagi tugma orqali taom buyurtma qilishingiz mumkin:";
    let buttonLabel = "📱 Ilovani ochish";
    if (role === shared_1.UserRoleEnum.ADMIN) {
        message = "Assalomu alaykum, Admin! Turon boshqaruv paneliga xush kelibsiz. 🏢\n\nBoshqaruvni boshlash uchun tugmani bosing:";
        buttonLabel = "🎛️ Admin Panelni ochish";
    }
    else if (role === shared_1.UserRoleEnum.COURIER) {
        message = "Assalomu alaykum, Kurer! Senga yangi buyurtmalar va yetkazib berish xaritasi tayyor. 🚚\n\nKurer profilini ochish:";
        buttonLabel = "📦 Kurer Panelni ochish";
    }
    return ctx.reply(message, telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.webApp(buttonLabel, webAppUrl)]
    ]));
});
// --- Execution ---
bot.launch().then(() => {
    console.log('🤖 Turon Bot is running...');
});
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
//# sourceMappingURL=index.js.map
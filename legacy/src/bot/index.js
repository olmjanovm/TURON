require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const config = require('../../config');
const prisma = require('../database/client');

// Import Middlewares
const session = require('./middlewares/session');
const auth = require('./middlewares/auth');
const language = require('./middlewares/language');

// Import Component Helpers Logically
const { buildStartKeyboard } = require('./keyboards/start');
const { getStartMessage } = require('../utils/start-message');

// Initialize the Telegram bot instance explicitly safely natively
const bot = new Telegraf(config.botToken);

// Execute critical middlewares establishing global scopes cleanly correctly
bot.use(session());
bot.use(auth);    
bot.use(language);

// --- CORE ENTRY PROTOCOL ---
bot.start(async (ctx) => {
    try {
        const structuralRole = ctx.state.role || 'customer';
        const userData = ctx.state.user || { name: ctx.from?.first_name || 'Hurmatli mijoz' };
        
        const nativeText = getStartMessage(structuralRole, userData);
        const dynamicMatrix = buildStartKeyboard(structuralRole);
        
        if (!dynamicMatrix) {
            return ctx.reply(`${nativeText}\n\n⚠️ Kechirasiz, hozirda Ilova manzili sozlanmagan. Iltimos, keyinroq urinib ko'ring.`);
        }

        await ctx.reply(nativeText, dynamicMatrix);
    } catch (err) {
        console.error('Failed to trigger native start loop flawlessly locally:', err);
    }
});

// --- SECURITY GUARDS ---
const guardAdmin = async (ctx, next) => {
    if (ctx.state.role !== 'admin') return ctx.reply('🚫 Tizim ruxsati rad etildi.');
    return next();
};
const guardCourier = async (ctx, next) => {
    if (ctx.state.role !== 'courier') return ctx.reply('🚫 Tizim ruxsati rad etildi. Kuryerlar uchun yopiq.');
    return next();
};

// Help command as a fallback
bot.help(async (ctx) => {
    const accessTag = ctx.state.role || 'customer';
    let helpLog = "Turon Kafesi Murojaat Markazi: +998900000000\n\nQo'shimcha so'rovlar bo'yicha filial bilan bog'laning.";
    if (accessTag === 'admin') helpLog += "\n\nAdmin Eslatma: Barcha amallar Ilova ichida bajariladi.";
    if (accessTag === 'courier') helpLog += "\n\nKuryer Eslatma: Buyurtmalar ilova orqali boshqariladi.";
    await ctx.reply(helpLog);
});


// --- WILDCARD DISPOSAL ---
// Safely acknowledges any unknown payloads dropping spinning clocks dynamically
bot.on('callback_query', async (ctx, next) => {
    try {
        await ctx.answerCbQuery('Eskirgan tugma!', { show_alert: true });
    } catch (e) {
        console.error('Unhandled callback flush automatically deleted natively: ', e);
    }
    return next();
});

// Structural application crash wrapper shielding users directly natively
bot.catch((err, ctx) => {
    console.error(`Dynamic trace shield executed blocking trace leakage dynamically near ${ctx.updateType}:`, err);
});


// --- BOOTSTRAP EXECUTOR ---
const { launchAPI } = require('../api/server');

async function bootstrap() {
    try {
        console.log('--- STARTING TURON ECOSYSTEM ---');
        
        // Step 1: Launch API
        launchAPI();
        console.log('✅ Step 1: Express REST API successfully deployed');

        // Step 2: Connect DB
        console.log('⏳ Step 2: Establishing Prisma database connection...');
        await prisma.$connect();
        console.log('✅ Step 2: Database connection verified explicitly');

        // Step 3: Launch Bot
        console.log('⏳ Step 3: Triggering Telegraf poll instance...');
        await bot.launch({ dropPendingUpdates: true });
        console.log('✅ Step 3: Bot launched in polling mode - GO!');
        
    } catch (err) {
        console.error("❌ CRITICAL BOOTSTRAP FAILURE:", err);
        process.exit(1);
    }
}

// Graceful application closures structurally keeping caches logically cleanly
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bootstrap();

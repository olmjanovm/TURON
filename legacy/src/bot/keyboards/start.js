const { Markup } = require('telegraf');
const config = require('../../../config');

function buildStartKeyboard(role) {
    const WEB_APP_URL = config.webAppUrl;
    
    if (!WEB_APP_URL) {
        return null; // Return null to indicate no keyboard should be sent, handle fallback in index.js
    }

    // Role-based pathing is handled by the Mini App internally via initData validation,
    // so we just provide the main entry point for simplicity.
    const webAppUrl = config.webAppUrl;
    
    // Telegram strictly requires HTTPS for WebApp buttons. 
    // Fallback to regular URL button in localhost/dev to prevent 400 Bad Request.
    const isHttps = webAppUrl && webAppUrl.startsWith('https://');

    if (isHttps) {
        return Markup.inlineKeyboard([
            [Markup.button.webApp('📱 Ilovani ochish', webAppUrl)]
        ]);
    } else {
        // Fallback or warning button gracefully
        return Markup.inlineKeyboard([
            [Markup.button.url('🌐 Brauzerda ochish (Test)', webAppUrl || 'http://localhost:5173')]
        ]);
    }
}

module.exports = { buildStartKeyboard };

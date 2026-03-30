"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTelegramWebAppData = verifyTelegramWebAppData;
exports.parseTelegramInitData = parseTelegramInitData;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Verifies the authenticity of data received from the Telegram Mini App.
 * Uses the bot token to create a secret key and check the HMAC-SHA256 signature.
 *
 * @param initData - The raw initData string from the Mini App
 * @param botToken - The bot token from BotFather
 * @returns boolean - True if the signature is valid
 */
function verifyTelegramWebAppData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const dataCheckString = Array.from(urlParams.entries())
        .map(([key, value]) => `${key}=${value}`)
        .sort()
        .join('\n');
    const secretKey = crypto_1.default
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();
    const hmac = crypto_1.default
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    return hmac === hash;
}
/**
 * Extracts and parses user info from Telegram initData.
 * @param initData - The raw initData string
 * @returns Parsed user object or null
 */
function parseTelegramInitData(initData) {
    const urlParams = new URLSearchParams(initData);
    const userString = urlParams.get('user');
    if (!userString)
        return null;
    try {
        return JSON.parse(userString);
    }
    catch (e) {
        return null;
    }
}
//# sourceMappingURL=telegram.js.map
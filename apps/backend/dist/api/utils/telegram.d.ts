/**
 * Verifies the authenticity of data received from the Telegram Mini App.
 * Uses the bot token to create a secret key and check the HMAC-SHA256 signature.
 *
 * @param initData - The raw initData string from the Mini App
 * @param botToken - The bot token from BotFather
 * @returns boolean - True if the signature is valid
 */
export declare function verifyTelegramWebAppData(initData: string, botToken: string): boolean;
/**
 * Extracts and parses user info from Telegram initData.
 * @param initData - The raw initData string
 * @returns Parsed user object or null
 */
export declare function parseTelegramInitData(initData: string): any;
//# sourceMappingURL=telegram.d.ts.map
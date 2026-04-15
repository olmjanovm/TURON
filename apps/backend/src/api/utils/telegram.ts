import crypto from 'crypto';

/**
 * Verifies the authenticity of data received from the Telegram Mini App.
 * Uses the bot token to create a secret key and check the HMAC-SHA256 signature.
 * 
 * @param initData - The raw initData string from the Mini App
 * @param botToken - The bot token from BotFather
 * @returns boolean - True if the signature is valid
 */
export function verifyTelegramWebAppData(initData: string, botToken: string): boolean {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  const authDateRaw = urlParams.get('auth_date');

  if (!hash || !authDateRaw) {
    return false;
  }

  const authDate = Number(authDateRaw);
  if (!Number.isFinite(authDate)) {
    return false;
  }

  // Anti-replay: reject initData older than 10 minutes
  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = 10 * 60;
  if (authDate <= 0 || nowSeconds - authDate > maxAgeSeconds) {
    return false;
  }

  urlParams.delete('hash');

  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  try {
    const a = Buffer.from(hmac, 'utf8');
    const b = Buffer.from(hash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Extracts and parses user info from Telegram initData.
 * @param initData - The raw initData string
 * @returns Parsed user object or null
 */
export function parseTelegramInitData(initData: string) {
  const urlParams = new URLSearchParams(initData);
  const userString = urlParams.get('user');
  
  if (!userString) return null;
  
  try {
    return JSON.parse(userString);
  } catch (e) {
    return null;
  }
}

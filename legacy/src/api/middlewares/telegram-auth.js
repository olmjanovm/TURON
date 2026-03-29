const crypto = require('crypto');
const config = require('../../../config');

// Native Telegram WebAppData cryptographic validation algorithm structurally checking payload bounds
function validateWebAppData(initData, botToken) {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    // Safety check intercepting physically corrupted payloads organically
    if (!hash) return false;
    
    urlParams.delete('hash');
    urlParams.sort();

    let dataCheckString = '';
    for (const [key, value] of urlParams.entries()) {
        dataCheckString += `${key}=${value}\n`;
    }
    dataCheckString = dataCheckString.slice(0, -1);

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculatedHash === hash;
}

const telegramAuth = (req, res, next) => {
    // React Frontend (Vite) MUST append this securely in Axios headers:
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData) {
        // Fallback for Development Environment bypass locally testing React visually
        if (process.env.NODE_ENV === 'development') {
             console.warn('⚠️ No initData found. Allowing bypass because NODE_ENV is development.');
             req.telegramUser = { id: 1234567, first_name: 'Dev User' };
             return next();
        }
        return res.status(401).json({ error: 'Missing Telegram Authentication Sequence' });
    }

    try {
        const isValid = validateWebAppData(initData, config.botToken);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or Forged Telegram Signature' });
        }
        
        // Successfully mapped cleanly natively natively
        const urlParams = new URLSearchParams(initData);
        const userStr = urlParams.get('user');
        if (userStr) {
            req.telegramUser = JSON.parse(userStr);
        }
        
        next();
    } catch (err) {
        console.error('Auth verification securely trapped an exception:', err);
        return res.status(403).json({ error: 'Server authentication bounds failed natively' });
    }
};

module.exports = telegramAuth;

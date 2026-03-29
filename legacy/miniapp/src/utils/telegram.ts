import WebApp from '@twa-dev/sdk';

export const initTelegramWebApp = () => {
    WebApp.ready();
    WebApp.expand();
    
    // Subtly inject responsive iOS/Android color schemes naturally mapping visual continuity intuitively
    if (WebApp.colorScheme === 'dark') {
      document.body.classList.add('dark');
    }
};

export const getTelegramInitData = () => {
    return WebApp.initData || '';
};

export const getTelegramUser = () => {
    return WebApp.initDataUnsafe?.user || null;
};

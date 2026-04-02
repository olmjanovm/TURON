declare global {
  interface Window {
    Telegram: any;
  }
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp;

  return {
    tg,
    user: tg?.initDataUnsafe?.user,
    initData: tg?.initData || '',
    expand: () => tg?.expand(),
    close: () => tg?.close(),
    ready: () => tg?.ready(),
    showBackButton: () => tg?.BackButton?.show(),
    hideBackButton: () => tg?.BackButton?.hide(),
    onClose: (callback: () => void) => tg?.onEvent('viewportChanged', callback),
  };
}

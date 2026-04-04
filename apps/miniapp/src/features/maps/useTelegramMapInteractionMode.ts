import React from 'react';

let activeMapInteractionLocks = 0;

export function useTelegramMapInteractionMode(enabled = true) {
  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const webApp = window.Telegram?.WebApp;
    const canDisableVerticalSwipes = typeof webApp?.disableVerticalSwipes === 'function';

    if (typeof webApp?.expand === 'function') {
      try {
        webApp.expand();
      } catch {
        // Telegram WebApp expand is best-effort only.
      }
    }

    if (canDisableVerticalSwipes) {
      activeMapInteractionLocks += 1;

      try {
        webApp.disableVerticalSwipes();
      } catch {
        activeMapInteractionLocks = Math.max(0, activeMapInteractionLocks - 1);
      }
    }

    return () => {
      if (!canDisableVerticalSwipes) {
        return;
      }

      activeMapInteractionLocks = Math.max(0, activeMapInteractionLocks - 1);

      if (activeMapInteractionLocks === 0 && typeof webApp?.enableVerticalSwipes === 'function') {
        try {
          webApp.enableVerticalSwipes();
        } catch {
          // Ignore cleanup-only Telegram API issues.
        }
      }
    };
  }, [enabled]);
}

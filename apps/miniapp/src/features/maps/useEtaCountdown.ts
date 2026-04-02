import { useEffect, useState } from 'react';
import { formatEtaCountdown, getEtaCountdownSeconds } from './route';

export function useEtaCountdown(etaMinutes?: number, lastUpdatedAt?: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (typeof etaMinutes !== 'number' || etaMinutes <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [etaMinutes, lastUpdatedAt]);

  if (typeof etaMinutes !== 'number') {
    return {
      countdownSeconds: null,
      countdownLabel: null,
      isExpired: false,
    };
  }

  const countdownSeconds = getEtaCountdownSeconds(etaMinutes, lastUpdatedAt, now);

  return {
    countdownSeconds,
    countdownLabel: formatEtaCountdown(countdownSeconds),
    isExpired: countdownSeconds === 0,
  };
}

import React, { useEffect, useMemo, useState } from 'react';
import {
  dialPhoneNumber,
  formatPhoneForCallButton,
  normalizeCallablePhone,
  PHONE_CALL_REQUEST_EVENT,
  type PhoneCallRequestDetail,
} from '../../lib/callUtils';

export const CallConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<PhoneCallRequestDetail | null>(null);

  useEffect(() => {
    const onCallRequest = (event: Event) => {
      const detail = (event as CustomEvent<PhoneCallRequestDetail>).detail;
      const phoneNumber = normalizeCallablePhone(detail?.phoneNumber);
      if (!phoneNumber) return;
      setRequest({ phoneNumber, displayName: detail.displayName });
    };

    window.addEventListener(PHONE_CALL_REQUEST_EVENT, onCallRequest);
    return () => window.removeEventListener(PHONE_CALL_REQUEST_EVENT, onCallRequest);
  }, []);

  const displayPhone = useMemo(
    () => (request ? formatPhoneForCallButton(request.phoneNumber) : ''),
    [request],
  );

  const close = () => setRequest(null);

  const confirm = () => {
    if (!request) return;
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    const phoneNumber = request.phoneNumber;
    setRequest(null);
    dialPhoneNumber(phoneNumber);
  };

  return (
    <>
      {children}
      {request ? (
        <>
          <button
            type="button"
            aria-label="Qo'ng'iroq oynasini yopish"
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99998,
              border: 'none',
              background: 'rgba(0,0,0,0.48)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${displayPhone} raqamiga qo'ng'iroq qilish`}
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
              zIndex: 99999,
              width: 'calc(100% - 28px)',
              maxWidth: 430,
              transform: 'translateX(-50%)',
              borderRadius: 28,
              overflow: 'hidden',
              background: 'rgba(18,18,20,0.96)',
              padding: 8,
              boxShadow: '0 18px 60px rgba(0,0,0,0.48)',
            }}
          >
            <button
              type="button"
              onClick={confirm}
              style={{
                width: '100%',
                minHeight: 58,
                border: 'none',
                borderRadius: 21,
                background: '#0A84FF',
                color: '#ffffff',
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
              }}
            >
              Call {displayPhone}
            </button>
            <button
              type="button"
              onClick={close}
              style={{
                width: '100%',
                minHeight: 58,
                marginTop: 8,
                border: 'none',
                borderRadius: 21,
                background: '#2C2C2E',
                color: '#f5f5f7',
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </>
  );
};

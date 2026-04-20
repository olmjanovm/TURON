import React, { useEffect, useRef, useState } from 'react';
import { useNotifyCustomer } from '../../hooks/queries/useOrders';
import { formatPhoneForCallButton, initiateCall } from '../../lib/callUtils';

interface CallActionSheetProps {
  orderId: string;
  customerName: string;
  customerPhone: string | null | undefined;
  onClose: () => void;
}

type ActiveAction = 'telegram' | 'phone' | null;

export function CallActionSheet({
  orderId,
  customerName,
  customerPhone,
  onClose,
}: CallActionSheetProps) {
  const notifyMutation = useNotifyCustomer();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [sentAction, setSentAction] = useState<ActiveAction>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    el.style.transform = 'translateY(100%)';
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.32s cubic-bezier(0.32,0.72,0,1)';
      el.style.transform = 'translateY(0)';
    });
  }, []);

  const closeWithAnimation = () => {
    const el = sheetRef.current;
    if (!el) {
      onClose();
      return;
    }

    el.style.transform = 'translateY(100%)';
    window.setTimeout(onClose, 180);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeWithAnimation();
    }
  };

  const handleTelegramNotify = async () => {
    const tg = window.Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred?.('light');

    setErrorText(null);
    setActiveAction('telegram');

    try {
      await notifyMutation.mutateAsync({ id: orderId, method: 'telegram_message' });
      setSentAction('telegram');
      tg?.HapticFeedback?.notificationOccurred?.('success');
      window.setTimeout(closeWithAnimation, 650);
    } catch {
      tg?.HapticFeedback?.notificationOccurred?.('error');
      setErrorText("Telegram xabar yuborilmadi. Bot yoki mijoz Telegram ID'sini tekshiring.");
    } finally {
      setActiveAction(null);
    }
  };

  const handlePhoneCall = async () => {
    const tg = window.Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred?.('medium');

    if (!customerPhone) {
      tg?.showAlert?.("Mijoz telefon raqami topilmadi.");
      setErrorText("Mijoz telefon raqami topilmadi.");
      return;
    }

    setErrorText(null);
    setActiveAction('phone');

    try {
      await notifyMutation.mutateAsync({ id: orderId, method: 'phone_call' });
      setSentAction('phone');
    } catch {
      // Phone fallback is still allowed; the global call confirm protects accidental calls.
      setErrorText("Telegram ogohlantirish yuborilmadi, ammo telefon qo'ng'iroqni davom ettirish mumkin.");
    } finally {
      setActiveAction(null);
      closeWithAnimation();
      window.setTimeout(() => initiateCall(customerPhone, customerName || 'mijoz'), 220);
    }
  };

  const formattedPhone = customerPhone ? formatPhoneForCallButton(customerPhone) : null;
  const isBusy = activeAction !== null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(5,8,18,0.42) 0%, rgba(5,8,18,0.78) 100%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        ref={sheetRef}
        style={{
          width: '100%',
          maxWidth: 430,
          margin: '0 auto',
          background: '#151722',
          borderRadius: '24px 24px 0 0',
          padding: '12px 16px calc(env(safe-area-inset-bottom,0px) + 20px)',
          boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 -24px 70px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            width: 42,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.18)',
            margin: '2px auto 18px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(91,127,255,0.28), rgba(45,212,160,0.18))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a0b0ff" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#e8ecff' }}>
              {customerName || 'Mijoz'} bilan bog'lanish
            </div>
            <div style={{ fontSize: 12, color: '#8b93aa', marginTop: 4, lineHeight: 1.45 }}>
              Avval Telegram orqali xabar yuboramiz. Telefon qo'ng'iroqda mijozga oldindan ogohlantirish ketadi.
            </div>
          </div>
        </div>

        {errorText ? (
          <div
            style={{
              marginBottom: 12,
              borderRadius: 14,
              border: '1px solid rgba(240,112,106,0.25)',
              background: 'rgba(240,112,106,0.1)',
              color: '#ffb3ae',
              fontSize: 12,
              lineHeight: 1.45,
              padding: '10px 12px',
            }}
          >
            {errorText}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleTelegramNotify()}
          disabled={isBusy}
          style={{
            width: '100%',
            padding: '14px 14px',
            background:
              sentAction === 'telegram'
                ? 'rgba(29,158,117,0.16)'
                : 'linear-gradient(135deg, rgba(91,127,255,0.18), rgba(91,127,255,0.08))',
            border: '1px solid rgba(91,127,255,0.28)',
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: isBusy ? 'wait' : 'pointer',
            marginBottom: 10,
            textAlign: 'left',
            opacity: isBusy && activeAction !== 'telegram' ? 0.62 : 1,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: '#229ed9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 10px 22px rgba(34,158,217,0.3)',
            }}
          >
            <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.608c-.153.676-.553.84-1.12.522l-3.1-2.285-1.496 1.44c-.165.165-.304.304-.623.304l.223-3.16 5.75-5.193c.25-.222-.054-.346-.386-.124l-7.106 4.474-3.059-.955c-.664-.207-.677-.664.139-.982l11.946-4.605c.553-.2 1.036.135.872.956z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8ecff' }}>
              {activeAction === 'telegram' ? 'Yuborilmoqda...' : 'Telegram xabar yuborish'}
            </div>
            <div style={{ fontSize: 11, color: '#8b93aa', marginTop: 3 }}>
              Mijoz bot orqali ko'radi, raqam oshkor bo'lmaydi
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#2dd4a0',
              background: 'rgba(29,158,117,0.15)',
              borderRadius: 999,
              padding: '4px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            Tavsiya
          </span>
        </button>

        <button
          type="button"
          onClick={() => void handlePhoneCall()}
          disabled={isBusy || !customerPhone}
          style={{
            width: '100%',
            padding: '14px 14px',
            background: customerPhone ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${customerPhone ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: isBusy ? 'wait' : customerPhone ? 'pointer' : 'not-allowed',
            textAlign: 'left',
            opacity: isBusy && activeAction !== 'phone' ? 0.62 : 1,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              background: customerPhone ? 'rgba(245,166,35,0.14)' : 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={customerPhone ? '#f5a623' : '#555b70'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1A19.5 19.5 0 013.1 11a19.8 19.8 0 01-3-8.6A2 2 0 012 .2h3a2 2 0 012 1.7c.1 1.2.4 2.4.7 3.5a2 2 0 01-.5 2L6 8.9a16 16 0 006.1 6l1.5-1.5a2 2 0 012-.5c1.1.3 2.3.6 3.5.7a2 2 0 011.9 2z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: customerPhone ? '#e8ecff' : '#555b70' }}>
              {activeAction === 'phone' ? 'Ogohlantirilmoqda...' : "Telefon qo'ng'iroq"}
            </div>
            <div style={{ fontSize: 11, color: '#8b93aa', marginTop: 3 }}>
              {formattedPhone ?? "Mijoz raqami ko'rsatilmagan"}
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#f5a623', whiteSpace: 'nowrap' }}>
            SIM orqali
          </span>
        </button>

        <button
          type="button"
          onClick={closeWithAnimation}
          disabled={isBusy}
          style={{
            width: '100%',
            padding: '15px 16px 4px',
            background: 'transparent',
            border: 'none',
            color: '#8b93aa',
            fontSize: 14,
            cursor: isBusy ? 'wait' : 'pointer',
          }}
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}

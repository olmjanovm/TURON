import React, { useEffect, useRef } from 'react';
import { useNotifyCustomer } from '../../hooks/queries/useOrders';
import { dialPhoneNumber, formatPhoneForCallButton } from '../../lib/callUtils';

interface CallActionSheetProps {
  orderId: string;
  customerPhone: string | null | undefined;
  onClose: () => void;
}

export function CallActionSheet({ orderId, customerPhone, onClose }: CallActionSheetProps) {
  const notifyMutation = useNotifyCustomer();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Animate in
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    el.style.transform = 'translateY(100%)';
    requestAnimationFrame(() => {
      el.style.transition = 'transform 0.3s cubic-bezier(0.32,0.72,0,1)';
      el.style.transform = 'translateY(0)';
    });
  }, []);

  const handleTelegramNotify = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred?.('light');

    notifyMutation.mutate(
      { id: orderId },
      {
        onSuccess: () => {
          tg?.HapticFeedback?.notificationOccurred?.('success');
          onClose();
        },
        onError: () => {
          tg?.HapticFeedback?.notificationOccurred?.('error');
        },
      },
    );
  };

  const handlePhoneCall = () => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.impactOccurred?.('medium');
    if (customerPhone) {
      dialPhoneNumber(customerPhone);
    }
    onClose();
  };

  const formattedPhone = customerPhone ? formatPhoneForCallButton(customerPhone) : null;

  return (
    <div
      onClick={onBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        ref={sheetRef}
        style={{
          width: '100%',
          background: '#1a1d2e',
          borderRadius: '20px 20px 0 0',
          padding: '20px 16px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.2)',
            margin: '0 auto 20px',
          }}
        />

        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
          Mijozga bog'lanish
        </div>
        <div style={{ fontSize: 12, color: '#7c8099', marginBottom: 20 }}>
          Yetkazib berish yaqinlashmoqda — mijozni xabardor qiling
        </div>

        {/* Option 1: Telegram notification */}
        <button
          onClick={handleTelegramNotify}
          disabled={notifyMutation.isPending}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: notifyMutation.isPending ? 'rgba(29,158,117,0.4)' : 'rgba(29,158,117,0.15)',
            border: '1px solid rgba(29,158,117,0.3)',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: notifyMutation.isPending ? 'wait' : 'pointer',
            marginBottom: 10,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#229ed9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* Telegram icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.04 9.608c-.153.676-.553.84-1.12.522l-3.1-2.285-1.496 1.44c-.165.165-.304.304-.623.304l.223-3.16 5.75-5.193c.25-.222-.054-.346-.386-.124l-7.106 4.474-3.059-.955c-.664-.207-.677-.664.139-.982l11.946-4.605c.553-.2 1.036.135.872.956z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {notifyMutation.isPending ? 'Yuborilmoqda...' : 'Telegram xabar yuborish'}
            </div>
            <div style={{ fontSize: 11, color: '#7c8099', marginTop: 2 }}>
              Tavsiya etiladi — tarix saqlanadi
            </div>
          </div>
        </button>

        {/* Option 2: Phone call */}
        <button
          onClick={handlePhoneCall}
          disabled={!customerPhone}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: customerPhone ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${customerPhone ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: customerPhone ? 'pointer' : 'not-allowed',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: customerPhone ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={customerPhone ? '#fff' : '#4a4f6a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.66A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.94 6.94l1.52-1.52a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: customerPhone ? '#fff' : '#4a4f6a' }}>
              Telefon orqali qo'ng'iroq
            </div>
            <div style={{ fontSize: 11, color: '#7c8099', marginTop: 2 }}>
              {formattedPhone ?? "Mijoz raqami ko'rsatilmagan"}
            </div>
          </div>
        </button>

        {/* Cancel */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'transparent',
            border: 'none',
            color: '#7c8099',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}
